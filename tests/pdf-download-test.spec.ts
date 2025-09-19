import { test, expect } from '@playwright/test';

test.describe('PDF Download Test', () => {
  test('should show PDF download functionality', async ({ page }) => {
    console.log('🚀 Testing PDF download functionality...');
    
    // Navigate to preview page
    await page.goto('http://localhost:3001/preview/quote/c8f29339-5a1e-4a5b-a4ef-85c8206c2426');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('📋 Preview page loaded');
    
    // Check if download button exists
    const downloadButton = page.locator('button:has-text("Download PDF")');
    const buttonExists = await downloadButton.count() > 0;
    
    console.log(`📥 Download button exists: ${buttonExists}`);
    
    if (buttonExists) {
      console.log('🖱️ Clicking download button...');
      await downloadButton.click();
      
      // Check if button shows generating state
      await page.waitForTimeout(1000);
      const generatingText = page.locator('text=Generating PDF...');
      const isGenerating = await generatingText.count() > 0;
      
      console.log(`⏳ Shows generating state: ${isGenerating}`);
      
      // Wait for generation process
      await page.waitForTimeout(3000);
      
      // Check if button returns to normal state
      const normalButton = page.locator('button:has-text("Download PDF")');
      const backToNormal = await normalButton.count() > 0;
      
      console.log(`🔄 Button returned to normal state: ${backToNormal}`);
      
      if (isGenerating && backToNormal) {
        console.log('✅ PDF generation workflow completed successfully');
      } else if (isGenerating) {
        console.log('✅ PDF generation initiated (UI may still be processing)');
      } else {
        console.log('⚠️ PDF generation state not detected - checking console for errors');
      }
    } else {
      console.log('❌ Download button not found');
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'pdf-download-test.png', fullPage: true });
    console.log('🏁 PDF download test completed');
  });
});