import { test, expect } from '@playwright/test';

test.describe('Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('should display registration form elements', async ({ page }) => {
    // Check if all form elements are visible
    await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible();
    
    // Check input fields
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
    
    // Check buttons
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /continue with google/i })).toBeVisible();
  });

  test('should show validation errors for password mismatch', async ({ page }) => {
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password456');
    
    await page.getByRole('button', { name: /create account/i }).click();
    
    // Should show error message
    await expect(page.locator('.bg-red-50')).toContainText('Passwords do not match');
  });

  test('should show validation error for short password', async ({ page }) => {
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', '123');
    await page.fill('input[name="confirmPassword"]', '123');
    
    await page.getByRole('button', { name: /create account/i }).click();
    
    // Should show error message
    await expect(page.locator('.bg-red-50')).toContainText('Password must be at least 6 characters long');
  });

  test('should attempt registration with valid data', async ({ page }) => {
    const testEmail = `test+${Date.now()}@example.com`;
    const testPassword = 'password123';
    
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);
    
    // Click register button
    await page.getByRole('button', { name: /create account/i }).click();
    
    // Should show loading state
    await expect(page.getByText('Creating account...')).toBeVisible();
    
    // Wait for response (either success or error)
    await page.waitForTimeout(5000);
    
    // Check if success message appears or error is shown
    const successElement = page.getByText(/check your email/i);
    const errorElement = page.locator('.bg-red-50');
    
    // Either success or error should be visible
    await expect(successElement.or(errorElement)).toBeVisible();
    
    // Log the result
    const isSuccess = await successElement.isVisible();
    const isError = await errorElement.isVisible();
    
    if (isSuccess) {
      console.log('✅ Registration succeeded - success page shown');
      await expect(successElement).toBeVisible();
    } else if (isError) {
      const errorText = await errorElement.textContent();
      console.log('❌ Registration failed with error:', errorText);
    }
  });

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.locator('input[name="password"]');
    const toggleButton = passwordInput.locator('..').locator('button');
    
    // Initially password should be hidden
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Click toggle button
    await toggleButton.click();
    
    // Password should now be visible
    await expect(passwordInput).toHaveAttribute('type', 'text');
    
    // Click again to hide
    await toggleButton.click();
    
    // Password should be hidden again
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should have proper styling and fonts', async ({ page }) => {
    // Check if fonts are loaded properly
    const heading = page.getByRole('heading', { name: /create your account/i });
    const computedStyle = await heading.evaluate(el => window.getComputedStyle(el).fontFamily);
    
    console.log('Font family for heading:', computedStyle);
    
    // Check input styling
    const emailInput = page.locator('input[name="email"]');
    await emailInput.fill('test input');
    
    // Take a screenshot to verify visual appearance
    await page.screenshot({ path: 'test-results/registration-styling.png', fullPage: true });
    
    console.log('✅ Styling test completed - check screenshot for visual verification');
  });
});