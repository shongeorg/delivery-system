import { test, expect } from '@playwright/test';

test.describe('Product Detail Page', () => {
  test('should load product detail page', async ({ page }) => {
    await page.goto('/product/margherita-pizza');
    
    // Check product info
    await expect(page.getByText('Margherita Pizza')).toBeVisible();
    await expect(page.getByText(/\$\d+\.\d+/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add to Cart' })).toBeVisible();
    await expect(page.getByText('Quantity')).toBeVisible();
    
    // Check breadcrumb
    await expect(page.getByRole('link', { name: 'Back to catalog' })).toBeVisible();
  });

  test('should change quantity and add to cart', async ({ page }) => {
    await page.goto('/product/margherita-pizza');
    
    // Change quantity
    const quantityInput = page.getByRole('spinbutton');
    await quantityInput.fill('3');
    
    // Add to cart
    await page.getByRole('button', { name: 'Add to Cart' }).click();
    
    // Should still be on page
    await expect(page.getByText('Margherita Pizza')).toBeVisible();
  });

  test('should show error for non-existent product', async ({ page }) => {
    await page.goto('/product/nonexistent-product');
    
    await expect(page.getByText('Product not found')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Back to catalog' })).toBeVisible();
  });
});
