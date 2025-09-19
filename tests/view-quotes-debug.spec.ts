import { test, expect } from '@playwright/test';

test.describe('View Quotes Debug', () => {
  test('should debug view quotes functionality issues', async ({ page }) => {
    console.log('🚀 Debugging view quotes functionality...');
    
    // Enable console logging to catch JavaScript errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`❌ Browser Console Error: ${msg.text()}`);
      } else if (msg.type() === 'warn') {
        console.log(`⚠️ Browser Console Warning: ${msg.text()}`);
      }
    });
    
    // Enable request/response logging to see API calls
    page.on('request', request => {
      if (request.url().includes('api') || request.url().includes('quotes')) {
        console.log(`📤 Request: ${request.method()} ${request.url()}`);
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('api') || response.url().includes('quotes')) {
        console.log(`📥 Response: ${response.status()} ${response.url()}`);
      }
    });
    
    // Navigate to quotes page
    await page.goto('http://localhost:3001/quotes');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('📋 Navigated to quotes page');
    
    // Take screenshot of current state
    await page.screenshot({ path: 'view-quotes-debug-1.png', fullPage: true });
    console.log('📸 Initial screenshot taken');
    
    const currentUrl = page.url();
    console.log(`🔍 Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('/login')) {
      console.log('🔐 Redirected to login - need to authenticate first');
      
      // Try to login with test credentials or look for existing session
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      const loginButton = page.locator('button[type="submit"]');
      
      const emailExists = await emailInput.count() > 0;
      const passwordExists = await passwordInput.count() > 0;
      const loginExists = await loginButton.count() > 0;
      
      console.log(`📧 Email input: ${emailExists}, 🔐 Password input: ${passwordExists}, 🔘 Login button: ${loginExists}`);
      
      if (emailExists && passwordExists && loginExists) {
        console.log('📝 Attempting login with test credentials...');
        
        // Try various test credentials
        const testCredentials = [
          { email: 'test@example.com', password: 'password' },
          { email: 'admin@test.com', password: 'admin123' },
          { email: 'user@dejuma.com', password: 'dejuma123' }
        ];
        
        for (const cred of testCredentials) {
          console.log(`🔑 Trying credentials: ${cred.email}`);
          
          await emailInput.clear();
          await passwordInput.clear();
          await emailInput.fill(cred.email);
          await passwordInput.fill(cred.password);
          
          await loginButton.click();
          await page.waitForTimeout(3000);
          
          const newUrl = page.url();
          console.log(`🔍 After login attempt URL: ${newUrl}`);
          
          if (!newUrl.includes('/login')) {
            console.log(`✅ Login successful with ${cred.email}`);
            break;
          } else {
            console.log(`❌ Login failed with ${cred.email}`);
            
            // Check for error messages
            const errorElements = await page.locator(':has-text("error"), :has-text("Error"), :has-text("Invalid"), :has-text("incorrect")').count();
            if (errorElements > 0) {
              const errorText = await page.locator(':has-text("error"), :has-text("Error"), :has-text("Invalid"), :has-text("incorrect")').first().textContent();
              console.log(`💬 Error message: ${errorText}`);
            }
          }
        }
        
        // If still on login page, let's see if we can bypass for testing
        const finalUrl = page.url();
        if (finalUrl.includes('/login')) {
          console.log('🔄 All login attempts failed, checking if we can access quotes directly');
          
          // Try navigating directly to a specific quote to test the view functionality
          await page.goto('http://localhost:3001/quotes/c8f29339-5a1e-4a5b-a4ef-85c8206c2426');
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(2000);
          
          const directQuoteUrl = page.url();
          console.log(`🔍 Direct quote access URL: ${directQuoteUrl}`);
          
          if (!directQuoteUrl.includes('/login')) {
            console.log('✅ Direct quote access works');
            await page.screenshot({ path: 'direct-quote-access.png', fullPage: true });
          }
        }
      }
    } else {
      console.log('✅ Successfully accessed quotes page without redirect');
    }
    
    // Now test the quotes page functionality regardless of authentication status
    const currentFinalUrl = page.url();
    
    if (currentFinalUrl.includes('/quotes') && !currentFinalUrl.includes('/login')) {
      console.log('📊 Testing quotes page functionality...');
      
      // Look for quotes table elements
      const tableRows = await page.locator('tr').count();
      const quoteItems = await page.locator('[data-testid="quote-item"]').count();
      const quoteLinks = await page.locator('a[href*="/quotes/"]:not([href$="/quotes"])').count();
      const createButton = await page.locator('a[href="/quotes/create"], button:has-text("Create Quote")').count();
      const loadingSpinner = await page.locator('.animate-spin, [data-testid="loading"]').count();
      
      console.log(`📊 Table rows: ${tableRows}`);
      console.log(`📋 Quote items: ${quoteItems}`);  
      console.log(`🔗 Quote links: ${quoteLinks}`);
      console.log(`➕ Create button: ${createButton}`);
      console.log(`⏳ Loading spinner: ${loadingSpinner}`);
      
      // Check for error or empty states
      const errorMessages = await page.locator(':has-text("error"), :has-text("Error"), :has-text("failed"), :has-text("Failed")').count();
      const emptyState = await page.locator(':has-text("No quotes"), :has-text("Create your first"), :has-text("Get started")').count();
      
      console.log(`❌ Error messages: ${errorMessages}`);
      console.log(`📭 Empty state: ${emptyState}`);
      
      if (errorMessages > 0) {
        const errorText = await page.locator(':has-text("error"), :has-text("Error"), :has-text("failed"), :has-text("Failed")').first().textContent();
        console.log(`💬 Error details: ${errorText}`);
      }
      
      if (loadingSpinner > 0) {
        console.log('⏳ Page is still loading, waiting longer...');
        await page.waitForTimeout(5000);
        
        // Check again after waiting
        const stillLoading = await page.locator('.animate-spin, [data-testid="loading"]').count();
        if (stillLoading > 0) {
          console.log('❌ Page stuck in loading state - possible API issue');
        }
      }
      
      // If we have quote links or rows, try clicking one
      if (quoteLinks > 0 || (tableRows > 1)) { // More than header row
        console.log('🖱️ Testing quote navigation...');
        
        if (quoteLinks > 0) {
          const firstQuoteLink = page.locator('a[href*="/quotes/"]:not([href$="/quotes"])').first();
          const linkHref = await firstQuoteLink.getAttribute('href');
          console.log(`🔗 First quote link: ${linkHref}`);
          
          await firstQuoteLink.click();
          await page.waitForTimeout(3000);
          
          const viewUrl = page.url();
          console.log(`🔍 After clicking quote link: ${viewUrl}`);
          
          if (viewUrl.includes('/quotes/') && !viewUrl.includes('/login')) {
            console.log('✅ Quote view navigation works via link');
            await page.screenshot({ path: 'quote-view-via-link.png', fullPage: true });
            
            // Check for PDF download button
            const pdfButton = page.locator('button:has-text("Download PDF")');
            const pdfExists = await pdfButton.count() > 0;
            console.log(`📄 PDF button exists in quote view: ${pdfExists}`);
          } else {
            console.log('❌ Quote view navigation failed via link');
          }
        } else if (tableRows > 1) {
          // Try clicking on a table row
          console.log('🖱️ Testing row click navigation...');
          const firstDataRow = page.locator('tr').nth(1); // Skip header
          await firstDataRow.click();
          await page.waitForTimeout(3000);
          
          const rowClickUrl = page.url();
          console.log(`🔍 After clicking row: ${rowClickUrl}`);
          
          if (rowClickUrl.includes('/quotes/') && !rowClickUrl.includes('/login')) {
            console.log('✅ Quote view navigation works via row click');
            await page.screenshot({ path: 'quote-view-via-row.png', fullPage: true });
          } else {
            console.log('❌ Quote view navigation failed via row click');
          }
        }
        
        // Go back to test dropdown
        await page.goBack();
        await page.waitForTimeout(2000);
        
        // Test dropdown functionality
        console.log('🔽 Testing dropdown functionality...');
        const dropdownButton = page.locator('button[data-dropdown-button]').first();
        const dropdownExists = await dropdownButton.count() > 0;
        
        if (dropdownExists) {
          await dropdownButton.click();
          await page.waitForTimeout(1000);
          
          const dropdownMenu = page.locator('[data-dropdown-menu]');
          const dropdownVisible = await dropdownMenu.isVisible();
          
          console.log(`📋 Dropdown visible: ${dropdownVisible}`);
          
          if (dropdownVisible) {
            await page.screenshot({ path: 'dropdown-menu-visible.png', fullPage: true });
            
            // Test view quote from dropdown
            const viewButton = dropdownMenu.locator('button:has-text("View Quote"), a:has-text("View Quote")');
            const viewExists = await viewButton.count() > 0;
            
            if (viewExists) {
              console.log('🖱️ Testing view quote from dropdown...');
              await viewButton.click();
              await page.waitForTimeout(3000);
              
              const dropdownViewUrl = page.url();
              console.log(`🔍 After dropdown view click: ${dropdownViewUrl}`);
              
              if (dropdownViewUrl.includes('/quotes/') && !dropdownViewUrl.includes('/login')) {
                console.log('✅ View quote from dropdown works');
                await page.screenshot({ path: 'quote-view-from-dropdown.png', fullPage: true });
              } else {
                console.log('❌ View quote from dropdown failed');
              }
            }
          } else {
            console.log('❌ Dropdown not visible after click');
          }
        }
      }
    }
    
    console.log('🏁 View quotes debug completed');
  });
});