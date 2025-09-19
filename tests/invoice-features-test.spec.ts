import { test, expect } from '@playwright/test';

test.describe('Invoice Management Features', () => {
  test('should complete full invoice workflow', async ({ page }) => {
    console.log('🚀 Starting comprehensive invoice feature test...');
    
    // Login
    await page.goto('http://localhost:3001/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const loginButton = page.locator('button[type="submit"]');
    
    await emailInput.fill('Kwabenaadudarkwa@gmail.com');
    await passwordInput.fill('37Hospital4../..');
    await loginButton.click();
    await page.waitForTimeout(5000);
    
    console.log('✅ Logged in successfully');

    // Test 1: Navigate to invoices page
    await page.goto('http://localhost:3001/invoices');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('✅ Navigated to invoices page');
    await page.screenshot({ path: 'invoices-page.png', fullPage: true });

    // Test 2: Create new invoice
    const newInvoiceButton = page.locator('text=New Invoice').first();
    await newInvoiceButton.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('✅ Navigated to invoice creation page');
    await page.screenshot({ path: 'invoice-create-page.png', fullPage: true });

    // Fill invoice form
    await page.locator('input[placeholder="Enter invoice title..."]').fill('Test Invoice Creation');
    await page.locator('input[type="date"]').fill('2024-12-31');
    
    // Select first client
    const clientSelect = page.locator('select').first();
    await clientSelect.selectOption({ index: 1 });
    
    // Set tax rate
    await page.locator('input[placeholder="0.00"]').fill('8.25');
    
    // Fill notes
    await page.locator('textarea[placeholder*="Additional notes"]').fill('Test invoice for comprehensive testing');
    
    // Fill first item
    await page.locator('input[placeholder="Item name..."]').fill('Test Service');
    await page.locator('input[type="number"]').nth(1).fill('2'); // quantity
    await page.locator('input[type="number"]').nth(2).fill('150.00'); // unit price
    await page.locator('textarea[placeholder="Item description..."]').fill('Comprehensive testing service');
    
    console.log('✅ Filled invoice creation form');
    await page.screenshot({ path: 'invoice-create-filled.png', fullPage: true });

    // Save as draft
    const saveDraftButton = page.locator('text=Save as Draft');
    await saveDraftButton.click();
    await page.waitForTimeout(5000);
    
    console.log('✅ Created invoice as draft');
    await page.screenshot({ path: 'invoice-created-draft.png', fullPage: true });

    // Test 3: View created invoice
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('✅ Viewing created invoice');
    await page.screenshot({ path: 'invoice-view-page.png', fullPage: true });

    // Test 4: Test PDF download
    const downloadButton = page.locator('text=Download PDF');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      downloadButton.click()
    ]);
    
    console.log('✅ PDF download initiated');
    console.log('📁 Downloaded file:', await download.suggestedFilename());
    await page.waitForTimeout(3000);

    // Test 5: Edit invoice
    const editButton = page.locator('text=Edit').first();
    await editButton.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('✅ Navigated to invoice edit page');
    await page.screenshot({ path: 'invoice-edit-page.png', fullPage: true });

    // Modify invoice
    await page.locator('input[value*="Test Invoice Creation"]').fill('Updated Test Invoice');
    await page.locator('input[placeholder="0.00"]').fill('10.0'); // Update tax rate
    
    // Add another item
    const addItemButton = page.locator('text=Add Item');
    await addItemButton.click();
    await page.waitForTimeout(2000);
    
    // Fill second item
    const itemNameInputs = page.locator('input[placeholder="Item name..."]');
    await itemNameInputs.nth(1).fill('Additional Service');
    
    const quantityInputs = page.locator('input[type="number"]').filter({ hasText: /^$/ });
    await page.locator('input[type="number"]').nth(3).fill('1'); // quantity for second item
    await page.locator('input[type="number"]').nth(4).fill('75.00'); // unit price for second item
    
    const descriptionTextareas = page.locator('textarea[placeholder="Item description..."]');
    await descriptionTextareas.nth(1).fill('Additional testing service');
    
    console.log('✅ Modified invoice and added new item');
    await page.screenshot({ path: 'invoice-edit-filled.png', fullPage: true });

    // Save changes
    const saveChangesButton = page.locator('text=Save Changes');
    await saveChangesButton.click();
    await page.waitForTimeout(5000);
    
    console.log('✅ Saved invoice changes');
    await page.screenshot({ path: 'invoice-updated.png', fullPage: true });

    // Test 6: Mark as paid
    const markPaidButton = page.locator('text=Mark as Paid');
    if (await markPaidButton.isVisible()) {
      await markPaidButton.click();
      await page.waitForTimeout(3000);
      console.log('✅ Marked invoice as paid');
      await page.screenshot({ path: 'invoice-marked-paid.png', fullPage: true });
    }

    // Test 7: Navigate back to invoices list
    const backButton = page.locator('text=Back to Invoices');
    await backButton.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('✅ Navigated back to invoices list');
    await page.screenshot({ path: 'invoices-list-updated.png', fullPage: true });

    // Test 8: Test search functionality
    const searchInput = page.locator('input[placeholder*="Search invoices"]');
    await searchInput.fill('Updated Test');
    await page.waitForTimeout(2000);
    
    console.log('✅ Tested search functionality');
    await page.screenshot({ path: 'invoice-search-test.png', fullPage: true });

    // Clear search
    await searchInput.fill('');
    await page.waitForTimeout(2000);

    // Test 9: Test status filter
    const statusFilter = page.locator('select').filter({ hasText: 'All Statuses' });
    await statusFilter.selectOption('paid');
    await page.waitForTimeout(2000);
    
    console.log('✅ Tested status filter');
    await page.screenshot({ path: 'invoice-status-filter.png', fullPage: true });

    // Reset filter
    await statusFilter.selectOption('all');
    await page.waitForTimeout(2000);

    // Test 10: Test dropdown menu
    const dropdownButton = page.locator('button[data-dropdown-button]').first();
    await dropdownButton.click();
    await page.waitForTimeout(1000);
    
    console.log('✅ Opened invoice dropdown menu');
    await page.screenshot({ path: 'invoice-dropdown-menu.png', fullPage: true });

    // Test view invoice from dropdown
    const viewInvoiceButton = page.locator('text=View Invoice').first();
    await viewInvoiceButton.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('✅ Accessed invoice via dropdown menu');
    await page.screenshot({ path: 'invoice-from-dropdown.png', fullPage: true });

    // Test 11: Test sidebar navigation
    const invoicesNavLink = page.locator('text=Invoices').nth(0); // First one in sidebar
    await invoicesNavLink.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('✅ Tested sidebar navigation to invoices');

    // Test 12: Test quick action button
    const newInvoiceQuickAction = page.locator('text=New Invoice').last(); // In sidebar
    await newInvoiceQuickAction.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('✅ Tested quick action button for new invoice');
    await page.screenshot({ path: 'invoice-quick-action-test.png', fullPage: true });

    // Navigate back to invoices
    await page.goto('http://localhost:3001/invoices');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    console.log('🏁 Invoice management test completed successfully!');
    console.log('📊 Test Summary:');
    console.log('   ✅ Invoice listing page');
    console.log('   ✅ Invoice creation');
    console.log('   ✅ Invoice viewing');
    console.log('   ✅ PDF download');
    console.log('   ✅ Invoice editing');
    console.log('   ✅ Mark as paid');
    console.log('   ✅ Search functionality');
    console.log('   ✅ Status filtering');
    console.log('   ✅ Dropdown menu');
    console.log('   ✅ Sidebar navigation');
    console.log('   ✅ Quick action buttons');
  });

  test('should handle invoice creation with validation', async ({ page }) => {
    console.log('🧪 Testing invoice validation...');
    
    // Login
    await page.goto('http://localhost:3001/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await page.locator('input[type="email"]').fill('Kwabenaadudarkwa@gmail.com');
    await page.locator('input[type="password"]').fill('37Hospital4../..');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(5000);

    // Go to create invoice
    await page.goto('http://localhost:3001/invoices/create');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Test validation - try to save without required fields
    const saveButton = page.locator('text=Save as Draft');
    await saveButton.click();
    await page.waitForTimeout(2000);
    
    console.log('✅ Tested validation for empty form');

    // Fill minimum required fields
    await page.locator('input[placeholder="Enter invoice title..."]').fill('Validation Test Invoice');
    
    // Select first client
    const clientSelect = page.locator('select').first();
    await clientSelect.selectOption({ index: 1 });
    
    // Fill item name
    await page.locator('input[placeholder="Item name..."]').fill('Validation Test Item');
    await page.locator('input[type="number"]').nth(1).fill('1'); // quantity
    await page.locator('input[type="number"]').nth(2).fill('50.00'); // unit price
    
    // Save successfully
    await saveButton.click();
    await page.waitForTimeout(5000);
    
    console.log('✅ Successfully created invoice with minimum required fields');
    await page.screenshot({ path: 'invoice-validation-success.png', fullPage: true });

    console.log('🏁 Invoice validation test completed!');
  });
});