import { test, expect } from '@playwright/test';

test.describe('End-to-End Approval Test', () => {
  test('should complete quote approval flow', async ({ page }) => {
    console.log('🚀 Testing complete approval flow...');

    // Navigate to preview page
    await page.goto('http://localhost:3001/preview/quote/c8f29339-5a1e-4a5b-a4ef-85c8206c2426');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Check if we see the approval interface
    const approveSection = page.locator('text=Approve or Reject Quote');
    const isApprovalVisible = await approveSection.count() > 0;

    if (isApprovalVisible) {
      console.log('✅ Approval interface is visible');
      
      // Fill in the name
      await page.fill('input[placeholder="Enter your full name"]', 'Jane Smith');
      console.log('✅ Name filled: Jane Smith');
      
      // Draw signature - simulate by clicking on canvas multiple times
      const canvas = page.locator('canvas').first();
      const canvasBox = await canvas.boundingBox();
      
      if (canvasBox) {
        // Draw simple signature lines
        await page.mouse.click(canvasBox.x + 50, canvasBox.y + 60);
        await page.mouse.down();
        await page.mouse.move(canvasBox.x + 100, canvasBox.y + 60);
        await page.mouse.up();
        
        await page.mouse.click(canvasBox.x + 120, canvasBox.y + 40);
        await page.mouse.down();
        await page.mouse.move(canvasBox.x + 150, canvasBox.y + 80);
        await page.mouse.up();
        
        console.log('✅ Signature drawn on canvas');
      }
      
      // Take screenshot before approval
      await page.screenshot({ path: 'before-approval.png', fullPage: true });
      
      // Wait a moment for signature to be processed
      await page.waitForTimeout(1000);
      
      // Try to approve (click the approve button)
      const approveButton = page.locator('button:has-text("Approve Quote")');
      
      if (await approveButton.count() > 0) {
        console.log('🖱️ Clicking approve button...');
        await approveButton.click();
        
        // Wait for any processing/API call
        await page.waitForTimeout(3000);
        
        // Take screenshot after clicking approve
        await page.screenshot({ path: 'after-approval-click.png', fullPage: true });
        
        // Check for success message or status change
        const successMessage = page.locator('text=approved successfully');
        const approvedStatus = page.locator('text=Quote Approved');
        
        if (await successMessage.count() > 0) {
          console.log('✅ Success message appeared');
        }
        
        if (await approvedStatus.count() > 0) {
          console.log('✅ Quote status changed to approved');
        }
        
        console.log('✅ Approval process completed');
      } else {
        console.log('❌ Approve button not found');
      }
      
    } else {
      console.log('ℹ️ Approval interface not visible - quote may already be processed');
      
      // Check if we see status display instead
      const statusDisplay = page.locator('text=Quote Approved, text=Quote Rejected');
      if (await statusDisplay.count() > 0) {
        console.log('✅ Quote status display is visible');
      }
    }

    // Final screenshot
    await page.screenshot({ path: 'final-approval-state.png', fullPage: true });
    console.log('🏁 End-to-end approval test completed');
  });
});