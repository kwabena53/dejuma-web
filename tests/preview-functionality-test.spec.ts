import { test, expect } from '@playwright/test';

test.describe('Preview Functionality Test', () => {
  test('should test preview link opening in new tab or fallback', async ({ page, context }) => {
    console.log('🚀 Testing preview functionality...');
    
    // Capture console messages for debugging
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
      console.log(`Browser: ${msg.text()}`);
    });
    
    // Navigate and authenticate
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
    
    // Open dropdown menu
    const dropdownButton = page.locator('[data-dropdown-button]');
    await dropdownButton.click();
    await page.waitForTimeout(1000);
    
    // Look for preview button in the dropdown
    const previewButton = page.locator('[data-dropdown-menu] button').filter({ hasText: 'Preview as Client' });
    const previewButtonExists = await previewButton.count() > 0;
    console.log(`👁️ Preview button found: ${previewButtonExists}`);
    
    if (previewButtonExists) {
      // Listen for new pages (popups/tabs)
      const newPagePromise = context.waitForEvent('page').catch(() => null);
      
      // Click preview button
      await previewButton.click();
      console.log('🖱️ Clicked Preview as Client button');
      
      // Wait a moment to see if popup opens
      await page.waitForTimeout(2000);
      
      // Check if new page opened
      const newPage = await newPagePromise;
      
      if (newPage) {
        console.log('✅ Preview opened in new tab/window!');
        console.log('🔗 Preview URL:', newPage.url());
        
        // Verify it's the correct preview page
        if (newPage.url().includes('/preview/quote/')) {
          console.log('✅ Correct preview URL structure');
          
          // Wait for preview page to load
          await newPage.waitForLoadState('networkidle');
          
          // Take screenshot of preview page
          await newPage.screenshot({ path: 'preview-opened-successfully.png', fullPage: true });
          console.log('📸 Preview page screenshot saved');
          
          // Check for quote content in preview
          const previewContent = await newPage.textContent('body');
          if (previewContent?.includes('Quote') || previewContent?.includes('Total') || previewContent?.includes('$')) {
            console.log('✅ Preview page contains quote content');
          } else {
            console.log('⚠️ Preview page may not have quote content');
          }
          
          await newPage.close();
        } else {
          console.log('❌ Wrong URL - not a preview page:', newPage.url());
          await newPage.close();
        }
      } else {
        console.log('❌ No new tab opened - checking for fallback behavior...');
        
        // Check for toast messages (fallback behavior)
        await page.waitForTimeout(1000);
        
        // Look for various toast selectors
        const toastSelectors = [
          '[role="alert"]',
          '.toast',
          '[data-testid="toast"]',
          'text="Preview link copied"',
          'text="clipboard"'
        ];
        
        let toastFound = false;
        for (const selector of toastSelectors) {
          const toast = page.locator(selector);
          if (await toast.count() > 0) {
            const toastText = await toast.textContent();
            console.log(`📋 Toast found with selector "${selector}": ${toastText}`);
            toastFound = true;
            
            if (toastText?.toLowerCase().includes('clipboard') || toastText?.toLowerCase().includes('copied')) {
              console.log('✅ Fallback behavior working - clipboard functionality');
            }
            break;
          }
        }
        
        if (!toastFound) {
          console.log('❌ No toast message found - fallback may not be working');
          
          // Take screenshot to see current state
          await page.screenshot({ path: 'no-fallback-behavior.png', fullPage: true });
        }
      }
    } else {
      console.log('❌ Preview button not found in dropdown');
      await page.screenshot({ path: 'no-preview-button.png', fullPage: true });
    }
    
    console.log('\n📄 Summary of console messages:');
    const relevantMessages = consoleMessages.filter(msg => 
      msg.includes('Preview') || 
      msg.includes('clipboard') || 
      msg.includes('window.open') ||
      msg.includes('toast') ||
      msg.includes('error') ||
      msg.includes('Error')
    );
    
    if (relevantMessages.length > 0) {
      relevantMessages.forEach((msg, i) => {
        console.log(`${i + 1}. ${msg}`);
      });
    } else {
      console.log('No relevant console messages found');
    }
    
    console.log('🏁 Preview functionality test completed');
  });
});