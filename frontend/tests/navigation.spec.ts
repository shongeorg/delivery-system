import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate via header', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to catalog
    await page.getByRole('link', { name: 'Catalog' }).click();
    await expect(page.url()).toContain('/catalog');
    
    // Navigate to cart
    await page.getByRole('link', { name: 'Cart' }).click();
    await expect(page.url()).toContain('/cart');
    
    // Navigate home
    await page.getByRole('link', { name: 'Home' }).click();
    await expect(page.url()).toBe('http://localhost:3031/');
  });

  test('should navigate via footer', async ({ page }) => {
    await page.goto('/');
    
    // Check footer links
    await expect(page.getByText('© 2025 FoodDelivery')).toBeVisible();
  });
});
