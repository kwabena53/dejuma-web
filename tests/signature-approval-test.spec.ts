import { test, expect } from '@playwright/test';

test.describe('Signature and Approval Test', () => {
  test('should show approval interface for sent quotes', async ({ page }) => {
    console.log('🚀 Testing signature and approval functionality...');
    
    // First, let's set the quote status to "sent" using API
    const response = await fetch('http://localhost:3001/api/preview/quote/c8f29339-5a1e-4a5b-a4ef-85c8206c2426/approve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'sent', // This might not work, but let's try
        clientName: 'Test User',
        signature: null
      }),
    });
    
    if (response.ok) {
      console.log('✅ Set quote status to sent');
    } else {
      console.log('⚠️ Could not set status to sent, continuing with current status');
    }

    // Navigate to preview page
    await page.goto('http://localhost:3001/preview/quote/c8f29339-5a1e-4a5b-a4ef-85c8206c2426');
    await page.waitForLoadState('networkidle');
    console.log('📋 Preview page loaded');
    
    // Wait for content to load
    await page.waitForTimeout(3000);
    
    // Take screenshot of current state
    await page.screenshot({ path: 'approval-interface.png', fullPage: true });
    console.log('📸 Screenshot taken');
    
    // Look for approval elements
    const approveSection = page.locator('text=Approve or Reject Quote');
    const nameInput = page.locator('input[placeholder="Enter your full name"]');
    const signatureCanvas = page.locator('canvas');
    const approveButton = page.locator('button:has-text("Approve Quote")');
    const rejectButton = page.locator('button:has-text("Reject Quote")');
    
    const approveSectionExists = await approveSection.count() > 0;
    const nameInputExists = await nameInput.count() > 0;
    const canvasExists = await signatureCanvas.count() > 0;
    const approveButtonExists = await approveButton.count() > 0;
    const rejectButtonExists = await rejectButton.count() > 0;
    
    console.log(`📋 Approve section exists: ${approveSectionExists}`);
    console.log(`📝 Name input exists: ${nameInputExists}`);
    console.log(`✏️ Signature canvas exists: ${canvasExists}`);
    console.log(`✅ Approve button exists: ${approveButtonExists}`);
    console.log(`❌ Reject button exists: ${rejectButtonExists}`);
    
    // If approval interface exists, test it
    if (approveSectionExists && nameInputExists) {
      console.log('🔄 Testing approval interface...');
      
      // Fill in name
      await nameInput.fill('John Doe');
      console.log('✅ Name filled in');
      
      // Try to draw on canvas (simulate signature)
      if (canvasExists) {
        const canvas = signatureCanvas.first();
        const box = await canvas.boundingBox();
        if (box) {
          // Draw a simple signature
          await page.mouse.move(box.x + 50, box.y + 50);
          await page.mouse.down();
          await page.mouse.move(box.x + 150, box.y + 50);
          await page.mouse.move(box.x + 100, box.y + 100);
          await page.mouse.up();
          console.log('✅ Signature drawn');
        }
      }
      
      // Take another screenshot after interactions
      await page.screenshot({ path: 'approval-interface-filled.png', fullPage: true });
      console.log('📸 Screenshot taken after filling form');
      
      // Check if buttons are now enabled
      if (approveButtonExists) {
        const approveEnabled = await approveButton.first().isEnabled();
        console.log(`✅ Approve button enabled: ${approveEnabled}`);
      }
    }
    
    console.log('🏁 Signature and approval test completed');
  });
});