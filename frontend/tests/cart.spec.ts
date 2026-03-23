import { test, expect } from '@playwright/test';

test.describe('Cart Page', () => {
  test('should load empty cart', async ({ page }) => {
    await page.goto('/cart');
    
    await expect(page.getByText('Your cart is empty')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Continue Shopping' })).toBeVisible();
  });

  test('should add product and view in cart', async ({ page }) => {
    await page.goto('/');
    
    // Add product to cart
    await page.getByRole('button', { name: 'Add to Cart' }).first().click();
    
    // Navigate to cart
    await page.waitForTimeout(1000);
    await page.goto('/cart');
    
    // Should have product in cart
    await expect(page.getByText('Your cart is empty')).not.toBeVisible();
  });
});
