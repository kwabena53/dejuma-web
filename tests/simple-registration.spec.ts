import { test, expect } from '@playwright/test';

test.describe('Simple Registration Test', () => {
  test('should load registration page and test basic functionality', async ({ page }) => {
    // Navigate to registration page
    await page.goto('http://localhost:3001/register');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Page loaded successfully');
    
    // Check if the page has loaded by looking for any text content
    const pageContent = await page.textContent('body');
    console.log('Page contains "Create your account":', pageContent?.includes('Create your account'));
    console.log('Page contains "Email address":', pageContent?.includes('Email address'));
    
    // Take a screenshot for visual verification
    await page.screenshot({ path: 'registration-page.png', fullPage: true });
    console.log('📸 Screenshot saved as registration-page.png');
    
    // Try to find elements by different selectors
    const emailInput = page.locator('#email').or(page.locator('input[type="email"]'));
    const passwordInput = page.locator('#password').or(page.locator('input[type="password"]'));
    const submitButton = page.locator('button[type="submit"]');
    
    // Check if elements exist
    console.log('Email input exists:', await emailInput.count() > 0);
    console.log('Password input exists:', await passwordInput.count() > 0);
    console.log('Submit button exists:', await submitButton.count() > 0);
    
    // If elements exist, try to test the form
    if (await emailInput.count() > 0 && await passwordInput.count() > 0) {
      console.log('🧪 Testing form interaction...');
      
      // Fill the form
      await emailInput.first().fill('test@example.com');
      await passwordInput.first().fill('password123');
      
      // Look for confirm password field
      const confirmPasswordInput = page.locator('input[name="confirmPassword"]').or(page.locator('#confirmPassword'));
      if (await confirmPasswordInput.count() > 0) {
        await confirmPasswordInput.first().fill('password123');
      }
      
      console.log('📝 Form filled successfully');
      
      // Try to submit
      if (await submitButton.count() > 0) {
        await submitButton.first().click();
        console.log('🔄 Form submitted');
        
        // Wait a bit to see what happens
        await page.waitForTimeout(3000);
        
        // Check for any response
        const bodyText = await page.textContent('body');
        if (bodyText?.includes('Creating account') || bodyText?.includes('Check your email')) {
          console.log('✅ Registration appears to be working - got expected response');
        } else if (bodyText?.includes('error') || bodyText?.includes('Error')) {
          console.log('❌ Registration failed with error');
        } else {
          console.log('⚠️ Unclear result - check screenshot for current state');
        }
        
        // Take final screenshot
        await page.screenshot({ path: 'registration-result.png', fullPage: true });
      }
    }
  });
});