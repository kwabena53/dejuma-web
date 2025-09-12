import { test, expect, Page } from '@playwright/test';

test.describe('Debug Flow', () => {
  const testEmail = 'kwabenaadudarkwa@gmail.com';
  const testPassword = '37Hospital4../';

  test('Debug welcome flow with console logging', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'log' || msg.type() === 'error' || msg.type() === 'warn') {
        console.log(`[${msg.type().toUpperCase()}]:`, msg.text());
      }
    });

    console.log('🚀 Starting debug flow...');

    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForTimeout(5000);

    // Check if we're on welcome page
    if (page.url().includes('/welcome')) {
      console.log('📍 On welcome page, starting onboarding...');
      
      // Fill personal info if needed
      const fullNameInput = page.locator('input[placeholder*="name"], input[placeholder*="Name"]');
      if (await fullNameInput.isVisible()) {
        await fullNameInput.fill('Kwabena Adudarkwa');
        await page.locator('input[placeholder*="phone"]').fill('+1234567890');
        await page.getByRole('button', { name: /continue/i }).click();
        await page.waitForTimeout(3000);
      }

      // Fill company info
      const companyNameInput = page.locator('input[placeholder="Enter your company name"]');
      if (await companyNameInput.isVisible()) {
        await companyNameInput.fill('Debug Handyman Co');
        await page.locator('textarea[placeholder*="address"]').fill('123 Debug Street');
        await page.selectOption('select', 'General Handyman Services');
        
        console.log('📝 About to submit company info...');
        await page.getByRole('button', { name: /complete setup/i }).click();
        
        // Wait and watch for console logs
        console.log('⏳ Waiting for completion and redirect...');
        await page.waitForTimeout(8000);
        
        console.log('📍 Final URL after completion:', page.url());
      }
    } else {
      console.log('📍 Not on welcome page, current URL:', page.url());
    }

    // Take screenshot of final state
    await page.screenshot({ path: 'test-results/debug-final-state.png', fullPage: true });
  });
});