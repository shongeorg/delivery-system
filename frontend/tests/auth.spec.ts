import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should load login page', async ({ page }) => {
    await page.goto('/login');
    
    await expect(page.getByText('Login')).toBeVisible();
    await expect(page.getByPlaceholder('Email')).toBeVisible();
    await expect(page.getByPlaceholder('Password', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Register' })).toBeVisible();
  });

  test('should load register page', async ({ page }) => {
    await page.goto('/register');
    
    await expect(page.getByText('Register')).toBeVisible();
    await expect(page.getByPlaceholder('Full Name')).toBeVisible();
    await expect(page.getByPlaceholder('Email')).toBeVisible();
    await expect(page.getByPlaceholder('Password', { exact: true })).toBeVisible();
    await expect(page.getByPlaceholder('Confirm Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Register' })).toBeVisible();
  });

  test('should navigate between login and register', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: 'Register' }).click();
    await expect(page.url()).toContain('/register');
    
    await page.goto('/register');
    await page.getByRole('link', { name: 'Login' }).click();
    await expect(page.url()).toContain('/login');
  });
});
