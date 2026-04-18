import { expect, test } from '@playwright/test';

test.describe('Smoke: public UI routes', () => {
  test('login page renders title, email and password fields', async ({ page }) => {
    await page.goto('/app/login');
    await expect(page.getByText('Besedki EMIN')).toBeVisible();
    await expect(page.getByLabel('Логин')).toBeVisible();
    await expect(page.getByLabel('Пароль')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Войти', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Войти через Telegram' })).toBeVisible();
  });

  test('empty submit keeps user on the login route', async ({ page }) => {
    await page.goto('/app/login');
    await page.getByRole('button', { name: 'Войти', exact: true }).click();
    await expect(page).toHaveURL(/\/app\/login/);
  });

  test('toggling Telegram login reveals code-request button', async ({ page }) => {
    await page.goto('/app/login');
    await page.getByRole('button', { name: 'Войти через Telegram' }).click();
    await expect(page.getByRole('button', { name: 'Получить код для Telegram' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Назад к обычному входу' })).toBeVisible();
  });
});
