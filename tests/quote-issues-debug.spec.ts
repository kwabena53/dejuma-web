import { test, expect } from '@playwright/test';

test.describe('Quote Issues Debug', () => {
  test('should debug quote page viewing and dropdown issues', async ({ page }) => {
    console.log('🚀 Testing quote page issues...');
    
    // Navigate to login first
    await page.goto('http://localhost:3001/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Take screenshot of login page
    await page.screenshot({ path: 'debug-login-page.png', fullPage: true });
    console.log('📸 Login page screenshot taken');
    
    // Check if we need to login or if already logged in
    const currentUrl = page.url();
    console.log(`🔍 Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('/login')) {
      console.log('📝 On login page - need to authenticate');
      
      // Check what's visible on the login page
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      const loginButton = page.locator('button[type="submit"]');
      
      const emailExists = await emailInput.count() > 0;
      const passwordExists = await passwordInput.count() > 0;
      const buttonExists = await loginButton.count() > 0;
      
      console.log(`📧 Email input exists: ${emailExists}`);
      console.log(`🔐 Password input exists: ${passwordExists}`);
      console.log(`🔘 Login button exists: ${buttonExists}`);
      
      if (emailExists && passwordExists && buttonExists) {
        // Try to login with test credentials
        await emailInput.fill('test@example.com');
        await passwordInput.fill('password123');
        await loginButton.click();
        
        console.log('🔄 Login attempted');
        await page.waitForTimeout(3000);
        
        // Check where we ended up
        const afterLoginUrl = page.url();
        console.log(`🔍 After login URL: ${afterLoginUrl}`);
        
        if (afterLoginUrl.includes('/login')) {
          console.log('❌ Login failed - still on login page');
        }
      }
    }
    
    // Try to navigate to quotes page regardless
    await page.goto('http://localhost:3001/quotes');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('📋 Navigated to quotes page');
    
    // Take screenshot of quotes page
    await page.screenshot({ path: 'debug-quotes-page.png', fullPage: true });
    console.log('📸 Quotes page screenshot taken');
    
    // Check current URL after navigation
    const quotesUrl = page.url();
    console.log(`🔍 Quotes page URL: ${quotesUrl}`);
    
    // Look for various quote-related elements
    const quoteItems = await page.locator('[data-testid="quote-item"]').count();
    const quoteRows = await page.locator('tr').count();
    const quoteLinks = await page.locator('a[href*="/quotes/"]').count();
    const dropdownButtons = await page.locator('button[data-testid="dropdown-button"], .dropdown-button, button:has-text("⋯"), button:has-text("...")').count();
    const actionMenus = await page.locator('[role="menu"], .dropdown-menu, [data-testid="action-menu"]').count();
    
    console.log(`📊 Quote items found: ${quoteItems}`);
    console.log(`📊 Table rows found: ${quoteRows}`);
    console.log(`📊 Quote links found: ${quoteLinks}`);
    console.log(`📊 Dropdown buttons found: ${dropdownButtons}`);
    console.log(`📊 Action menus found: ${actionMenus}`);
    
    // Check if there's any error messages or empty state
    const errorMessages = await page.locator(':has-text("error"), :has-text("Error"), :has-text("failed"), :has-text("Failed")').count();
    const emptyState = await page.locator(':has-text("No quotes"), :has-text("empty"), :has-text("Create your first")').count();
    const loadingState = await page.locator(':has-text("Loading"), .spinner, [data-testid="loading"]').count();
    
    console.log(`❌ Error messages found: ${errorMessages}`);
    console.log(`📭 Empty state messages found: ${emptyState}`);
    console.log(`⏳ Loading indicators found: ${loadingState}`);
    
    // If we find quote rows, try to interact with the first one
    if (quoteRows > 1) { // More than header row
      console.log('🔍 Found quote rows, checking first data row...');
      
      const firstDataRow = page.locator('tr').nth(1); // Skip header row
      const firstRowExists = await firstDataRow.count() > 0;
      
      if (firstRowExists) {
        console.log('👆 Found first data row');
        
        // Look for dropdown button in this row
        const rowDropdownButton = firstDataRow.locator('button[data-testid="dropdown-button"], .dropdown-button, button:has-text("⋯"), button:has-text("...")');
        const rowDropdownExists = await rowDropdownButton.count() > 0;
        
        console.log(`🔘 Row dropdown button exists: ${rowDropdownExists}`);
        
        if (rowDropdownExists) {
          console.log('🖱️ Clicking row dropdown button...');
          await rowDropdownButton.first().click();
          await page.waitForTimeout(1000);
          
          // Check if dropdown menu appeared
          const dropdownMenu = page.locator('[role="menu"], .dropdown-menu, [data-testid="action-menu"]');
          const dropdownVisible = await dropdownMenu.count() > 0;
          
          console.log(`📋 Dropdown menu visible: ${dropdownVisible}`);
          
          if (dropdownVisible) {
            // Look for "View" or similar action
            const viewAction = dropdownMenu.locator('button:has-text("View"), a:has-text("View"), [data-testid="view-action"]');
            const viewExists = await viewAction.count() > 0;
            
            console.log(`👁️ View action exists: ${viewExists}`);
            
            if (viewExists) {
              console.log('🖱️ Clicking view action...');
              await viewAction.first().click();
              await page.waitForTimeout(3000);
              
              // Check if we navigated to quote view page
              const viewUrl = page.url();
              console.log(`🔍 After view click URL: ${viewUrl}`);
              
              if (viewUrl.includes('/quotes/') && !viewUrl.endsWith('/quotes')) {
                console.log('✅ Successfully navigated to quote view page');
                
                // Take screenshot of quote view page
                await page.screenshot({ path: 'debug-quote-view-page.png', fullPage: true });
                
                // Look for PDF download button
                const pdfButton = page.locator('button:has-text("Download PDF")');
                const pdfExists = await pdfButton.count() > 0;
                
                console.log(`📄 PDF download button exists: ${pdfExists}`);
              } else {
                console.log('❌ View action did not navigate to quote page');
              }
            }
          }
        }
        
        // Try clicking on the row itself to see if it's clickable
        console.log('🖱️ Trying to click on the row itself...');
        await firstDataRow.click();
        await page.waitForTimeout(2000);
        
        const rowClickUrl = page.url();
        console.log(`🔍 After row click URL: ${rowClickUrl}`);
        
        if (rowClickUrl.includes('/quotes/') && !rowClickUrl.endsWith('/quotes')) {
          console.log('✅ Row click navigated to quote view page');
          await page.screenshot({ path: 'debug-quote-view-from-row-click.png', fullPage: true });
        }
      }
    }
    
    // Look for any quote links that we can click directly
    if (quoteLinks > 0) {
      console.log('🔗 Found quote links, trying to click first one...');
      const firstQuoteLink = page.locator('a[href*="/quotes/"]').first();
      const linkHref = await firstQuoteLink.getAttribute('href');
      
      console.log(`🔗 First quote link href: ${linkHref}`);
      
      if (linkHref && !linkHref.endsWith('/quotes')) {
        await firstQuoteLink.click();
        await page.waitForTimeout(3000);
        
        const linkClickUrl = page.url();
        console.log(`🔍 After link click URL: ${linkClickUrl}`);
        
        if (linkClickUrl.includes('/quotes/') && !linkClickUrl.endsWith('/quotes')) {
          console.log('✅ Quote link successfully navigated to quote view page');
          await page.screenshot({ path: 'debug-quote-view-from-link.png', fullPage: true });
          
          // Check for PDF functionality
          const pdfButton = page.locator('button:has-text("Download PDF")');
          const pdfExists = await pdfButton.count() > 0;
          
          console.log(`📄 PDF download button exists: ${pdfExists}`);
          
          if (pdfExists) {
            console.log('🖱️ Testing PDF download...');
            await pdfButton.click();
            await page.waitForTimeout(2000);
            
            const generatingText = page.locator('text=Generating PDF..., text=Downloading...');
            const isGenerating = await generatingText.count() > 0;
            
            console.log(`⏳ PDF generation started: ${isGenerating}`);
          }
        }
      }
    }
    
    console.log('🏁 Quote issues debug test completed');
  });
});