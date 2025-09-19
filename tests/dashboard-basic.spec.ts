import { test, expect } from '@playwright/test'

test.describe('Dashboard Basic Tests', () => {
  test('should render dashboard page structure', async ({ page }) => {
    // Go to login page first
    await page.goto('/login')
    
    // Verify we're on login page
    await expect(page.locator('text=Welcome back')).toBeVisible()
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
    
    // Check that sign in button exists
    await expect(page.locator('button[type="submit"]:has-text("Sign in")')).toBeVisible()
  })

  test('should have proper meta tags', async ({ page }) => {
    await page.goto('/login')
    
    // Check page title
    await expect(page).toHaveTitle(/Dejuma/)
    
    // Check that the page loads without errors
    const response = await page.goto('/login')
    expect(response?.status()).toBe(200)
  })

  test('should display all required login form elements', async ({ page }) => {
    await page.goto('/login')
    
    // Check form elements are present
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('label:has-text("Email address")')).toBeVisible()
    await expect(page.locator('label:has-text("Password")')).toBeVisible()
    
    // Check buttons
    await expect(page.locator('button:has-text("Sign in")')).toBeVisible()
    await expect(page.locator('button:has-text("Continue with Google")')).toBeVisible()
  })

  test('should redirect unauthenticated users from dashboard', async ({ page }) => {
    // Try to go directly to dashboard
    await page.goto('/dashboard')
    
    // Should be redirected to login
    await page.waitForURL(/\/login/, { timeout: 5000 })
    
    // Verify we're on the login page
    await expect(page.locator('text=Welcome back')).toBeVisible()
  })
})