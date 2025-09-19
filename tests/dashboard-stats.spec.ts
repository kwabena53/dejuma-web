import { test, expect } from '@playwright/test'

test.describe('Dashboard Statistics', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the login page
    await page.goto('/login')
    
    // Fill login form with test credentials
    await page.fill('#email', 'test@example.com')
    await page.fill('#password', 'password123')
    
    // Click login button
    await page.click('button[type="submit"]:has-text("Sign in")')
    
    // Wait for successful login and redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 })
  })

  test('should display dashboard statistics cards', async ({ page }) => {
    // Check that all main statistics cards are present
    await expect(page.locator('text=Total Clients')).toBeVisible()
    await expect(page.locator('text=Total Quotes')).toBeVisible()
    await expect(page.locator('text=Total Revenue')).toBeVisible()
    await expect(page.locator('text=Total Invoices')).toBeVisible()
    
    // Wait for loading to complete (stats should not show "...")
    await page.waitForFunction(() => {
      const elements = document.querySelectorAll('.text-2xl.font-semibold')
      return Array.from(elements).every(el => !el.textContent?.includes('...'))
    }, { timeout: 10000 })
    
    // Verify stats are numbers (not loading indicators)
    const clientsStat = page.locator('text=Total Clients').locator('..').locator('.text-2xl')
    const quotesStat = page.locator('text=Total Quotes').locator('..').locator('.text-2xl')
    const revenueStat = page.locator('text=Total Revenue').locator('..').locator('.text-2xl')
    const invoicesStat = page.locator('text=Total Invoices').locator('..').locator('.text-2xl')
    
    await expect(clientsStat).not.toHaveText('...')
    await expect(quotesStat).not.toHaveText('...')
    await expect(revenueStat).not.toHaveText('...')
    await expect(invoicesStat).not.toHaveText('...')
  })

  test('should display invoice status overview', async ({ page }) => {
    // Check that invoice status overview section is present
    await expect(page.locator('text=Invoice Status Overview')).toBeVisible()
    
    // Check for the three invoice status cards
    await expect(page.locator('text=Paid Invoices')).toBeVisible()
    await expect(page.locator('text=Pending Invoices')).toBeVisible()
    await expect(page.locator('text=Overdue Invoices')).toBeVisible()
    
    // Wait for loading to complete
    await page.waitForFunction(() => {
      const elements = document.querySelectorAll('.text-2xl.font-bold')
      return Array.from(elements).every(el => !el.textContent?.includes('...'))
    }, { timeout: 10000 })
    
    // Verify each status shows a number
    const paidStat = page.locator('text=Paid Invoices').locator('..').locator('.text-2xl')
    const pendingStat = page.locator('text=Pending Invoices').locator('..').locator('.text-2xl')
    const overdueStat = page.locator('text=Overdue Invoices').locator('..').locator('.text-2xl')
    
    await expect(paidStat).not.toHaveText('...')
    await expect(pendingStat).not.toHaveText('...')
    await expect(overdueStat).not.toHaveText('...')
  })

  test('should display recent activity section', async ({ page }) => {
    // Check that recent activity section is present
    await expect(page.locator('text=Recent Activity')).toBeVisible()
    
    // Wait for activity data to load
    await page.waitForTimeout(2000)
    
    // Should either show activities or "No recent activity" message
    const hasActivities = await page.locator('.flow-root ul li').count() > 0
    const hasEmptyState = await page.locator('text=No recent activity').isVisible()
    
    expect(hasActivities || hasEmptyState).toBeTruthy()
  })

  test('should have working quick action links', async ({ page }) => {
    // Check that quick actions section exists
    await expect(page.locator('text=Quick Actions')).toBeVisible()
    
    // Check for quick action buttons
    await expect(page.locator('text=Add Client')).toBeVisible()
    await expect(page.locator('text=Create Quote')).toBeVisible()
    await expect(page.locator('text=Create Invoice')).toBeVisible()
    await expect(page.locator('text=Add Job')).toBeVisible()
    
    // Test Add Client link
    const addClientLink = page.locator('text=Add Client').first()
    await expect(addClientLink).toHaveAttribute('href', '/clients/add')
    
    // Test Create Quote link
    const createQuoteLink = page.locator('text=Create Quote').first()
    await expect(createQuoteLink).toHaveAttribute('href', '/quotes/create')
    
    // Test Create Invoice link  
    const createInvoiceLink = page.locator('text=Create Invoice').first()
    await expect(createInvoiceLink).toHaveAttribute('href', '/invoices/create')
  })

  test('should display main navigation links correctly', async ({ page }) => {
    // Check navigation links in stats cards
    await expect(page.locator('text=View all clients')).toBeVisible()
    await expect(page.locator('text=View all quotes')).toBeVisible()
    await expect(page.locator('text=View all invoices')).toBeVisible()
    await expect(page.locator('text=View invoices')).toBeVisible()
    
    // Test link functionality
    const clientsLink = page.locator('text=View all clients').first()
    await expect(clientsLink).toHaveAttribute('href', '/clients')
    
    const quotesLink = page.locator('text=View all quotes').first()
    await expect(quotesLink).toHaveAttribute('href', '/quotes')
    
    const invoicesLink = page.locator('text=View all invoices').first()
    await expect(invoicesLink).toHaveAttribute('href', '/invoices')
  })

  test('should show loading states initially', async ({ page }) => {
    // Reload the page to see loading states
    await page.reload()
    
    // Check that loading states appear initially
    const loadingIndicators = page.locator('text=...')
    await expect(loadingIndicators.first()).toBeVisible({ timeout: 1000 })
    
    // Wait for loading to complete
    await page.waitForFunction(() => {
      return !document.body.textContent?.includes('...')
    }, { timeout: 10000 })
  })

  test('should format revenue correctly as currency', async ({ page }) => {
    // Wait for revenue stat to load
    await page.waitForFunction(() => {
      const revenueElement = document.querySelector('[class*="text-2xl"][class*="font-semibold"]')
      return revenueElement && revenueElement.textContent && !revenueElement.textContent.includes('...')
    }, { timeout: 10000 })
    
    // Find the revenue stat and verify it's formatted as currency
    const revenueStat = page.locator('text=Total Revenue').locator('..').locator('.text-2xl')
    const revenueText = await revenueStat.textContent()
    
    // Should start with $ and be a valid currency format
    expect(revenueText).toMatch(/^\$\d+\.\d{2}$/)
  })
})