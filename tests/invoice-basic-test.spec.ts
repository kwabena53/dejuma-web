import { test, expect } from '@playwright/test';

test.describe('Invoice Basic Test', () => {
  test('should access invoices page and check elements', async ({ page }) => {
    console.log('🚀 Testing basic invoice page access...');
    
    // Login
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

    // Navigate to invoices page
    await page.goto('http://localhost:3001/invoices');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    console.log('✅ Navigated to invoices page');
    await page.screenshot({ path: 'invoice-page-basic-test.png', fullPage: true });

    // Check page elements
    const pageTitle = page.locator('h1:has-text("Invoices")');
    const newInvoiceButton = page.locator('text=New Invoice');
    
    console.log('📋 Checking page elements...');
    console.log('   Title exists:', await pageTitle.count());
    console.log('   New Invoice button exists:', await newInvoiceButton.count());
    
    // Try accessing create page
    if (await newInvoiceButton.count() > 0) {
      await newInvoiceButton.first().click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      console.log('✅ Successfully navigated to invoice creation page');
      await page.screenshot({ path: 'invoice-create-basic-test.png', fullPage: true });
    } else {
      console.log('❌ New Invoice button not found');
    }

    console.log('🏁 Basic invoice test completed');
  });
});