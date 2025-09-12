import { test, expect } from '@playwright/test';

test.describe('Welcome Form Styling Test', () => {
  const testEmail = 'kwabenaadudarkwa@gmail.com';
  const testPassword = '37Hospital4../';

  test('Verify welcome form inputs have proper styling and text visibility', async ({ page }) => {
    console.log('📝 Testing welcome form styling...');

    // Login to access welcome page
    await page.goto('/login');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForTimeout(3000);

    // Navigate to welcome page or check if we're already there
    if (!page.url().includes('/welcome')) {
      // If we're on dashboard, we need to trigger welcome flow
      // For testing purposes, let's manually go to welcome
      await page.goto('/welcome');
      await page.waitForTimeout(2000);
    }

    // Test personal info step styling
    const fullNameInput = page.locator('input[placeholder*="name"], input[placeholder*="Name"]').first();
    const phoneInput = page.locator('input[placeholder*="phone"], input[placeholder*="Phone"]').first();

    if (await fullNameInput.isVisible()) {
      console.log('✅ Personal info step found');
      
      // Fill inputs to test text visibility
      await fullNameInput.fill('Test User Name');
      await phoneInput.fill('+1234567890');
      
      // Take screenshot of personal info step
      await page.screenshot({ path: 'test-results/welcome-personal-info-styling.png', fullPage: true });
      
      // Continue to company step
      await page.getByRole('button', { name: /continue/i }).click();
      await page.waitForTimeout(2000);
    }

    // Test company info step styling
    const companyNameInput = page.locator('input[placeholder="Enter your company name"]');
    const addressInput = page.locator('textarea[placeholder*="address"]');
    const websiteInput = page.locator('input[placeholder*="website"]');
    const industrySelect = page.locator('select');

    if (await companyNameInput.isVisible()) {
      console.log('✅ Company info step found');
      
      // Fill all form fields to test text visibility
      await companyNameInput.fill('Test Company Name');
      await addressInput.fill('123 Test Street, Test City, TC 12345');
      await websiteInput.fill('https://testcompany.com');
      
      if (await industrySelect.isVisible()) {
        await industrySelect.selectOption('General Handyman Services');
      }
      
      // Take screenshot of company info step
      await page.screenshot({ path: 'test-results/welcome-company-info-styling.png', fullPage: true });
      
      console.log('✅ Company info form filled successfully');
    }

    // Compare styling with login page
    console.log('🔍 Comparing with login page styling...');
    
    // Go to login page for comparison
    await page.goto('/login');
    await page.waitForTimeout(1000);
    
    // Fill login inputs
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'testpassword');
    
    // Take screenshot of login page for styling comparison
    await page.screenshot({ path: 'test-results/login-styling-comparison.png', fullPage: true });
    
    console.log('✅ Styling test completed - check screenshots for visual verification');
    console.log('📸 Screenshots saved:');
    console.log('  - test-results/welcome-personal-info-styling.png');
    console.log('  - test-results/welcome-company-info-styling.png'); 
    console.log('  - test-results/login-styling-comparison.png');
  });

  test('Test form field focus states and transitions', async ({ page }) => {
    console.log('🎯 Testing focus states and transitions...');

    // Go directly to welcome page
    await page.goto('/welcome');
    await page.waitForTimeout(2000);

    // Test focus states on personal info inputs
    const nameInput = page.locator('input[placeholder*="name"]').first();
    if (await nameInput.isVisible()) {
      // Focus on name input
      await nameInput.focus();
      await page.waitForTimeout(500);
      
      // Take screenshot of focused state
      await page.screenshot({ path: 'test-results/welcome-input-focused.png' });
      
      // Type to test text visibility
      await nameInput.fill('Testing Text Visibility');
      await page.waitForTimeout(500);
      
      // Take screenshot with text
      await page.screenshot({ path: 'test-results/welcome-input-with-text.png' });
      
      console.log('✅ Focus state and text visibility tested');
    }
  });
});