import { test, expect } from '@playwright/test';

test.describe('Invoice Debug Test', () => {
  test('should debug invoice system issues', async ({ page }) => {
    console.log('🔍 Starting invoice debugging...');
    
    // Step 1: Login with correct credentials
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Go to login if needed
    const loginButton = page.locator('text=Sign in');
    if (await loginButton.count() > 0) {
      await page.goto('http://localhost:3001/login');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      const submitButton = page.locator('button[type="submit"]');
      
      await emailInput.fill('Kwabenaadudarkwa@gmail.com');
      await passwordInput.fill('37Hospital4../..');
      await submitButton.click();
      await page.waitForTimeout(5000);
    }
    
    console.log('✅ Authentication complete');

    // Step 2: Try direct navigation to invoices
    await page.goto('http://localhost:3001/invoices', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);
    
    console.log('📍 Current URL:', page.url());
    await page.screenshot({ path: 'invoice-debug-step1.png', fullPage: true });

    // Step 3: Check page content and errors
    const pageText = await page.textContent('body');
    const hasError = pageText?.includes('Error') || pageText?.includes('error');
    const hasInvoiceText = pageText?.includes('Invoices') || pageText?.includes('invoice');
    const isLoginPage = pageText?.includes('Sign in') || pageText?.includes('Email address');

    console.log('📋 Page Analysis:');
    console.log('   Current URL:', page.url());
    console.log('   Has error:', hasError);
    console.log('   Has invoice text:', hasInvoiceText);
    console.log('   Is login page:', isLoginPage);
    console.log('   Page title:', await page.title());

    // Step 4: Check console errors
    const logs = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        logs.push(`Console error: ${msg.text()}`);
      }
    });

    // Step 5: Check network errors
    page.on('response', response => {
      if (response.status() >= 400) {
        logs.push(`Network error: ${response.url()} - ${response.status()}`);
      }
    });

    await page.waitForTimeout(3000);
    
    if (logs.length > 0) {
      console.log('🔴 Errors found:');
      logs.forEach(log => console.log('   ', log));
    }

    // Step 6: If redirected to login, try quotes page for comparison
    if (isLoginPage) {
      console.log('🔄 Trying quotes page for comparison...');
      await page.goto('http://localhost:3001/quotes', { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000);
      
      const quotesPageText = await page.textContent('body');
      const quotesWorks = quotesPageText?.includes('Quotes');
      
      console.log('📊 Quotes page works:', quotesWorks);
      await page.screenshot({ path: 'quotes-comparison.png', fullPage: true });
    }

    // Step 7: Check if we can access create page directly
    await page.goto('http://localhost:3001/invoices/create', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    console.log('📝 Create page URL:', page.url());
    await page.screenshot({ path: 'invoice-create-debug.png', fullPage: true });

    const createPageText = await page.textContent('body');
    const createPageWorks = createPageText?.includes('Invoice') && createPageText?.includes('Create');
    console.log('📝 Create page works:', createPageWorks);

    console.log('🏁 Invoice debugging complete');
  });
});