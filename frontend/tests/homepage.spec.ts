import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load homepage with categories and products', async ({ page }) => {
    await page.goto('/');
    
    // Check header
    await expect(page.getByText('FoodDelivery')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Catalog' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Cart' })).toBeVisible();
    
    // Check hero section
    await expect(page.getByText('Delicious Food Delivered To You')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Order Now' })).toBeVisible();
    
    // Check categories
    await expect(page.getByText('Categories')).toBeVisible();
    await expect(page.getByText('Pizza')).toBeVisible();
    await expect(page.getByText('Burgers')).toBeVisible();
    await expect(page.getByText('Sushi')).toBeVisible();
    await expect(page.getByText('Salads')).toBeVisible();
    await expect(page.getByText('Desserts')).toBeVisible();
    
    // Check products
    await expect(page.getByText('Our Menu')).toBeVisible();
    await expect(page.getByText('Margherita Pizza')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add to Cart' })).toBeVisible();
  });

  test('should filter products by category', async ({ page }) => {
    await page.goto('/');
    
    // Click on Pizza category
    await page.getByText('Pizza').click();
    await expect(page.getByText('Clear filter')).toBeVisible();
    
    // Clear filter
    await page.getByText('Clear filter ✕').click();
    await expect(page.getByText('Clear filter')).not.toBeVisible();
  });

  test('should add product to cart from homepage', async ({ page }) => {
    await page.goto('/');
    
    // Add first product to cart
    const addToCartButton = page.getByRole('button', { name: 'Add to Cart' }).first();
    await addToCartButton.click();
    
    // Wait a bit for cart to update
    await page.waitForTimeout(1000);
    
    // Navigate to cart to verify
    await page.goto('/cart');
    await expect(page.getByText('Your cart is empty')).not.toBeVisible();
  });
});
