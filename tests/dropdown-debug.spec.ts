import { test, expect } from '@playwright/test';

test.describe('Dropdown Debug Test', () => {
  test('should debug dropdown click behavior', async ({ page }) => {
    console.log('🚀 Starting dropdown debug test...');
    
    // Capture all console messages
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
      console.log(`Browser console ${msg.type()}: ${msg.text()}`);
    });
    
    // Navigate to login and authenticate
    await page.goto('http://localhost:3001/login');
    await page.waitForLoadState('networkidle');
    
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');
    
    await emailInput.fill('kwabenaadudarkwa@gmail.com');
    await passwordInput.fill('37Hospital4../');
    await submitButton.click();
    await page.waitForTimeout(3000);
    
    // Navigate to quotes
    await page.goto('http://localhost:3001/quotes');
    await page.waitForLoadState('networkidle');
    console.log('📋 On quotes page');
    
    // Find the dropdown button
    const dropdownButton = page.locator('[data-dropdown-button]');
    const buttonCount = await dropdownButton.count();
    console.log(`🔍 Found ${buttonCount} dropdown buttons`);
    
    if (buttonCount > 0) {
      console.log('🖱️ Clicking dropdown button...');
      await dropdownButton.first().click();
      
      // Wait for state changes
      await page.waitForTimeout(2000);
      
      // Check if dropdown menu is visible
      const dropdownMenu = page.locator('[data-dropdown-menu]');
      const menuVisible = await dropdownMenu.isVisible().catch(() => false);
      console.log(`👁️ Dropdown menu visible: ${menuVisible}`);
      
      if (menuVisible) {
        const menuItems = await dropdownMenu.locator('button').all();
        console.log(`📝 Found ${menuItems.length} menu items`);
        
        for (let i = 0; i < menuItems.length; i++) {
          const text = await menuItems[i].textContent();
          console.log(`Menu item ${i}: "${text}"`);
        }
      }
      
      // Take screenshot
      await page.screenshot({ path: 'dropdown-debug.png', fullPage: true });
    }
    
    console.log('📄 All console messages:');
    consoleMessages.forEach((msg, i) => {
      console.log(`${i + 1}. ${msg}`);
    });
  });
});