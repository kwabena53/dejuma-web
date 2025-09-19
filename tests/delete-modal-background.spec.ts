import { test, expect } from '@playwright/test';

test.describe('Delete Modal Background Test', () => {
  const testEmail = 'kwabenaadudarkwa@gmail.com';
  const testPassword = '37Hospital4../';

  test('Test delete modal background shows clients page', async ({ page }) => {
    console.log('🧪 Testing delete modal background...');

    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForTimeout(3000);

    // Navigate to clients page
    console.log('📋 Navigating to clients page...');
    await page.goto('/clients');
    await page.waitForTimeout(2000);

    // Take screenshot before modal
    await page.screenshot({ path: 'test-results/clients-page-before-modal.png', fullPage: true });
    console.log('📸 Screenshot taken: clients-page-before-modal.png');

    // Check if there are any clients to delete
    const deleteButtons = await page.locator('[title="Delete client"]');
    const deleteButtonCount = await deleteButtons.count();
    console.log(`🗑️  Found ${deleteButtonCount} delete buttons`);

    if (deleteButtonCount > 0) {
      // Click the first delete button to open modal
      console.log('🔴 Clicking delete button...');
      await deleteButtons.first().click();
      await page.waitForTimeout(1000);

      // Take screenshot with modal open
      await page.screenshot({ path: 'test-results/delete-modal-open.png', fullPage: true });
      console.log('📸 Screenshot taken: delete-modal-open.png');

      // Check if modal is visible
      const modal = page.locator('[role="dialog"], .fixed.inset-0');
      const modalVisible = await modal.isVisible();
      console.log('👁️  Modal visible:', modalVisible);

      // Check modal background styles
      const modalBackground = page.locator('.fixed.inset-0').first();
      if (await modalBackground.isVisible()) {
        const backgroundStyles = await modalBackground.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            backgroundColor: computed.backgroundColor,
            backdropFilter: computed.backdropFilter,
            opacity: computed.opacity
          };
        });
        console.log('🎨 Modal background styles:', backgroundStyles);
      }

      // Check if we can see the clients table behind the modal
      const clientsTable = page.locator('table');
      const tableVisible = await clientsTable.isVisible();
      console.log('📊 Clients table still visible:', tableVisible);

      // Test if backdrop blur is working
      const hasBackdropBlur = await modalBackground.evaluate((el) => {
        return window.getComputedStyle(el).backdropFilter !== 'none';
      });
      console.log('🌫️  Backdrop blur active:', hasBackdropBlur);

      // Close the modal
      console.log('❌ Closing modal...');
      await page.getByRole('button', { name: /cancel/i }).click();
      await page.waitForTimeout(500);

      // Take final screenshot
      await page.screenshot({ path: 'test-results/clients-page-after-modal-closed.png', fullPage: true });
      console.log('📸 Screenshot taken: clients-page-after-modal-closed.png');

    } else {
      console.log('⚠️  No clients found to test delete modal. Adding a test client...');
      
      // Navigate to add client page
      await page.click('text=Add New Client');
      await page.waitForTimeout(1000);
      
      // Fill out the form quickly
      await page.fill('input[placeholder="Enter first name"]', 'Test');
      await page.fill('input[placeholder="Enter last name"]', 'Client');
      await page.fill('input[placeholder="Enter email address"]', 'test@example.com');
      
      // Submit form
      await page.getByRole('button', { name: /add client/i }).click();
      await page.waitForTimeout(3000);
      
      // Go back to clients page
      await page.goto('/clients');
      await page.waitForTimeout(2000);
      
      // Now try the delete modal test again
      const newDeleteButtons = await page.locator('[title="Delete client"]');
      const newDeleteButtonCount = await newDeleteButtons.count();
      console.log(`🗑️  After adding client, found ${newDeleteButtonCount} delete buttons`);
      
      if (newDeleteButtonCount > 0) {
        await newDeleteButtons.first().click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'test-results/delete-modal-with-test-client.png', fullPage: true });
        console.log('📸 Screenshot taken: delete-modal-with-test-client.png');
        
        // Close modal
        await page.getByRole('button', { name: /cancel/i }).click();
      }
    }

    console.log('✅ Delete modal background test completed');
  });
});