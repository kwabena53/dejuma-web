import { test, expect } from '@playwright/test';

test.describe('Add Client Navigation Test', () => {
  const testEmail = 'kwabenaadudarkwa@gmail.com';
  const testPassword = '37Hospital4../';

  test('Should navigate to add client page without redirecting to welcome', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'log' || msg.type() === 'error' || msg.type() === 'warn') {
        console.log(`[${msg.type().toUpperCase()}]:`, msg.text());
      }
    });

    console.log('🧪 Testing add client navigation...');

    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForTimeout(5000);

    console.log('📍 Current URL after login:', page.url());

    // Should be on dashboard (onboarding completed)
    if (page.url().includes('/dashboard')) {
      console.log('✅ On dashboard as expected');

      // Look for "Add Client" button/link
      const addClientLink = page.getByRole('link', { name: /add client/i });
      
      if (await addClientLink.isVisible()) {
        console.log('🔍 Found "Add Client" link on dashboard');
        
        // Click the add client link
        await addClientLink.click();
        
        // Wait for navigation
        await page.waitForTimeout(3000);
        
        // Check where we ended up
        const currentUrl = page.url();
        console.log('📍 URL after clicking Add Client:', currentUrl);
        
        if (currentUrl.includes('/clients/add')) {
          console.log('✅ Successfully navigated to add client page');
          
          // Wait a bit more to see if there are any redirects
          await page.waitForTimeout(3000);
          
          if (page.url().includes('/clients/add')) {
            console.log('✅ Stayed on add client page - no unwanted redirects');
          } else {
            console.log('❌ Redirected away from add client page to:', page.url());
          }
        } else if (currentUrl.includes('/welcome')) {
          console.log('❌ Incorrectly redirected to welcome page');
        } else {
          console.log('❓ Unexpected navigation to:', currentUrl);
        }
        
        // Take screenshot of final state
        await page.screenshot({ path: 'test-results/add-client-navigation.png', fullPage: true });
      } else {
        console.log('❌ Add Client link not found on dashboard');
        await page.screenshot({ path: 'test-results/dashboard-no-add-client.png', fullPage: true });
      }
    } else if (page.url().includes('/welcome')) {
      console.log('❌ Incorrectly redirected to welcome page after login');
      await page.screenshot({ path: 'test-results/unexpected-welcome.png', fullPage: true });
    } else {
      console.log('❓ Unexpected page after login:', page.url());
    }
  });

  test('Check onboarding status in browser storage', async ({ page }) => {
    console.log('🔍 Checking browser storage for onboarding status...');

    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForTimeout(5000);

    // Check localStorage and sessionStorage
    const localStorage = await page.evaluate(() => {
      const storage = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        storage[key] = localStorage.getItem(key);
      }
      return storage;
    });

    const sessionStorage = await page.evaluate(() => {
      const storage = {};
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        storage[key] = sessionStorage.getItem(key);
      }
      return storage;
    });

    console.log('📦 localStorage:', JSON.stringify(localStorage, null, 2));
    console.log('📦 sessionStorage:', JSON.stringify(sessionStorage, null, 2));

    // Check if there's any onboarding-related data
    const hasOnboardingData = Object.keys(localStorage).some(key => 
      key.includes('onboard') || key.includes('complete')
    ) || Object.keys(sessionStorage).some(key => 
      key.includes('onboard') || key.includes('complete')
    );

    console.log('🎯 Has onboarding data in storage:', hasOnboardingData);
  });
});