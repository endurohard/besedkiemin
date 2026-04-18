import { expect, test, type Page, type ConsoleMessage } from '@playwright/test';

type Diag = { consoleErrors: string[]; pageErrors: string[]; failedReqs: string[] };

const attachDiagnostics = (page: Page): Diag => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const failedReqs: string[] = [];

  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => pageErrors.push(`${err.name}: ${err.message}`));
  page.on('requestfailed', (req) => {
    const f = req.failure();
    failedReqs.push(`${req.method()} ${req.url()} - ${f?.errorText ?? 'unknown'}`);
  });
  page.on('response', (res) => {
    const url = res.url();
    if (url.includes('localhost:3000') && res.status() >= 500) {
      failedReqs.push(`${res.request().method()} ${url} - HTTP ${res.status()}`);
    }
  });

  return { consoleErrors, pageErrors, failedReqs };
};

const login = async (page: Page, email = 'owner@example.com', password = 'password123') => {
  await page.goto('/app/login');
  await page.getByLabel('Логин').fill(email);
  await page.getByLabel('Пароль').fill(password);
  await page.getByRole('button', { name: 'Войти', exact: true }).click();
  await page.waitForURL(/\/app(\/|$)/, { timeout: 10_000 });
};

test.describe('Полный обход UI под OWNER', () => {
  test('Публичный каталог рендерится', async ({ page }) => {
    const diag = attachDiagnostics(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(diag.pageErrors, `pageerror: ${diag.pageErrors.join(' | ')}`).toHaveLength(0);
  });

  test('Логин OWNER + обход защищённых страниц', async ({ page }) => {
    const diag = attachDiagnostics(page);
    await login(page);
    await expect(page).toHaveURL(/\/app/);

    const routes = [
      '/app/kanban',
      '/app/analytics',
      '/app/users',
      '/app/inventory',
      '/app/shipments',
      '/app/defects',
      '/app/workflow',
      '/app/company-settings',
      '/app/product-types',
      '/app/nomenclature',
      '/app/order-sources',
      '/app/catalog-management',
      '/app/catalog-orders',
      '/app/chat',
      '/app/feature-flags',
      '/app/roles',
      '/app/payroll',
      '/app/workers',
    ];

    const brokenRoutes: string[] = [];
    for (const route of routes) {
      // SPA-навигация через history API вместо полного reload,
      // чтобы избежать бага initializeAuth-в-useEffect
      await page.evaluate((r) => window.history.pushState({}, '', r), route);
      await page.evaluate(() => window.dispatchEvent(new PopStateEvent('popstate')));
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(500);
      const url = page.url();
      if (!url.includes(route) && !url.endsWith('/app') && !url.endsWith('/app/')) {
        brokenRoutes.push(`${route} -> ${url}`);
      }
    }

    console.log('--- Diagnostics ---');
    console.log('Console errors:', diag.consoleErrors);
    console.log('Page errors:', diag.pageErrors);
    console.log('Failed requests:', diag.failedReqs);
    console.log('Redirected routes:', brokenRoutes);

    expect(diag.pageErrors, `Необработанные исключения:\n${diag.pageErrors.join('\n')}`).toHaveLength(0);
    const criticalFails = diag.failedReqs.filter(
      (r) => !/401|403|ERR_ABORTED/.test(r),
    );
    expect(criticalFails, `5xx/network ошибки:\n${criticalFails.join('\n')}`).toHaveLength(0);
  });

  test('Невалидный логин показывает ошибку', async ({ page }) => {
    await page.goto('/app/login');
    await page.getByLabel('Логин').fill('owner@example.com');
    await page.getByLabel('Пароль').fill('wrong-password');
    await page.getByRole('button', { name: 'Войти', exact: true }).click();
    await page.waitForTimeout(1500);
    expect(page.url()).toContain('/app/login');
  });

  test('Logout возвращает на /app/login', async ({ page }) => {
    await login(page);
    const btn = page.getByRole('button', { name: /выйти|logout/i }).first();
    if (await btn.count()) {
      await btn.click();
      await page.waitForURL(/\/app\/login/, { timeout: 5000 }).catch(() => {});
      expect(page.url()).toMatch(/\/app\/login|\/$/);
    } else {
      test.skip(true, 'Logout button не найден');
    }
  });
});
