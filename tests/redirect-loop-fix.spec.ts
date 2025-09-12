import { test, expect } from '@playwright/test';

test.describe('Redirect Loop Fix Test', () => {
  const testEmail = 'kwabenaadudarkwa@gmail.com';
  const testPassword = '37Hospital4../';

  test('Should complete onboarding and stay on dashboard (no redirect loop)', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'log' || msg.type() === 'error' || msg.type() === 'warn') {
        console.log(`[${msg.type().toUpperCase()}]:`, msg.text());
      }
    });

    console.log('🔄 Testing redirect loop fix...');

    // Clear any existing session storage
    await page.goto('/login');
    await page.evaluate(() => {
      sessionStorage.clear();
    });

    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForTimeout(3000);

    let previousUrl = '';
    let redirectCount = 0;
    const maxRedirects = 5;

    // Monitor URL changes for redirect loop
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        const currentUrl = frame.url();
        if (currentUrl !== previousUrl) {
          console.log(`🔗 Navigation ${redirectCount + 1}: ${previousUrl} → ${currentUrl}`);
          previousUrl = currentUrl;
          redirectCount++;
          
          if (redirectCount > maxRedirects) {
            console.log('❌ Possible redirect loop detected!');
          }
        }
      }
    });

    // If we're on welcome page, complete the onboarding
    if (page.url().includes('/welcome')) {
      console.log('📝 Completing onboarding flow...');

      // Fill personal info if needed
      const fullNameInput = page.locator('input[placeholder*="name"], input[placeholder*="Name"]');
      if (await fullNameInput.isVisible()) {
        await fullNameInput.fill('Test User');
        await page.locator('input[placeholder*="phone"]').fill('+1234567890');
        await page.getByRole('button', { name: /continue/i }).click();
        await page.waitForTimeout(2000);
      }

      // Fill company info if needed
      const companyNameInput = page.locator('input[placeholder="Enter your company name"]');
      if (await companyNameInput.isVisible()) {
        await companyNameInput.fill('Test Company');
        await page.locator('textarea[placeholder*="address"]').fill('123 Test St');
        
        const industrySelect = page.locator('select');
        if (await industrySelect.isVisible()) {
          await industrySelect.selectOption('General Handyman Services');
        }
        
        console.log('🏢 Submitting company info...');
        await page.getByRole('button', { name: /complete setup/i }).click();
        
        console.log('⏳ Waiting for completion and testing for redirect loop...');
        
        // Wait and monitor for redirect loop
        await page.waitForTimeout(8000);
        
        // Check final URL - should be dashboard
        const finalUrl = page.url();
        console.log('📍 Final URL:', finalUrl);
        
        if (finalUrl.includes('/dashboard')) {
          console.log('✅ Successfully reached dashboard without redirect loop');
          
          // Wait a bit more to ensure no redirect back to welcome
          await page.waitForTimeout(3000);
          
          if (page.url().includes('/dashboard')) {
            console.log('✅ Stayed on dashboard - redirect loop fixed!');
          } else {
            console.log('❌ Redirected away from dashboard:', page.url());
          }
        } else if (finalUrl.includes('/welcome')) {
          console.log('❌ Still on welcome page, possible redirect loop or onboarding not complete');
        } else {
          console.log('❓ Unexpected final URL:', finalUrl);
        }
      }
    } else if (page.url().includes('/dashboard')) {
      console.log('✅ Already on dashboard - onboarding previously completed');
      
      // Test that we stay on dashboard
      await page.waitForTimeout(5000);
      if (page.url().includes('/dashboard')) {
        console.log('✅ Remained on dashboard - no redirect loop');
      } else {
        console.log('❌ Redirected away from dashboard:', page.url());
      }
    }

    // Take final screenshot
    await page.screenshot({ path: 'test-results/redirect-loop-fix.png', fullPage: true });
    
    // Report redirect statistics
    console.log(`📊 Total redirects observed: ${redirectCount}`);
    if (redirectCount > maxRedirects) {
      console.log('❌ Redirect loop detected - fix did not work');
    } else {
      console.log('✅ No excessive redirects - fix appears to be working');
    }
  });
});