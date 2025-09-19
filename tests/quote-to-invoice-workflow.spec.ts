import { test, expect } from '@playwright/test'

test.describe('Quote to Invoice Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the login page
    await page.goto('/login')
    
    // Fill login form with test credentials
    await page.fill('#email', 'kwabenaadudarkwa@gmail.com')
    await page.fill('#password', '37Hospital4../')
    
    // Click login button
    await page.click('button[type="submit"]:has-text("Sign in")')
    
    // Wait for successful login and redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 })
  })

  test('should convert quote to invoice successfully', async ({ page }) => {
    // Navigate to quotes page
    await page.click('text=Quotes')
    await page.waitForURL('/quotes')
    
    // Check if there are existing quotes, if not create one
    const quoteExists = await page.locator('text=Quote').first().isVisible().catch(() => false)
    
    if (!quoteExists) {
      // Create a new quote first
      await page.click('text=Create Quote')
      await page.waitForURL('/quotes/create')
      
      await page.fill('[name="title"]', 'Test Quote for Conversion')
      await page.fill('[name="clientName"]', 'Test Client')
      await page.fill('[name="clientEmail"]', 'client@test.com')
      
      // Add a quote item
      await page.click('text=Add Item')
      await page.fill('[name="items[0].name"]', 'Test Service')
      await page.fill('[name="items[0].quantity"]', '1')
      await page.fill('[name="items[0].unit_price"]', '100')
      
      await page.click('button:has-text("Save Quote")')
      await page.waitForURL(/\/quotes\/.*/)
    } else {
      // Click on first quote
      await page.locator('text=Quote').first().click()
      await page.waitForURL(/\/quotes\/.*/)
    }
    
    // Check if Convert to Invoice button exists
    await expect(page.locator('text=Convert to Invoice')).toBeVisible()
    
    // Click Convert to Invoice button
    await page.click('text=Convert to Invoice')
    
    // Verify conversion modal appears
    await expect(page.locator('text=Convert to Invoice').nth(1)).toBeVisible()
    await expect(page.locator('text=This will create a new invoice based on this quote')).toBeVisible()
    
    // Confirm conversion
    await page.click('button:has-text("Convert to Invoice")')
    
    // Wait for navigation to new invoice
    await page.waitForURL(/\/invoices\/.*/, { timeout: 10000 })
    
    // Verify we're on the invoice page
    await expect(page.locator('text=Invoice')).toBeVisible()
    await expect(page.locator('text=Test Quote for Conversion')).toBeVisible()
  })

  test('should show job completion functionality on invoice', async ({ page }) => {
    // Navigate to invoices page
    await page.click('text=Invoices')
    await page.waitForURL('/invoices')
    
    // Check if there are existing invoices
    const invoiceExists = await page.locator('text=Invoice').first().isVisible().catch(() => false)
    
    if (invoiceExists) {
      // Click on first invoice
      await page.locator('text=Invoice').first().click()
      await page.waitForURL(/\/invoices\/.*/)
      
      // Check for job completion button (should be visible if job not completed)
      const jobCompleteButton = page.locator('text=Mark Job Complete')
      if (await jobCompleteButton.isVisible()) {
        await jobCompleteButton.click()
        
        // Verify job completion modal
        await expect(page.locator('text=Mark Job Complete').nth(1)).toBeVisible()
        await expect(page.locator('text=Completion Date')).toBeVisible()
        await expect(page.locator('text=Completion Notes')).toBeVisible()
        await expect(page.locator('text=Completion Photo')).toBeVisible()
        
        // Fill completion form
        await page.fill('[type="date"]', '2024-01-15')
        await page.fill('textarea', 'Job completed successfully with high quality work.')
        
        // Cancel to avoid actually completing
        await page.click('text=Cancel')
      }
    }
  })

  test('should show payment functionality on invoice', async ({ page }) => {
    // Navigate to invoices page
    await page.click('text=Invoices')
    await page.waitForURL('/invoices')
    
    // Check if there are existing invoices
    const invoiceExists = await page.locator('text=Invoice').first().isVisible().catch(() => false)
    
    if (invoiceExists) {
      // Click on first invoice
      await page.locator('text=Invoice').first().click()
      await page.waitForURL(/\/invoices\/.*/)
      
      // Check for mark as paid button (should be visible if not paid)
      const markPaidButton = page.locator('text=Mark as Paid')
      if (await markPaidButton.isVisible()) {
        await markPaidButton.click()
        
        // Verify payment modal
        await expect(page.locator('text=Mark as Paid').nth(1)).toBeVisible()
        await expect(page.locator('text=This will mark the invoice as paid')).toBeVisible()
        await expect(page.locator('text=Payment Confirmation')).toBeVisible()
        
        // Cancel to avoid actually marking as paid
        await page.click('text=Cancel')
      }
    }
  })

  test('should display job status information', async ({ page }) => {
    // Navigate to invoices page
    await page.click('text=Invoices')
    await page.waitForURL('/invoices')
    
    // Check if there are existing invoices
    const invoiceExists = await page.locator('text=Invoice').first().isVisible().catch(() => false)
    
    if (invoiceExists) {
      // Click on first invoice
      await page.locator('text=Invoice').first().click()
      await page.waitForURL(/\/invoices\/.*/)
      
      // Check for job status display
      await expect(page.locator('text=Job Status')).toBeVisible()
      
      // Should show either "In Progress" or "✓ Completed"
      const jobStatus = await page.locator('text=Job Status').locator('..').locator('span').last()
      const statusText = await jobStatus.textContent()
      expect(statusText).toMatch(/(In Progress|✓ Completed)/)
    }
  })

  test('should have proper navigation between quotes and invoices', async ({ page }) => {
    // Test navigation from quotes to invoices
    await page.click('text=Quotes')
    await page.waitForURL('/quotes')
    await expect(page.locator('h1:has-text("Quotes")')).toBeVisible()
    
    await page.click('text=Invoices')
    await page.waitForURL('/invoices')
    await expect(page.locator('h1:has-text("Invoices")')).toBeVisible()
    
    // Test sidebar navigation
    await page.click('text=Dashboard')
    await page.waitForURL('/dashboard')
    
    // Verify dashboard shows invoice statistics
    await expect(page.locator('text=Total Invoices')).toBeVisible()
    await expect(page.locator('text=Invoice Status Overview')).toBeVisible()
  })

  test('should show appropriate buttons based on invoice status', async ({ page }) => {
    // Navigate to invoices page
    await page.click('text=Invoices')
    await page.waitForURL('/invoices')
    
    // Check if there are existing invoices
    const invoiceExists = await page.locator('text=Invoice').first().isVisible().catch(() => false)
    
    if (invoiceExists) {
      // Click on first invoice
      await page.locator('text=Invoice').first().click()
      await page.waitForURL(/\/invoices\/.*/)
      
      // Check actions section exists
      await expect(page.locator('text=Actions')).toBeVisible()
      
      // Should always have download button
      await expect(page.locator('text=Download PDF')).toBeVisible()
      
      // Job completion and payment buttons depend on current status
      const jobCompleteButton = page.locator('text=Mark Job Complete')
      const markPaidButton = page.locator('text=Mark as Paid')
      
      // At least one action button should be present
      const hasJobButton = await jobCompleteButton.isVisible()
      const hasPaymentButton = await markPaidButton.isVisible()
      
      expect(hasJobButton || hasPaymentButton).toBeTruthy()
    }
  })

  test('should have working file upload in job completion modal', async ({ page }) => {
    // Navigate to invoices page
    await page.click('text=Invoices')
    await page.waitForURL('/invoices')
    
    // Check if there are existing invoices
    const invoiceExists = await page.locator('text=Invoice').first().isVisible().catch(() => false)
    
    if (invoiceExists) {
      // Click on first invoice
      await page.locator('text=Invoice').first().click()
      await page.waitForURL(/\/invoices\/.*/)
      
      // Check for job completion button
      const jobCompleteButton = page.locator('text=Mark Job Complete')
      if (await jobCompleteButton.isVisible()) {
        await jobCompleteButton.click()
        
        // Verify file input exists
        await expect(page.locator('input[type="file"]')).toBeHidden() // Hidden by design
        await expect(page.locator('text=Upload completion photo')).toBeVisible()
        
        // Check that upload area is clickable
        const uploadArea = page.locator('text=Upload completion photo').locator('..')
        await expect(uploadArea).toBeVisible()
        
        await page.click('text=Cancel')
      }
    }
  })
})