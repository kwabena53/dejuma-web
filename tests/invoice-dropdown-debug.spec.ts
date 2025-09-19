import { test, expect } from '@playwright/test'

test.describe('Invoice Action Dropdown Debug', () => {
  test('should check if action dropdown is visible and not hidden behind rows', async ({ page }) => {
    console.log('🔍 Testing invoice action dropdown visibility...')
    
    // Navigate to login page
    await page.goto('/')
    
    // Login with provided credentials
    console.log('📧 Logging in...')
    await page.fill('input[type="email"]', 'kwabenaadudarkwa@gmail.com')
    await page.fill('input[type="password"]', '37Hospital4../')
    await page.click('button[type="submit"]')
    
    // Wait for dashboard to load
    await page.waitForURL('**/dashboard')
    console.log('✅ Login successful')
    
    // Navigate to invoices page
    console.log('📋 Navigating to invoices page...')
    await page.click('a[href="/invoices"]')
    await page.waitForURL('**/invoices')
    
    // Wait for invoices to load
    await page.waitForSelector('table', { timeout: 10000 })
    console.log('✅ Invoices page loaded')
    
    // Find the first invoice row with action button
    const actionButtons = await page.locator('[data-dropdown-button]')
    const actionButtonCount = await actionButtons.count()
    console.log(`📊 Found ${actionButtonCount} action buttons`)
    
    if (actionButtonCount > 0) {
      // Click the first action button
      console.log('🖱️ Clicking first action button...')
      await actionButtons.first().click()
      
      // Wait a bit for dropdown to appear
      await page.waitForTimeout(500)
      
      // Check if dropdown menu exists
      const dropdown = page.locator('[data-dropdown-menu]')
      const dropdownExists = await dropdown.count() > 0
      console.log(`📋 Dropdown exists: ${dropdownExists}`)
      
      if (dropdownExists) {
        // Check if dropdown is visible
        const isVisible = await dropdown.isVisible()
        console.log(`👁️ Dropdown is visible: ${isVisible}`)
        
        // Get dropdown bounding box
        const boundingBox = await dropdown.boundingBox()
        console.log(`📐 Dropdown position:`, boundingBox)
        
        // Check dropdown z-index
        const zIndex = await dropdown.evaluate(el => window.getComputedStyle(el).zIndex)
        console.log(`🎯 Dropdown z-index: ${zIndex}`)
        
        // Check if dropdown has proper positioning
        const position = await dropdown.evaluate(el => window.getComputedStyle(el).position)
        console.log(`📍 Dropdown position type: ${position}`)
        
        // Take a screenshot to see the current state
        await page.screenshot({ path: 'invoice-dropdown-debug.png', fullPage: true })
        console.log('📸 Screenshot saved as invoice-dropdown-debug.png')
        
        // Check if dropdown items are clickable
        const dropdownItems = dropdown.locator('button, a')
        const itemCount = await dropdownItems.count()
        console.log(`🔗 Dropdown items found: ${itemCount}`)
        
        if (itemCount > 0) {
          const firstItem = dropdownItems.first()
          const itemText = await firstItem.textContent()
          console.log(`📝 First dropdown item: "${itemText}"`)
          
          // Try to click the first item to see if it's actually clickable
          try {
            await firstItem.click({ timeout: 1000 })
            console.log('✅ Successfully clicked dropdown item')
          } catch (error) {
            console.log('❌ Could not click dropdown item:', error.message)
          }
        }
      } else {
        console.log('❌ Dropdown menu not found in DOM')
        
        // Take screenshot to see current state
        await page.screenshot({ path: 'invoice-dropdown-missing.png', fullPage: true })
        console.log('📸 Screenshot saved as invoice-dropdown-missing.png')
      }
    } else {
      console.log('❌ No action buttons found')
    }
    
    // Additional debugging - check table structure
    const table = page.locator('table')
    const tableStyles = await table.evaluate(el => {
      const styles = window.getComputedStyle(el)
      return {
        overflow: styles.overflow,
        position: styles.position,
        zIndex: styles.zIndex
      }
    })
    console.log('📊 Table styles:', tableStyles)
    
    // Check table container styles
    const tableContainer = page.locator('table').locator('..')
    const containerStyles = await tableContainer.evaluate(el => {
      const styles = window.getComputedStyle(el)
      return {
        overflow: styles.overflow,
        position: styles.position,
        zIndex: styles.zIndex
      }
    })
    console.log('📦 Table container styles:', containerStyles)
  })
})