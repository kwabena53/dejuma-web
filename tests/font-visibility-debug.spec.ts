import { test, expect } from '@playwright/test';

test.describe('Font Visibility Debug', () => {
  test('should identify and fix faint fonts in quote forms', async ({ page }) => {
    console.log('🚀 Testing font visibility in quote forms...');
    
    // Login first
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
    
    console.log('✅ Logged in successfully');
    
    // Navigate to quotes page
    await page.goto('http://localhost:3001/quotes');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('📋 On quotes page');
    await page.screenshot({ path: 'quotes-page-font-check.png', fullPage: true });
    
    // Test quote view form
    const dropdownButton = page.locator('button[data-dropdown-button]').first();
    const dropdownExists = await dropdownButton.count() > 0;
    
    if (dropdownExists) {
      await dropdownButton.click();
      await page.waitForTimeout(1000);
      
      const viewButton = page.locator('button:has-text("View Quote")');
      const viewExists = await viewButton.count() > 0;
      
      if (viewExists) {
        console.log('🖱️ Clicking View Quote...');
        await viewButton.click();
        await page.waitForTimeout(3000);
        
        const viewUrl = page.url();
        console.log(`🔍 Quote view URL: ${viewUrl}`);
        
        if (viewUrl.includes('/quotes/') && !viewUrl.includes('/create')) {
          console.log('✅ On quote view page');
          await page.screenshot({ path: 'quote-view-font-check.png', fullPage: true });
          
          // Analyze font visibility by checking text elements
          const textElements = await page.locator('*').evaluateAll(elements => {
            const results = [];
            elements.forEach(el => {
              if (el.textContent && el.textContent.trim()) {
                const styles = window.getComputedStyle(el);
                const opacity = styles.opacity;
                const color = styles.color;
                const fontWeight = styles.fontWeight;
                const fontSize = styles.fontSize;
                
                // Check for potentially faint elements
                const isFaint = (
                  parseFloat(opacity) < 0.7 || 
                  color.includes('rgb(156, 163, 175)') || // gray-400
                  color.includes('rgb(107, 114, 128)') || // gray-500
                  color.includes('rgb(75, 85, 99)') ||   // gray-600
                  fontWeight === '300' || 
                  fontWeight === '200' ||
                  fontWeight === '100'
                );
                
                if (isFaint && el.textContent.trim().length > 2) {
                  results.push({
                    text: el.textContent.trim().substring(0, 50),
                    tagName: el.tagName,
                    className: el.className,
                    opacity,
                    color,
                    fontWeight,
                    fontSize
                  });
                }
              }
            });
            return results.slice(0, 20); // Limit to first 20 results
          });
          
          console.log('🔍 Found potentially faint text elements:');
          textElements.forEach((element, index) => {
            console.log(`${index + 1}. "${element.text}" - ${element.tagName}.${element.className}`);
            console.log(`   Color: ${element.color}, Weight: ${element.fontWeight}, Opacity: ${element.opacity}`);
          });
          
          // Test edit form
          const editButton = page.locator('a[href*="/edit"], button:has-text("Edit")');
          const editExists = await editButton.count() > 0;
          
          if (editExists) {
            console.log('🖱️ Testing edit form...');
            await editButton.click();
            await page.waitForTimeout(3000);
            
            const editUrl = page.url();
            console.log(`🔍 Edit URL: ${editUrl}`);
            
            if (editUrl.includes('/edit')) {
              console.log('✅ On quote edit page');
              await page.screenshot({ path: 'quote-edit-font-check.png', fullPage: true });
              
              // Check edit form font visibility
              const editFormElements = await page.locator('input, textarea, label, select').evaluateAll(elements => {
                const results = [];
                elements.forEach(el => {
                  const styles = window.getComputedStyle(el);
                  const color = styles.color;
                  const fontWeight = styles.fontWeight;
                  const opacity = styles.opacity;
                  
                  const isFaint = (
                    parseFloat(opacity) < 0.7 ||
                    color.includes('rgb(156, 163, 175)') ||
                    color.includes('rgb(107, 114, 128)') ||
                    fontWeight === '300'
                  );
                  
                  if (isFaint || el.tagName === 'LABEL') {
                    results.push({
                      tagName: el.tagName,
                      type: el.type || 'N/A',
                      placeholder: el.placeholder || '',
                      textContent: el.textContent || '',
                      className: el.className,
                      color,
                      fontWeight,
                      opacity
                    });
                  }
                });
                return results;
              });
              
              console.log('🔍 Edit form elements font analysis:');
              editFormElements.forEach((element, index) => {
                console.log(`${index + 1}. ${element.tagName}[${element.type}] - "${element.textContent || element.placeholder}"`);
                console.log(`   Class: ${element.className}`);
                console.log(`   Color: ${element.color}, Weight: ${element.fontWeight}, Opacity: ${element.opacity}`);
                console.log('');
              });
            }
          }
        }
      }
    }
    
    // Test create quote form as well
    console.log('🖱️ Testing create quote form...');
    await page.goto('http://localhost:3001/quotes/create');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('✅ On create quote page');
    await page.screenshot({ path: 'quote-create-font-check.png', fullPage: true });
    
    // Analyze create form fonts
    const createFormElements = await page.locator('input, textarea, label, select').evaluateAll(elements => {
      const results = [];
      elements.forEach(el => {
        const styles = window.getComputedStyle(el);
        const color = styles.color;
        const fontWeight = styles.fontWeight;
        const opacity = styles.opacity;
        
        const isFaint = (
          parseFloat(opacity) < 0.8 ||
          color.includes('rgb(156, 163, 175)') ||
          color.includes('rgb(107, 114, 128)') ||
          fontWeight === '300'
        );
        
        if (isFaint || el.tagName === 'LABEL') {
          results.push({
            tagName: el.tagName,
            type: el.type || 'N/A',
            placeholder: el.placeholder || '',
            textContent: el.textContent || '',
            className: el.className,
            color,
            fontWeight,
            opacity
          });
        }
      });
      return results;
    });
    
    console.log('🔍 Create form elements font analysis:');
    createFormElements.forEach((element, index) => {
      console.log(`${index + 1}. ${element.tagName}[${element.type}] - "${element.textContent || element.placeholder}"`);
      console.log(`   Class: ${element.className}`);
      console.log(`   Color: ${element.color}, Weight: ${element.fontWeight}, Opacity: ${element.opacity}`);
      console.log('');
    });
    
    console.log('🏁 Font visibility analysis completed');
  });
});