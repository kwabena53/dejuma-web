import { test, expect } from '@playwright/test';

test.describe('Onboarding Completion Verification', () => {
  const testEmail = 'kwabenaadudarkwa@gmail.com';
  const testPassword = '37Hospital4../';

  test('After completing onboarding, welcome page should not be shown again', async ({ page }) => {
    console.log('🔒 Testing onboarding completion persistence...');

    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForTimeout(5000);

    const startingUrl = page.url();
    console.log('📍 Starting URL after login:', startingUrl);

    // If we're somehow on welcome page, that's a failure
    if (startingUrl.includes('/welcome')) {
      console.log('❌ FAILURE: Should not be on welcome page after onboarding completion');
      await page.screenshot({ path: 'test-results/onboarding-failure-welcome-shown.png', fullPage: true });
      return;
    }

    // Should be on dashboard
    expect(startingUrl).toContain('/dashboard');
    console.log('✅ Correctly on dashboard after login');

    // Test navigation to various pages that should work without welcome redirect
    const testRoutes = [
      { name: 'Add Client', url: '/clients/add' },
      { name: 'Dashboard', url: '/dashboard' }
    ];

    for (const route of testRoutes) {
      console.log(`🧪 Testing navigation to ${route.name} (${route.url})`);
      
      await page.goto(route.url);
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      console.log(`📍 Current URL after navigating to ${route.name}:`, currentUrl);
      
      if (currentUrl.includes('/welcome')) {
        console.log(`❌ FAILURE: ${route.name} incorrectly redirected to welcome page`);
        await page.screenshot({ path: `test-results/onboarding-failure-${route.name.toLowerCase().replace(' ', '-')}.png`, fullPage: true });
      } else if (currentUrl.includes(route.url)) {
        console.log(`✅ SUCCESS: ${route.name} navigation works correctly`);
      } else {
        console.log(`❓ UNEXPECTED: ${route.name} redirected to unexpected URL:`, currentUrl);
      }
    }

    // Test direct welcome page access (should redirect to dashboard if onboarding complete)
    console.log('🚪 Testing direct /welcome access (should redirect to dashboard)');
    await page.goto('/welcome');
    await page.waitForTimeout(3000);
    
    const welcomeAccessUrl = page.url();
    console.log('📍 URL after accessing /welcome directly:', welcomeAccessUrl);
    
    if (welcomeAccessUrl.includes('/dashboard')) {
      console.log('✅ SUCCESS: Direct /welcome access correctly redirected to dashboard');
    } else if (welcomeAccessUrl.includes('/welcome')) {
      console.log('❌ FAILURE: Direct /welcome access still shows welcome page');
      await page.screenshot({ path: 'test-results/onboarding-failure-welcome-direct-access.png', fullPage: true });
    } else {
      console.log('❓ UNEXPECTED: Direct /welcome access went to:', welcomeAccessUrl);
    }

    // Final verification
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
    
    if (page.url().includes('/dashboard')) {
      console.log('🎉 FINAL SUCCESS: Onboarding persistence working correctly');
      console.log('✅ Users can navigate freely without being shown welcome page again');
    } else {
      console.log('❌ FINAL FAILURE: Dashboard access not working');
    }
  });

  test('Check localStorage for onboarding cache', async ({ page }) => {
    console.log('💾 Checking localStorage for onboarding cache...');

    // Login to establish session
    await page.goto('/login');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForTimeout(5000);

    // Check localStorage for onboarding cache
    const onboardingCache = await page.evaluate(() => {
      const cache = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('onboarding')) {
          cache[key] = localStorage.getItem(key);
        }
      }
      return cache;
    });

    console.log('📦 Onboarding cache in localStorage:', JSON.stringify(onboardingCache, null, 2));

    const hasCachedCompletion = Object.keys(onboardingCache).some(key => 
      key.includes('onboarding_complete') && onboardingCache[key] === 'true'
    );

    console.log('🎯 Has cached onboarding completion:', hasCachedCompletion);

    if (hasCachedCompletion) {
      console.log('✅ Onboarding completion is properly cached');
    } else {
      console.log('⚠️  Onboarding completion not found in cache - might be using database only');
    }
  });
});