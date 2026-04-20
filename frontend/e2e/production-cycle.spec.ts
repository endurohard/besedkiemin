import { expect, test, type Page, type BrowserContext } from '@playwright/test';
import axios from 'axios';

/**
 * Полный цикл производства через UI — эмуляция действий реальных пользователей.
 *
 * Шаги:
 *   1. Через API — manager создаёт заказ и товар с stageAssignments
 *      (CreateOrderModal в UI — слишком много полей, фикстуры быстрее).
 *   2. Через UI под каждой ролью — вход, переход к задачам,
 *      клики «Принять» → «Завершить» → (авто-«Передать») → выход.
 *   3. Складист — принимает на склад (ApproveForm) через UI.
 *   4. В конце — OWNER видит продукт/заказ в COMPLETED.
 */

const API = process.env.API_URL || 'http://localhost:3000';
const PASSWORD = 'password123';

const EMAILS = {
  manager: 'manager@example.com',
  owner: 'owner@example.com',
  preparer: 'preparer@example.com',
  painter: 'painter@example.com',
  assembler: 'assembler@example.com',
  warehouse: 'warehouse@example.com',
};

async function apiLogin(email: string) {
  const { data } = await axios.post(`${API}/auth/login`, { email, password: PASSWORD });
  return axios.create({
    baseURL: API,
    headers: { Authorization: `Bearer ${data.access_token}` },
    validateStatus: () => true,
  });
}

async function login(page: Page, email: string) {
  await page.goto('/app/login');
  await page.getByLabel('Логин').fill(email);
  await page.getByLabel('Пароль').fill(PASSWORD);
  await page.getByRole('button', { name: 'Войти', exact: true }).click();
  await page.waitForURL(/\/app(?!\/login)/, { timeout: 15_000 });
}

async function logout(page: Page) {
  const btn = page.getByRole('button', { name: /выйти|logout/i }).first();
  if (await btn.count()) {
    await btn.click().catch(() => {});
    await page.waitForURL(/\/app\/login|\/$/, { timeout: 5_000 }).catch(() => {});
  }
  // clean storage to avoid rehydration side-effects
  await page.context().clearCookies();
  await page.goto('/app/login');
  await page.evaluate(() => window.localStorage.clear());
}

/**
 * Найти карточку задачи по имени продукта.
 * Ищем h3 с текстом "<productName> - <stage>" и возвращаем
 * ближайший предок с классом rounded-lg (это Card wrapper).
 */
async function findTaskCardByTitle(page: Page, productName: string, fragment?: string) {
  const needle = fragment ? `${productName} - ${fragment}` : productName;
  const title = page.getByRole('heading', { name: needle, exact: false }).first();
  try {
    await expect(title, `title "${needle}" must be visible`).toBeVisible({ timeout: 20_000 });
  } catch (err) {
    // diagnostics: dump DOM and screenshot before failing
    const html = await page.locator('body').innerHTML().catch(() => '<unavailable>');
    const visibleTitles = await page.getByRole('heading').allTextContents().catch(() => []);
    // eslint-disable-next-line no-console
    console.error('[findTaskCardByTitle] needle not found:', needle, '\nheadings:', visibleTitles, '\nURL:', page.url());
    await page.screenshot({ path: `test-results/missing-${Date.now()}.png`, fullPage: true }).catch(() => {});
    // write truncated html to surface via CI logs
    // eslint-disable-next-line no-console
    console.error('[findTaskCardByTitle] html head:', html.slice(0, 2000));
    throw err;
  }
  // Card wrapper = ближайший предок с классом "rounded-lg" (Card компонент).
  const card = title.locator('xpath=ancestor::div[contains(@class,"rounded-lg")][1]');
  await expect(card).toBeVisible();
  return card;
}

async function walkStageViaUI(page: Page, email: string, productName: string, stageLabel: string) {
  await login(page, email);
  await page.goto('/app');
  // Дожидаемся появления хотя бы одной задачи или сообщения "нет задач".
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(500); // React-Query refetch + render

  const card = await findTaskCardByTitle(page, productName, stageLabel);

  // Принять (кнопка внутри карточки)
  const acceptBtn = card.getByRole('button', { name: /^Принять$/ }).first();
  await expect(acceptBtn).toBeVisible({ timeout: 10_000 });
  await acceptBtn.click();

  // У simplified-ролей (preparer/painter/sewer/assembler) открывается модалка
  // выбора сотрудника — подтверждаем. В селекте по умолчанию уже выбран
  // currentUser, поэтому кнопка "Принять N шт." сразу активна.
  const modalConfirm = page.getByRole('button', { name: /^Принять \d+ шт\.$/ }).first();
  if (await modalConfirm.isVisible({ timeout: 2000 }).catch(() => false)) {
    await modalConfirm.click();
    // ждём закрытия модала
    await expect(modalConfirm).toBeHidden({ timeout: 5000 }).catch(() => {});
  }

  // После принятия — кнопка «Завершить» внутри карточки.
  // completeMutation у simplified-ролей сразу вызывает passTask после
  // complete, поэтому карточка уходит из /tasks/my текущего работника.
  const completeBtn = card.getByRole('button', { name: /^Завершить$/ }).first();
  await expect(completeBtn).toBeVisible({ timeout: 10_000 });
  await completeBtn.click();

  // Ждём, пока карточка исчезнет из DOM (task передана дальше).
  await expect(card).toBeHidden({ timeout: 15_000 }).catch(async () => {
    // fallback: возможно кнопка просто сменилась на "Передать" (not simplified)
    const passBtn = card.getByRole('button', { name: /^Передать$/ }).first();
    if (await passBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await passBtn.click();
      await expect(card).toBeHidden({ timeout: 10_000 }).catch(() => {});
    }
  });

  await logout(page);
}

