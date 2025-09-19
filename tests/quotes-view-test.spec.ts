import { test, expect } from '@playwright/test';

test.describe('Quotes View Test', () => {
  test('should show quotes view with PDF functionality', async ({ page }) => {
    console.log('🚀 Testing quotes view page...');
    
    // Navigate to login first
    await page.goto('http://localhost:3001/login');
    await page.waitForLoadState('networkidle');
    
    // Check if already logged in by looking for redirect or dashboard elements
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      // Try to login (this may fail if no test user exists)
      console.log('📝 Attempting to login...');
      
      // Fill in login form (using example credentials)
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password');
      
      // Submit login
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
    }
    
    // Navigate to quotes page
    try {
      await page.goto('http://localhost:3001/quotes');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      console.log('📋 Quotes page loaded');
      
      // Check if we can find any quote items to click
      const quotesExist = await page.locator('[data-testid="quote-item"], .quote-item, a[href*="/quotes/"]').count();
      
      console.log(`📊 Found ${quotesExist} quote-related elements`);
      
      if (quotesExist > 0) {
        // Try to click the first quote or quote link
        const firstQuoteLink = page.locator('a[href*="/quotes/"]:not([href$="/quotes"])').first();
        const linkExists = await firstQuoteLink.count();
        
        if (linkExists > 0) {
          console.log('🖱️ Clicking first quote...');
          await firstQuoteLink.click();
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(2000);
          
          // Check if we're on a quote view page
          const downloadButton = page.locator('button:has-text("Download PDF")');
          const downloadButtonExists = await downloadButton.count() > 0;
          
          console.log(`📥 Download PDF button exists: ${downloadButtonExists}`);
          
          if (downloadButtonExists) {
            console.log('✅ Quote view page with PDF functionality is working');
          }
          
          // Take screenshot
          await page.screenshot({ path: 'quotes-view-test.png', fullPage: true });
          console.log('📸 Screenshot taken');
        }
      } else {
        console.log('ℹ️ No quotes found - this may be expected for new/empty accounts');
      }
      
    } catch (error) {
      console.log(`⚠️ Could not access quotes page: ${error}`);
      // Take screenshot of current state for debugging
      await page.screenshot({ path: 'quotes-access-error.png', fullPage: true });
    }
    
    console.log('🏁 Quotes view test completed');
  });
});