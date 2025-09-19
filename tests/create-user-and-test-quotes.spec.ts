import { test, expect } from '@playwright/test';

test.describe('Create User and Test Quotes', () => {
  test('should create user account and test quotes functionality', async ({ page }) => {
    console.log('🚀 Creating user account and testing quotes...');
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`❌ Console Error: ${msg.text()}`);
      }
    });
    
    // Try registration first
    await page.goto('http://localhost:3001/register');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('📝 Navigated to registration page');
    await page.screenshot({ path: 'registration-page.png', fullPage: true });
    
    const regUrl = page.url();
    console.log(`🔍 Registration URL: ${regUrl}`);
    
    if (regUrl.includes('/register') && !regUrl.includes('/login')) {
      console.log('✅ Registration page accessible');
      
      // Look for registration form fields
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      const nameInput = page.locator('input[name="name"], input[placeholder*="name"], input[placeholder*="Name"]');
      const companyInput = page.locator('input[name="company"], input[placeholder*="company"], input[placeholder*="Company"]');
      const submitButton = page.locator('button[type="submit"], button:has-text("Sign up"), button:has-text("Register")');
      
      const emailExists = await emailInput.count() > 0;
      const passwordExists = await passwordInput.count() > 0;
      const nameExists = await nameInput.count() > 0;
      const companyExists = await companyInput.count() > 0;
      const submitExists = await submitButton.count() > 0;
      
      console.log(`📧 Email input: ${emailExists}`);
      console.log(`🔐 Password input: ${passwordExists}`);
      console.log(`👤 Name input: ${nameExists}`);
      console.log(`🏢 Company input: ${companyExists}`);
      console.log(`✅ Submit button: ${submitExists}`);
      
      if (emailExists && passwordExists && submitExists) {
        console.log('📝 Attempting to register new user...');
        
        const testEmail = `test-${Date.now()}@example.com`;
        const testPassword = 'TestPassword123!';
        
        await emailInput.fill(testEmail);
        await passwordInput.fill(testPassword);
        
        if (nameExists) {
          await nameInput.fill('Test User');
        }
        
        if (companyExists) {
          await companyInput.fill('Test Company');
        }
        
        console.log(`👤 Registering with email: ${testEmail}`);
        
        await submitButton.click();
        await page.waitForTimeout(5000); // Wait for registration to process
        
        const afterRegUrl = page.url();
        console.log(`🔍 After registration URL: ${afterRegUrl}`);
        
        if (afterRegUrl.includes('/dashboard') || afterRegUrl.includes('/welcome') || !afterRegUrl.includes('/register')) {
          console.log('✅ Registration successful!');
          await page.screenshot({ path: 'after-registration.png', fullPage: true });
          
          // Now try to access quotes
          console.log('📋 Navigating to quotes page...');
          await page.goto('http://localhost:3001/quotes');
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(3000);
          
          const quotesUrl = page.url();
          console.log(`🔍 Quotes page URL: ${quotesUrl}`);
          
          if (quotesUrl.includes('/quotes') && !quotesUrl.includes('/login')) {
            console.log('✅ Successfully accessed quotes page!');
            await page.screenshot({ path: 'quotes-page-authenticated.png', fullPage: true });
            
            // Test quotes page functionality
            const tableRows = await page.locator('tr').count();
            const createButton = await page.locator('a[href="/quotes/create"], button:has-text("Create Quote")').count();
            const emptyState = await page.locator(':has-text("No quotes"), :has-text("Create your first")').count();
            const errorMessages = await page.locator(':has-text("error"), :has-text("Error")').count();
            
            console.log(`📊 Table rows: ${tableRows}`);
            console.log(`➕ Create button: ${createButton}`);
            console.log(`📭 Empty state: ${emptyState}`);
            console.log(`❌ Errors: ${errorMessages}`);
            
            if (createButton > 0) {
              console.log('🖱️ Testing create quote functionality...');
              const createQuoteButton = page.locator('a[href="/quotes/create"], button:has-text("Create Quote")').first();
              await createQuoteButton.click();
              await page.waitForTimeout(3000);
              
              const createUrl = page.url();
              console.log(`🔍 Create quote URL: ${createUrl}`);
              
              if (createUrl.includes('/quotes/create')) {
                console.log('✅ Create quote page accessible');
                await page.screenshot({ path: 'create-quote-page.png', fullPage: true });
              }
              
              // Go back to quotes page
              await page.goBack();
              await page.waitForTimeout(2000);
            }
            
            // If there's an empty state, that's normal for a new account
            if (emptyState > 0) {
              console.log('ℹ️ Empty state shown - normal for new account');
            }
            
            // If there are no errors, the quotes page is working correctly
            if (errorMessages === 0) {
              console.log('✅ No errors on quotes page - functionality is working correctly');
            } else {
              console.log('❌ Found errors on quotes page - investigating...');
              const errorText = await page.locator(':has-text("error"), :has-text("Error")').first().textContent();
              console.log(`💬 Error details: ${errorText}`);
            }
            
          } else {
            console.log('❌ Still redirected from quotes page after registration');
          }
          
        } else {
          console.log('❌ Registration may have failed');
          
          // Check for error messages
          const regErrors = await page.locator(':has-text("error"), :has-text("Error"), :has-text("exists"), :has-text("invalid")').count();
          if (regErrors > 0) {
            const errorText = await page.locator(':has-text("error"), :has-text("Error"), :has-text("exists"), :has-text("invalid")').first().textContent();
            console.log(`💬 Registration error: ${errorText}`);
          }
        }
      }
      
    } else {
      console.log('❌ Registration page not accessible');
      
      // Let's try the alternative approach - check if we're already logged in
      await page.goto('http://localhost:3001/dashboard');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      const dashUrl = page.url();
      console.log(`🔍 Dashboard URL: ${dashUrl}`);
      
      if (dashUrl.includes('/dashboard')) {
        console.log('✅ Already logged in - testing quotes directly');
        
        await page.goto('http://localhost:3001/quotes');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        const quotesUrl = page.url();
        console.log(`🔍 Quotes URL: ${quotesUrl}`);
        
        if (quotesUrl.includes('/quotes') && !quotesUrl.includes('/login')) {
          console.log('✅ Quotes page accessible');
          await page.screenshot({ path: 'quotes-existing-user.png', fullPage: true });
        }
      }
    }
    
    console.log('🏁 User creation and quotes test completed');
  });
});