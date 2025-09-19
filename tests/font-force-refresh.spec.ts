import { test, expect } from '@playwright/test';

test.describe('Font Force Refresh Test', () => {
  test('should force refresh and check font visibility', async ({ page }) => {
    console.log('🚀 Force refreshing to check font changes...');
    
    // Clear browser cache and force refresh
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle' });
    
    // Login
    await page.goto('http://localhost:3001/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Force reload the page to ensure fresh CSS
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const loginButton = page.locator('button[type="submit"]');
    
    await emailInput.fill('Kwabenaadudarkwa@gmail.com');
    await passwordInput.fill('37Hospital4../');
    await loginButton.click();
    await page.waitForTimeout(5000);
    
    console.log('✅ Logged in with fresh session');
    
    // Navigate to quotes and force reload
    await page.goto('http://localhost:3001/quotes', { waitUntil: 'networkidle' });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    const dropdownButton = page.locator('button[data-dropdown-button]').first();
    await dropdownButton.click();
    await page.waitForTimeout(1000);
    
    const viewButton = page.locator('button:has-text("View Quote")');
    await viewButton.click();
    await page.waitForTimeout(3000);
    
    // Force reload the quote view page
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    console.log('✅ On quote view page with forced refresh');
    await page.screenshot({ path: 'quote-view-force-refresh.png', fullPage: true });
    
    // Check the actual computed styles of the labels
    const quoteNumberLabel = page.locator('span:has-text("Quote Number")').first();
    const labelStyles = await quoteNumberLabel.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        color: styles.color,
        fontWeight: styles.fontWeight,
        fontSize: styles.fontSize,
        opacity: styles.opacity
      };
    });
    
    console.log('🎨 Quote Number label styles:', labelStyles);
    
    // Check product quantity label
    const quantityLabel = page.locator('span:has-text("Quantity:")').first();
    const quantityExists = await quantityLabel.count() > 0;
    
    if (quantityExists) {
      const quantityStyles = await quantityLabel.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          color: styles.color,
          fontWeight: styles.fontWeight,
          fontSize: styles.fontSize,
          opacity: styles.opacity
        };
      });
      console.log('🎨 Quantity label styles:', quantityStyles);
    }
    
    // Test edit page with force refresh
    const editButton = page.locator('a[href*="/edit"]');
    await editButton.click();
    await page.waitForTimeout(3000);
    
    // Force reload edit page
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    console.log('✅ On edit page with forced refresh');
    await page.screenshot({ path: 'quote-edit-force-refresh.png', fullPage: true });
    
    // Check edit form label styles
    const titleLabel = page.locator('label:has-text("Quote Title")').first();
    const titleExists = await titleLabel.count() > 0;
    
    if (titleExists) {
      const titleStyles = await titleLabel.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          color: styles.color,
          fontWeight: styles.fontWeight,
          fontSize: styles.fontSize,
          opacity: styles.opacity
        };
      });
      console.log('🎨 Title label styles:', titleStyles);
    }
    
    console.log('🏁 Force refresh font test completed');
  });
});