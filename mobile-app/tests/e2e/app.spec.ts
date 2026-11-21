import { expect, test } from '@playwright/test';

test('renders the login screen', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Delivery System')).toBeVisible();
  await expect(page.getByText('Увійти')).toBeVisible();
});