test.setTimeout(180_000);

test.describe('Полный производственный цикл через UI', () => {
  test('Order → PREPARATION → PAINTING → ASSEMBLY → QC (approve) → COMPLETED', async ({ page }) => {
    // ---------- Setup via API ----------
    const managerApi = await apiLogin(EMAILS.manager);
    const ownerApi = await apiLogin(EMAILS.owner);

    const usersRes = await ownerApi.get('/users');
    expect(usersRes.status, 'users/list').toBe(200);
    const users: Array<{ id: string; email: string }> = usersRes.data;
    const idOf = (email: string) => users.find((u) => u.email === email)?.id;
    const preparerId = idOf(EMAILS.preparer)!;
    const painterId = idOf(EMAILS.painter)!;
    const assemblerId = idOf(EMAILS.assembler)!;
    expect(preparerId && painterId && assemblerId, 'all worker ids resolved').toBeTruthy();

    const ptRes = await managerApi.get('/product-types');
    const pt =
      ptRes.data.find((p: any) => p.name === 'Стол' && p.requiresSewing === false) ||
      ptRes.data.find((p: any) => p.requiresSewing === false);
    expect(pt, 'product type without sewing').toBeTruthy();

    const orderRes = await managerApi.post('/orders', {
      customerName: 'UI E2E Клиент',
      customerPhone: '+79991234567',
      customerAddress: 'Москва, UI тест 1',
      description: 'Full production cycle via UI',
      priority: 'NORMAL',
      totalAmount: 25000,
    });
    expect(orderRes.status, 'order created').toBeLessThan(300);
    const orderId = orderRes.data.id;

    const productName = `UI E2E ${Date.now()}`;
    const prodRes = await managerApi.post('/products', {
      name: productName,
      productTypeId: pt.id,
      orderId,
      quantity: 1,
      requiresSewing: false,
      dimensions: '100x50x70',
      color: 'Дуб',
      stageAssignments: {
        PREPARATION: preparerId,
        PAINTING: painterId,
        ASSEMBLY: assemblerId,
      },
    });
    expect(prodRes.status, 'product created').toBeLessThan(300);
    const productId = prodRes.data.id;

    // ---------- UI walk — PREPARATION ----------
    await walkStageViaUI(page, EMAILS.preparer, productName, 'Заготовка');

    // ---------- UI walk — PAINTING ----------
    await walkStageViaUI(page, EMAILS.painter, productName, 'Покраска');

    // ---------- UI walk — ASSEMBLY ----------
    await walkStageViaUI(page, EMAILS.assembler, productName, 'Сборка');

    // ---------- UI walk — QUALITY CHECK (warehouse approves) ----------
    await login(page, EMAILS.warehouse);
    await page.goto('/app');
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(500);

    const qcCard = await findTaskCardByTitle(page, productName, 'Склад');
    // Складист видит «Принять» / «Брак» — нажимаем «Принять»
    const approveOpenBtn = qcCard.getByRole('button', { name: /^Принять$/ }).first();
    await expect(approveOpenBtn).toBeVisible({ timeout: 10_000 });
    await approveOpenBtn.click();

    // Разворачивается форма с кнопкой «Подтвердить»
    const approveConfirm = qcCard.getByRole('button', { name: /^Подтвердить$/ }).first();
    await expect(approveConfirm).toBeVisible({ timeout: 5_000 });
    await approveConfirm.click();

    // Ждём исчезновения карточки — задача уходит из my-tasks склада
    await expect(qcCard).toBeHidden({ timeout: 15_000 }).catch(() => {});
    await page.waitForTimeout(1000);

    // ---------- Verify via API ----------
    const finalProd = await managerApi.get(`/products/${productId}`);
    expect(finalProd.status).toBe(200);
    expect(finalProd.data.stage, 'product stage').toBe('COMPLETED');

    const finalOrder = await managerApi.get(`/orders/${orderId}`);
    expect(finalOrder.status).toBe(200);
    expect(finalOrder.data.status, 'order status').toBe('COMPLETED');
  });
});
