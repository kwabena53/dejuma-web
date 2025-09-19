import { test, expect } from '@playwright/test';

test.describe('Preview Link Test', () => {
  test('should test preview link functionality', async ({ page, context }) => {
    console.log('🚀 Starting preview link test...');
    
    // Navigate to login page
    await page.goto('http://localhost:3001/login');
    await page.waitForLoadState('networkidle');
    console.log('✅ Login page loaded');

    // Login with credentials
    const emailInput = page.locator('#email').or(page.locator('input[type="email"]'));
    const passwordInput = page.locator('#password').or(page.locator('input[type="password"]'));
    const submitButton = page.locator('button[type="submit"]');

    await emailInput.first().fill('kwabenaadudarkwa@gmail.com');
    await passwordInput.first().fill('37Hospital4../');
    await submitButton.first().click();
    
    console.log('🔄 Login form submitted');

    // Wait for redirect and check if we're logged in
    await page.waitForTimeout(3000);
    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);

    if (currentUrl.includes('/dashboard') || currentUrl.includes('/welcome')) {
      console.log('✅ Login successful');
    } else {
      console.log('❌ Login may have failed, continuing anyway...');
    }

    // Navigate to quotes page
    await page.goto('http://localhost:3001/quotes');
    await page.waitForLoadState('networkidle');
    console.log('📋 Navigated to quotes page');

    // Take screenshot of quotes page
    await page.screenshot({ path: 'quotes-page.png', fullPage: true });

    // Check if there are any quotes
    const quotesTable = page.locator('table').or(page.locator('[data-testid="quotes-table"]'));
    const hasQuotes = await quotesTable.count() > 0;
    
    if (hasQuotes) {
      console.log('📄 Quotes found, testing preview functionality...');
      
      // Debug: Check all available buttons and elements
      const allButtons = await page.locator('button').all();
      console.log(`🔍 Found ${allButtons.length} buttons on page`);
      
      for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
        const buttonText = await allButtons[i].textContent();
        const buttonClass = await allButtons[i].getAttribute('class');
        console.log(`Button ${i}: "${buttonText}" with class: ${buttonClass}`);
      }
      
      // Look for three-dot menu button with different selectors
      const moreButton = page.locator('svg[data-lucide="more-vertical"]').first()
        .or(page.locator('[data-lucide="more-vertical"]').first())
        .or(page.locator('button:has(svg[data-lucide="more-vertical"])'))
        .or(page.locator('text="⋮"'))
        .or(page.locator('button').last());
      
      const directPreviewButton = page.locator('text=Preview as Client').first();
      
      if (await moreButton.count() > 0) {
        console.log('🔽 Found dropdown menu button');
        
        // Listen for new tabs/popups
        const pagePromise = context.waitForEvent('page', { timeout: 5000 }).catch(() => null);
        
        // Click dropdown to open menu
        await moreButton.click();
        console.log('🖱️ Clicked dropdown button');
        await page.waitForTimeout(1000); // Wait for dropdown to open
        
        // Take screenshot after clicking dropdown
        await page.screenshot({ path: 'dropdown-opened.png', fullPage: true });
        console.log('📸 Screenshot taken after dropdown click');
        
        // Check for any visible dropdown elements
        const dropdownElements = await page.locator('button, a, [role="menuitem"]').filter({ hasText: /Preview|View|Edit|Delete/ }).all();
        console.log(`🔍 Found ${dropdownElements.length} potential dropdown menu items`);
        
        for (let i = 0; i < dropdownElements.length; i++) {
          const text = await dropdownElements[i].textContent();
          const visible = await dropdownElements[i].isVisible();
          console.log(`Dropdown item ${i}: "${text}" (visible: ${visible})`);
        }
        
        // Look for preview button in dropdown
        const previewInDropdown = page.locator('text=Preview as Client');
        
        if (await previewInDropdown.count() > 0) {
          console.log('👁️ Found Preview as Client button in dropdown');
          
          // Click the preview button
          await previewInDropdown.click();
          console.log('🖱️ Clicked Preview as Client button');
          
          // Wait a moment to see if popup opens
          const newPage = await pagePromise;
          
          if (newPage) {
            console.log('✅ New tab/popup opened successfully!');
            console.log('🔗 New page URL:', newPage.url());
            
            // Wait for the preview page to load
            await newPage.waitForLoadState('networkidle');
            
            // Check if it's the preview page
            if (newPage.url().includes('/preview/quote/')) {
              console.log('✅ Preview page loaded correctly');
              
              // Take screenshot of preview page
              await newPage.screenshot({ path: 'preview-page.png', fullPage: true });
              console.log('📸 Preview page screenshot saved');
              
              // Check for quote content
              const previewContent = await newPage.textContent('body');
              if (previewContent?.includes('Quote') || previewContent?.includes('Total')) {
                console.log('✅ Preview page contains quote content');
              } else {
                console.log('⚠️ Preview page may not have loaded quote content properly');
              }
              
              await newPage.close();
            } else {
              console.log('❌ Opened page is not a preview page');
              await newPage.close();
            }
          } else {
            console.log('❌ No new tab/popup opened');
            console.log('🔍 Checking for fallback behavior (clipboard/toast)...');
            
            // Wait for potential toast message
            await page.waitForTimeout(2000);
            
            // Look for toast messages
            const toastMessage = page.locator('[role="alert"]').or(page.locator('.toast')).or(page.locator('text=Preview link copied'));
            
            if (await toastMessage.count() > 0) {
              const toastText = await toastMessage.textContent();
              console.log('📋 Toast message found:', toastText);
              
              if (toastText?.includes('clipboard') || toastText?.includes('copied')) {
                console.log('✅ Fallback behavior working - URL copied to clipboard');
              } else {
                console.log('⚠️ Toast found but not clipboard related');
              }
            } else {
              console.log('❌ No toast message found - preview functionality may be broken');
            }
          }
        } else {
          console.log('❌ Preview button not found in dropdown');
        }
      } else if (await directPreviewButton.count() > 0) {
        console.log('👁️ Found direct Preview as Client button');
        
        // Listen for new tabs/popups
        const pagePromise = context.waitForEvent('page', { timeout: 5000 }).catch(() => null);
        
        await directPreviewButton.click();
        console.log('🖱️ Clicked direct Preview as Client button');
        
        const newPage = await pagePromise;
        
        if (newPage) {
          console.log('✅ Preview opened in new tab');
          console.log('🔗 Preview URL:', newPage.url());
          await newPage.close();
        } else {
          console.log('❌ Preview did not open in new tab');
        }
      } else {
        console.log('❌ No preview button found');
      }
      
    } else {
      console.log('📝 No quotes found, creating a test quote first...');
      
      // Navigate to create quote page
      await page.goto('http://localhost:3001/quotes/create');
      await page.waitForLoadState('networkidle');
      console.log('📝 Navigated to create quote page');
      
      // Check if create quote page loaded
      const createPageContent = await page.textContent('body');
      if (createPageContent?.includes('Create Quote') || createPageContent?.includes('New Quote')) {
        console.log('✅ Create quote page loaded');
        
        // Fill basic quote information (simplified)
        const titleInput = page.locator('input[name="title"]').or(page.locator('#title'));
        if (await titleInput.count() > 0) {
          await titleInput.fill('Test Quote for Preview');
          console.log('📝 Quote title filled');
        }
        
        // Save the quote (look for save/create button)
        const saveButton = page.locator('button:has-text("Save")').or(page.locator('button:has-text("Create")'));
        if (await saveButton.count() > 0) {
          await saveButton.click();
          console.log('💾 Save button clicked');
          
          // Wait for redirect back to quotes or quote view
          await page.waitForTimeout(3000);
          console.log('📋 Quote creation attempted - redirecting...');
          
          // Return to quotes page to test preview
          await page.goto('http://localhost:3001/quotes');
          await page.waitForLoadState('networkidle');
          console.log('📋 Back to quotes page');
        }
      } else {
        console.log('❌ Create quote page did not load properly');
      }
    }

    // Take final screenshot
    await page.screenshot({ path: 'preview-test-final.png', fullPage: true });
    console.log('📸 Final screenshot saved');
    
    console.log('🏁 Preview link test completed');
  });
});