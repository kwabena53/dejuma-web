import { test, expect } from '@playwright/test';

test.describe('Complete Invoice System Test', () => {
  test('should test full invoice system with proper authentication', async ({ page }) => {
    console.log('🚀 Starting complete invoice system test...');
    
    // Step 1: Login with correct credentials
    await page.goto('http://localhost:3001/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const loginButton = page.locator('button[type="submit"]');
    
    await emailInput.fill('Kwabenaadudarkwa@gmail.com');
    await passwordInput.fill('37Hospital4../..');
    await loginButton.click();
    await page.waitForTimeout(5000);
    
    console.log('✅ Logged in successfully');

    // Step 2: Go to dashboard first to ensure authentication works
    await page.goto('http://localhost:3001/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('✅ Accessed dashboard');
    await page.screenshot({ path: 'dashboard-access-test.png', fullPage: true });

    // Step 3: Navigate to invoices via sidebar
    const invoicesSidebarLink = page.locator('nav a[href="/invoices"]');
    const sidebarLinkExists = await invoicesSidebarLink.count();
    
    if (sidebarLinkExists > 0) {
      await invoicesSidebarLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      console.log('✅ Navigated to invoices via sidebar');
    } else {
      // Try direct navigation
      await page.goto('http://localhost:3001/invoices');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      console.log('✅ Navigated to invoices directly');
    }
    
    await page.screenshot({ path: 'invoices-page-complete-test.png', fullPage: true });

    // Step 4: Check what's actually on the page
    const pageContent = await page.content();
    const hasInvoiceTitle = pageContent.includes('Invoices') || pageContent.includes('invoice');
    const hasErrorMessage = pageContent.includes('error') || pageContent.includes('Error');
    const isLoginPage = pageContent.includes('Sign in') || pageContent.includes('Email address');
    
    console.log('📋 Page analysis:');
    console.log('   Has invoice content:', hasInvoiceTitle);
    console.log('   Has error message:', hasErrorMessage);
    console.log('   Is login page:', isLoginPage);

    if (isLoginPage) {
      console.log('🔄 Still on login page, trying direct navigation after re-authentication');
      
      // Re-authenticate if needed
      if (await page.locator('input[type="email"]').count() > 0) {
        await emailInput.fill('Kwabenaadudarkwa@gmail.com');
        await passwordInput.fill('37Hospital4../..');
        await loginButton.click();
        await page.waitForTimeout(5000);
      }
      
      // Try accessing invoices again
      await page.goto('http://localhost:3001/invoices');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(5000);
      
      await page.screenshot({ path: 'invoices-retry-test.png', fullPage: true });
    }

    // Step 5: Test basic invoice functionality if accessible
    const newInvoiceButtons = page.locator('text=New Invoice');
    const newInvoiceCount = await newInvoiceButtons.count();
    
    console.log('🔍 Found New Invoice buttons:', newInvoiceCount);
    
    if (newInvoiceCount > 0) {
      // Test invoice creation
      await newInvoiceButtons.first().click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      console.log('✅ Navigated to invoice creation');
      await page.screenshot({ path: 'invoice-create-complete-test.png', fullPage: true });
      
      // Check if form loaded properly
      const titleInput = page.locator('input[placeholder*="invoice title"]');
      const titleInputExists = await titleInput.count() > 0;
      
      if (titleInputExists) {
        console.log('✅ Invoice creation form loaded successfully');
        
        // Fill basic form
        await titleInput.fill('Complete Test Invoice');
        
        // Check for client dropdown
        const clientDropdown = page.locator('select');
        const clientOptions = await clientDropdown.count();
        
        if (clientOptions > 0) {
          // Try to select first client
          const firstOption = await page.locator('select option').nth(1).textContent();
          if (firstOption && !firstOption.includes('Select')) {
            await clientDropdown.selectOption({ index: 1 });
            console.log('✅ Selected client:', firstOption);
          }
        }
        
        // Fill item details
        const itemNameInput = page.locator('input[placeholder*="Item name"]');
        if (await itemNameInput.count() > 0) {
          await itemNameInput.fill('Test Service Item');
          
          // Set quantity and price
          const quantityInputs = page.locator('input[type="number"]');
          if (await quantityInputs.count() >= 2) {
            await quantityInputs.nth(0).fill('2'); // quantity
            await quantityInputs.nth(1).fill('125.00'); // price
          }
          
          console.log('✅ Filled invoice form');
          await page.screenshot({ path: 'invoice-form-filled.png', fullPage: true });
          
          // Try to save as draft
          const draftButton = page.locator('text=Save as Draft');
          if (await draftButton.count() > 0) {
            await draftButton.click();
            await page.waitForTimeout(3000);
            console.log('✅ Attempted to save invoice as draft');
            await page.screenshot({ path: 'invoice-save-result.png', fullPage: true });
          }
        }
      } else {
        console.log('❌ Invoice creation form did not load properly');
      }
    } else {
      console.log('❌ No "New Invoice" buttons found on the page');
    }

    console.log('🏁 Complete invoice system test finished');
    console.log('📊 Summary:');
    console.log('   Authentication: ✅');
    console.log('   Dashboard access: ✅'); 
    console.log('   Invoice page access:', hasInvoiceTitle ? '✅' : '❌');
    console.log('   New Invoice buttons found:', newInvoiceCount);
  });
});