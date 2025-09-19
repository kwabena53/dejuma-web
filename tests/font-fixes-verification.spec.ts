import { test, expect } from '@playwright/test';

test.describe('Font Fixes Verification', () => {
  test('should verify font improvements in quote forms', async ({ page }) => {
    console.log('🚀 Verifying font fixes...');
    
    // Login
    await page.goto('http://localhost:3001/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const loginButton = page.locator('button[type="submit"]');
    
    await emailInput.fill('Kwabenaadudarkwa@gmail.com');
    await passwordInput.fill('37Hospital4../');
    await loginButton.click();
    await page.waitForTimeout(5000);
    
    console.log('✅ Logged in');
    
    // Test quote view page
    await page.goto('http://localhost:3001/quotes');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    const dropdownButton = page.locator('button[data-dropdown-button]').first();
    await dropdownButton.click();
    await page.waitForTimeout(1000);
    
    const viewButton = page.locator('button:has-text("View Quote")');
    await viewButton.click();
    await page.waitForTimeout(3000);
    
    console.log('✅ On quote view page');
    await page.screenshot({ path: 'quote-view-fixed-fonts.png', fullPage: true });
    
    // Test edit page
    const editButton = page.locator('a[href*="/edit"]');
    await editButton.click();
    await page.waitForTimeout(3000);
    
    console.log('✅ On quote edit page');
    await page.screenshot({ path: 'quote-edit-fixed-fonts.png', fullPage: true });
    
    // Test create page
    await page.goto('http://localhost:3001/quotes/create');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('✅ On quote create page');
    await page.screenshot({ path: 'quote-create-fixed-fonts.png', fullPage: true });
    
    console.log('🏁 Font fixes verification completed');
  });
});