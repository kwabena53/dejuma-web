import { test, expect } from '@playwright/test'

test.describe('Dashboard Statistics Verification', () => {
  test('should display enhanced dashboard structure and elements', async ({ page }) => {
    // Go directly to dashboard (seems to be accessible without auth)
    await page.goto('/dashboard')
    
    // Wait for page to load
    await page.waitForTimeout(2000)
    
    // Check that main statistics cards are present
    await expect(page.locator('text=Total Clients')).toBeVisible()
    await expect(page.locator('text=Total Quotes')).toBeVisible() 
    await expect(page.locator('text=Total Revenue')).toBeVisible()
    await expect(page.locator('text=Total Invoices')).toBeVisible()
    
    // Check for Invoice Status Overview section
    await expect(page.locator('text=Invoice Status Overview')).toBeVisible()
    await expect(page.locator('text=Paid Invoices')).toBeVisible()
    await expect(page.locator('text=Pending Invoices')).toBeVisible()
    await expect(page.locator('text=Overdue Invoices')).toBeVisible()
    
    // Check Quick Actions section
    await expect(page.locator('text=Quick Actions')).toBeVisible()
    await expect(page.locator('text=Add Client')).toBeVisible()
    await expect(page.locator('text=Create Quote')).toBeVisible()
    await expect(page.locator('text=Create Invoice')).toBeVisible()
    
    // Check Recent Activity section
    await expect(page.locator('text=Recent Activity')).toBeVisible()
    
    // Check navigation links
    await expect(page.locator('text=View all clients')).toBeVisible()
    await expect(page.locator('text=View all quotes')).toBeVisible()
    await expect(page.locator('text=View all invoices')).toBeVisible()
  })

  test('should have proper dashboard layout structure', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForTimeout(2000)
    
    // Check for sidebar
    await expect(page.locator('text=Dejuma')).toBeVisible()
    
    // Check for dashboard header
    await expect(page.locator('text=Dashboard')).toBeVisible()
    await expect(page.locator('text=Welcome back, manage your handyman business')).toBeVisible()
    
    // Check for stats grid layout
    const statsGrid = page.locator('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4')
    await expect(statsGrid).toBeVisible()
    
    // Check for invoice status overview grid
    const invoiceStatusGrid = page.locator('text=Invoice Status Overview')
    await expect(invoiceStatusGrid).toBeVisible()
  })

  test('should display correct navigation in sidebar', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForTimeout(2000)
    
    // Check sidebar navigation items
    await expect(page.locator('text=Dashboard')).toBeVisible()
    await expect(page.locator('text=Clients')).toBeVisible()
    await expect(page.locator('text=Quotes')).toBeVisible()
    await expect(page.locator('text=Invoices')).toBeVisible()
    await expect(page.locator('text=Jobs')).toBeVisible()
    await expect(page.locator('text=Settings')).toBeVisible()
    
    // Check quick action buttons in sidebar
    await expect(page.locator('text=Add Client').first()).toBeVisible()
    await expect(page.locator('text=New Quote')).toBeVisible()
    await expect(page.locator('text=New Invoice')).toBeVisible()
  })

  test('should have proper link attributes', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForTimeout(2000)
    
    // Test quick action links
    const addClientLink = page.locator('a[href="/clients/add"]').first()
    await expect(addClientLink).toBeVisible()
    
    const createQuoteLink = page.locator('a[href="/quotes/create"]').first()
    await expect(createQuoteLink).toBeVisible()
    
    const createInvoiceLink = page.locator('a[href="/invoices/create"]').first()
    await expect(createInvoiceLink).toBeVisible()
    
    // Test navigation links
    const clientsLink = page.locator('a[href="/clients"]').first()
    await expect(clientsLink).toBeVisible()
    
    const quotesLink = page.locator('a[href="/quotes"]').first()
    await expect(quotesLink).toBeVisible()
    
    const invoicesLink = page.locator('a[href="/invoices"]').first()
    await expect(invoicesLink).toBeVisible()
  })
})