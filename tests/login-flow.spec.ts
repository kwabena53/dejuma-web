import { test, expect } from '@playwright/test';

test.describe('Login Flow Test', () => {
  test('should test login with provided credentials', async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:3001/login');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Login page loaded successfully');
    
    // Check if the page has loaded by looking for text content
    const pageContent = await page.textContent('body');
    console.log('Page contains "Welcome back":', pageContent?.includes('Welcome back'));
    console.log('Page contains "Email address":', pageContent?.includes('Email address'));
    
    // Take a screenshot for visual verification
    await page.screenshot({ path: 'login-page.png', fullPage: true });
    console.log('📸 Screenshot saved as login-page.png');
    
    // Try to find elements by different selectors
    const emailInput = page.locator('#email').or(page.locator('input[type="email"]'));
    const passwordInput = page.locator('#password').or(page.locator('input[type="password"]'));
    const submitButton = page.locator('button[type="submit"]');
    
    // Check if elements exist
    console.log('Email input exists:', await emailInput.count() > 0);
    console.log('Password input exists:', await passwordInput.count() > 0);
    console.log('Submit button exists:', await submitButton.count() > 0);
    
    // If elements exist, try to test the login
    if (await emailInput.count() > 0 && await passwordInput.count() > 0) {
      console.log('🧪 Testing login with provided credentials...');
      
      // Fill the form
      await emailInput.first().fill('kwabenaadudarkwa@gmail.com');
      await passwordInput.first().fill('37Hospital4../');
      
      console.log('📝 Login form filled successfully');
      
      // Listen for console errors and network responses
      const errors: string[] = [];
      const networkResponses: string[] = [];
      
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      page.on('response', response => {
        if (response.url().includes('auth') || response.url().includes('supabase')) {
          networkResponses.push(`${response.status()} ${response.url()}`);
        }
      });
      
      // Try to submit
      if (await submitButton.count() > 0) {
        await submitButton.first().click();
        console.log('🔄 Login form submitted');
        
        // Wait for response
        await page.waitForTimeout(5000);
        
        // Check current URL
        const currentUrl = page.url();
        console.log('Current URL after login:', currentUrl);
        
        // Check for any response
        const bodyText = await page.textContent('body');
        
        if (currentUrl.includes('/dashboard')) {
          console.log('✅ Login successful - redirected to dashboard');
        } else if (currentUrl.includes('/welcome')) {
          console.log('✅ Login successful - redirected to welcome (onboarding needed)');
        } else if (bodyText?.includes('Signing in') || bodyText?.includes('Loading')) {
          console.log('⏳ Login in progress - still loading');
          // Wait a bit more
          await page.waitForTimeout(3000);
          const finalUrl = page.url();
          console.log('Final URL after extended wait:', finalUrl);
        } else if (bodyText?.includes('error') || bodyText?.includes('Error') || bodyText?.includes('Invalid')) {
          console.log('❌ Login failed with error message');
          // Look for specific error message
          const errorElement = page.locator('.bg-red-50');
          if (await errorElement.isVisible()) {
            const errorText = await errorElement.textContent();
            console.log('Error message:', errorText);
          }
        } else {
          console.log('⚠️ Unclear result - check screenshots');
        }
        
        // Log any console errors
        if (errors.length > 0) {
          console.log('Console errors:', errors);
        }
        
        // Log network responses
        if (networkResponses.length > 0) {
          console.log('Auth-related network responses:', networkResponses);
        }
        
        // Take final screenshot
        await page.screenshot({ path: 'login-result.png', fullPage: true });
        console.log('📸 Final screenshot saved as login-result.png');
      }
    }
  });
});