import { test, expect } from '@playwright/test';

test.describe('Test Quotes with User Credentials', () => {
  test('should login and test quotes functionality', async ({ page }) => {
    console.log('🚀 Testing quotes with provided credentials...');
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`❌ Console Error: ${msg.text()}`);
      }
    });
    
    page.on('request', request => {
      if (request.url().includes('api/auth') || request.url().includes('quotes')) {
        console.log(`📤 Request: ${request.method()} ${request.url()}`);
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('api/auth') || response.url().includes('quotes')) {
        console.log(`📥 Response: ${response.status()} ${response.url()}`);
      }
    });
    
    // Navigate to login page
    await page.goto('http://localhost:3001/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('📝 Navigated to login page');
    await page.screenshot({ path: 'login-with-credentials.png', fullPage: true });
    
    // Fill in the provided credentials
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const loginButton = page.locator('button[type="submit"]');
    
    const emailExists = await emailInput.count() > 0;
    const passwordExists = await passwordInput.count() > 0;
    const buttonExists = await loginButton.count() > 0;
    
    console.log(`📧 Email input: ${emailExists}, 🔐 Password input: ${passwordExists}, 🔘 Button: ${buttonExists}`);
    
    if (emailExists && passwordExists && buttonExists) {
      console.log('🔑 Logging in with provided credentials...');
      
      await emailInput.fill('Kwabenaadudarkwa@gmail.com');
      await passwordInput.fill('37Hospital4../');
      
      await loginButton.click();
      await page.waitForTimeout(5000); // Wait for login to complete
      
      const afterLoginUrl = page.url();
      console.log(`🔍 After login URL: ${afterLoginUrl}`);
      
      if (!afterLoginUrl.includes('/login')) {
        console.log('✅ Login successful!');
        await page.screenshot({ path: 'after-successful-login.png', fullPage: true });
        
        // Navigate to quotes page
        console.log('📋 Navigating to quotes page...');
        await page.goto('http://localhost:3001/quotes');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
        
        const quotesUrl = page.url();
        console.log(`🔍 Quotes page URL: ${quotesUrl}`);
        
        if (quotesUrl.includes('/quotes') && !quotesUrl.includes('/login')) {
          console.log('✅ Successfully accessed quotes page!');
          await page.screenshot({ path: 'quotes-page-success.png', fullPage: true });
          
          // Test quotes page elements
          const pageTitle = await page.locator('h1:has-text("Quotes")').count();
          const createButton = await page.locator('a[href="/quotes/create"], button:has-text("Create Quote")').count();
          const searchInput = await page.locator('input[placeholder*="Search"]').count();
          const tableElement = await page.locator('table').count();
          const tableRows = await page.locator('tr').count();
          const emptyState = await page.locator(':has-text("No quotes"), :has-text("Create your first")').count();
          const errorMessages = await page.locator(':has-text("error"), :has-text("Error"), :has-text("failed")').count();
          const loadingSpinner = await page.locator('.animate-spin, [data-testid="loading"]').count();
          
          console.log(`📄 Page title: ${pageTitle > 0 ? 'Found' : 'Missing'}`);
          console.log(`➕ Create button: ${createButton > 0 ? 'Found' : 'Missing'}`);
          console.log(`🔍 Search input: ${searchInput > 0 ? 'Found' : 'Missing'}`);
          console.log(`📊 Table element: ${tableElement > 0 ? 'Found' : 'Missing'}`);
          console.log(`📊 Table rows: ${tableRows}`);
          console.log(`📭 Empty state: ${emptyState > 0 ? 'Shown' : 'Not shown'}`);
          console.log(`❌ Error messages: ${errorMessages}`);
          console.log(`⏳ Loading spinner: ${loadingSpinner > 0 ? 'Visible' : 'Not visible'}`);
          
          if (errorMessages > 0) {
            const errorText = await page.locator(':has-text("error"), :has-text("Error"), :has-text("failed")').first().textContent();
            console.log(`💬 Error details: ${errorText}`);
          }
          
          if (loadingSpinner > 0) {
            console.log('⏳ Page still loading, waiting longer...');
            await page.waitForTimeout(5000);
            
            const stillLoading = await page.locator('.animate-spin, [data-testid="loading"]').count();
            if (stillLoading > 0) {
              console.log('❌ Page stuck in loading state');
              await page.screenshot({ path: 'quotes-stuck-loading.png', fullPage: true });
            } else {
              console.log('✅ Loading completed');
              await page.screenshot({ path: 'quotes-loaded.png', fullPage: true });
            }
          }
          
          // Test navigation to existing quotes if any exist
          const quoteLinks = await page.locator('a[href*="/quotes/"]:not([href$="/quotes"])').count();
          const clickableRows = await page.locator('tr[onClick], tr.cursor-pointer, tbody tr').count();
          
          console.log(`🔗 Quote links: ${quoteLinks}`);
          console.log(`🖱️ Clickable rows: ${clickableRows}`);
          
          if (quoteLinks > 0) {
            console.log('🖱️ Testing quote navigation via link...');
            const firstLink = page.locator('a[href*="/quotes/"]:not([href$="/quotes"])').first();
            const linkHref = await firstLink.getAttribute('href');
            console.log(`🔗 First quote link: ${linkHref}`);
            
            await firstLink.click();
            await page.waitForTimeout(3000);
            
            const viewUrl = page.url();
            console.log(`🔍 Quote view URL: ${viewUrl}`);
            
            if (viewUrl.includes('/quotes/') && !viewUrl.includes('/login')) {
              console.log('✅ Quote view page accessible via link');
              await page.screenshot({ path: 'quote-view-page.png', fullPage: true });
              
              // Test PDF download
              const pdfButton = page.locator('button:has-text("Download PDF")');
              const pdfExists = await pdfButton.count() > 0;
              console.log(`📄 PDF download button: ${pdfExists ? 'Found' : 'Missing'}`);
              
              if (pdfExists) {
                console.log('🖱️ Testing PDF download...');
                await pdfButton.click();
                await page.waitForTimeout(2000);
                
                const generatingPDF = page.locator('text=Generating PDF...');
                const isGenerating = await generatingPDF.count() > 0;
                console.log(`⏳ PDF generation: ${isGenerating ? 'Started' : 'No indication'}`);
              }
              
              // Go back to quotes list
              await page.goBack();
              await page.waitForTimeout(2000);
            } else {
              console.log('❌ Quote view navigation failed');
            }
          } else if (clickableRows > 0) {
            console.log('🖱️ Testing quote navigation via row click...');
            const firstRow = page.locator('tbody tr').first();
            await firstRow.click();
            await page.waitForTimeout(3000);
            
            const rowClickUrl = page.url();
            console.log(`🔍 After row click URL: ${rowClickUrl}`);
            
            if (rowClickUrl.includes('/quotes/') && !rowClickUrl.includes('/login')) {
              console.log('✅ Quote view page accessible via row click');
              await page.screenshot({ path: 'quote-view-via-row.png', fullPage: true });
              
              await page.goBack();
              await page.waitForTimeout(2000);
            }
          }
          
          // Test dropdown functionality
          const dropdownButtons = await page.locator('button[data-dropdown-button]').count();
          console.log(`🔽 Dropdown buttons: ${dropdownButtons}`);
          
          if (dropdownButtons > 0) {
            console.log('🖱️ Testing dropdown functionality...');
            const firstDropdown = page.locator('button[data-dropdown-button]').first();
            await firstDropdown.click();
            await page.waitForTimeout(1000);
            
            const dropdownMenu = page.locator('[data-dropdown-menu]');
            const menuVisible = await dropdownMenu.isVisible();
            console.log(`📋 Dropdown menu visible: ${menuVisible}`);
            
            if (menuVisible) {
              await page.screenshot({ path: 'dropdown-menu-working.png', fullPage: true });
              
              // Test view quote from dropdown
              const viewButton = dropdownMenu.locator('button:has-text("View Quote")');
              const viewExists = await viewButton.count() > 0;
              
              if (viewExists) {
                console.log('🖱️ Testing view quote from dropdown...');
                await viewButton.click();
                await page.waitForTimeout(3000);
                
                const dropdownViewUrl = page.url();
                console.log(`🔍 Dropdown view URL: ${dropdownViewUrl}`);
                
                if (dropdownViewUrl.includes('/quotes/')) {
                  console.log('✅ View quote from dropdown works');
                  await page.screenshot({ path: 'view-from-dropdown-works.png', fullPage: true });
                } else {
                  console.log('❌ View quote from dropdown failed');
                }
              }
            } else {
              console.log('❌ Dropdown menu not visible');
              
              // Check if dropdown exists but hidden
              const dropdownExists = await dropdownMenu.count() > 0;
              if (dropdownExists) {
                const styles = await dropdownMenu.evaluate(el => {
                  const computed = window.getComputedStyle(el);
                  return {
                    display: computed.display,
                    visibility: computed.visibility,
                    zIndex: computed.zIndex,
                    position: computed.position
                  };
                });
                console.log('🎨 Dropdown styles:', styles);
              }
            }
          }
          
          // Test create quote functionality
          if (createButton > 0) {
            console.log('🖱️ Testing create quote...');
            const createBtn = page.locator('a[href="/quotes/create"], button:has-text("Create Quote")').first();
            await createBtn.click();
            await page.waitForTimeout(3000);
            
            const createUrl = page.url();
            console.log(`🔍 Create quote URL: ${createUrl}`);
            
            if (createUrl.includes('/quotes/create')) {
              console.log('✅ Create quote page accessible');
              await page.screenshot({ path: 'create-quote-working.png', fullPage: true });
            } else {
              console.log('❌ Create quote navigation failed');
            }
          }
          
        } else {
          console.log('❌ Redirected away from quotes page');
          await page.screenshot({ path: 'quotes-redirect-issue.png', fullPage: true });
        }
        
      } else {
        console.log('❌ Login failed');
        await page.screenshot({ path: 'login-failed.png', fullPage: true });
        
        // Check for error messages
        const loginErrors = await page.locator(':has-text("Invalid"), :has-text("incorrect"), :has-text("error"), .text-red-600').count();
        if (loginErrors > 0) {
          const errorText = await page.locator(':has-text("Invalid"), :has-text("incorrect"), :has-text("error"), .text-red-600').first().textContent();
          console.log(`💬 Login error: ${errorText}`);
        }
      }
    }
    
    console.log('🏁 Quotes functionality test completed');
  });
});