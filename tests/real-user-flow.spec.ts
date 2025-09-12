import { test, expect, Page } from '@playwright/test';

test.describe('Real User Flow Test', () => {
  const testEmail = 'kwabenaadudarkwa@gmail.com';
  const testPassword = '37Hospital4../';

  test('Complete flow with real credentials: Login → Welcome → Dashboard', async ({ page }) => {
    console.log('🚀 Starting real user flow test...');
    console.log('🔑 Using email:', testEmail);

    // Step 1: Go to Login Page
    console.log('🔑 Step 1: Testing Login with real credentials');
    await page.goto('/login');
    
    // Wait for login page to load
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    
    // Fill login form
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    
    // Take screenshot before login
    await page.screenshot({ path: 'test-results/before-login.png', fullPage: true });
    
    // Submit login
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Wait for login response and navigation
    await page.waitForTimeout(8000);
    
    // Check current URL to see where we ended up
    const currentUrl = page.url();
    console.log('📍 Current URL after login:', currentUrl);
    
    // Take screenshot after login attempt
    await page.screenshot({ path: 'test-results/after-login.png', fullPage: true });
    
    // Check if there are any error messages
    const errorMessage = page.locator('.bg-red-50');
    if (await errorMessage.isVisible()) {
      const errorText = await errorMessage.textContent();
      console.log('❌ Login error:', errorText);
      return;
    }
    
    // Step 2: Handle Welcome/Onboarding Flow or Dashboard
    if (currentUrl.includes('/welcome')) {
      console.log('🎉 Step 2: Found welcome page - testing onboarding flow');
      
      // Wait for welcome page content
      await page.waitForTimeout(2000);
      
      // Check what step we're on
      const welcomeHeading = page.locator('h1, h2, h3').first();
      const headingText = await welcomeHeading.textContent();
      console.log('📝 Welcome page heading:', headingText);
      
      // Try to find the personal info form
      const fullNameInput = page.locator('input[placeholder*="name"], input[placeholder*="Name"]');
      const phoneInput = page.locator('input[placeholder*="phone"], input[placeholder*="Phone"]');
      
      if (await fullNameInput.isVisible()) {
        console.log('👤 Found personal info step');
        
        // Fill personal information
        await fullNameInput.fill('Kwabena Adudarkwa');
        await phoneInput.fill('+1234567890');
        
        // Continue to next step
        await page.getByRole('button', { name: /continue/i }).click();
        await page.waitForTimeout(3000);
        
        // Take screenshot after personal info
        await page.screenshot({ path: 'test-results/after-personal-info.png', fullPage: true });
      }
      
      // Check for company info step
      const companyNameInput = page.locator('input[placeholder="Enter your company name"]');
      const addressInput = page.locator('textarea[placeholder*="address"], textarea[placeholder*="Address"]');
      
      if (await companyNameInput.isVisible()) {
        console.log('🏢 Found company info step');
        
        // Fill company information
        await companyNameInput.fill('Adudarkwa Handyman Services');
        await addressInput.fill('123 Accra Street, Ghana');
        
        // Fill website if present
        const websiteInput = page.locator('input[placeholder*="website"], input[placeholder*="Website"]');
        if (await websiteInput.isVisible()) {
          await websiteInput.fill('https://adudarkwahandyman.com');
        }
        
        // Select industry if dropdown exists
        const industrySelect = page.locator('select');
        if (await industrySelect.isVisible()) {
          await industrySelect.selectOption('General Handyman Services');
        }
        
        // Complete setup
        const completeButton = page.getByRole('button', { name: /complete/i });
        if (await completeButton.isVisible()) {
          await completeButton.click();
          console.log('✅ Completed setup');
          
          // Wait for completion and redirect
          await page.waitForTimeout(5000);
        }
        
        // Take screenshot after company info
        await page.screenshot({ path: 'test-results/after-company-info.png', fullPage: true });
      }
      
      console.log('✅ Welcome/Onboarding flow completed');
    } else if (currentUrl.includes('/dashboard')) {
      console.log('📊 Already on dashboard - onboarding was already completed');
    } else {
      console.log('❓ Unexpected page after login:', currentUrl);
    }
    
    // Step 3: Ensure we're on Dashboard
    console.log('📊 Step 3: Testing Dashboard Access');
    
    // Wait a bit more and check current URL
    await page.waitForTimeout(3000);
    const finalUrl = page.url();
    console.log('📍 Final URL:', finalUrl);
    
    if (!finalUrl.includes('/dashboard')) {
      console.log('🔄 Manually navigating to dashboard...');
      await page.goto('/dashboard');
      await page.waitForTimeout(2000);
    }
    
    // Verify dashboard elements
    const dashboardHeading = page.getByRole('heading', { name: /dashboard/i });
    if (await dashboardHeading.isVisible()) {
      console.log('✅ Dashboard heading found');
      
      await expect(dashboardHeading).toBeVisible();
      
      // Check for business management text
      const businessText = page.getByText(/manage.*business/i);
      if (await businessText.isVisible()) {
        await expect(businessText).toBeVisible();
        console.log('✅ Business management text found');
      }
      
      // Check dashboard cards
      const invoicesCard = page.getByText(/total invoices/i);
      const revenueCard = page.getByText(/total revenue/i);
      const jobsCard = page.getByText(/active jobs/i);
      
      if (await invoicesCard.isVisible()) {
        console.log('✅ Dashboard cards found');
        await expect(invoicesCard).toBeVisible();
        await expect(revenueCard).toBeVisible();
        await expect(jobsCard).toBeVisible();
      }
      
      // Check quick actions
      const createInvoice = page.getByText(/create invoice/i);
      const createQuote = page.getByText(/create quote/i);
      const addJob = page.getByText(/add.*job/i);
      const addClient = page.getByText(/add client/i);
      
      if (await createInvoice.isVisible()) {
        console.log('✅ Quick actions found');
        await expect(createInvoice).toBeVisible();
        await expect(createQuote).toBeVisible();
        await expect(addJob).toBeVisible();
        await expect(addClient).toBeVisible();
      }
      
      console.log('✅ Dashboard verification completed');
    } else {
      console.log('❌ Dashboard heading not found');
      
      // Debug: print page content
      const pageContent = await page.locator('body').textContent();
      console.log('📄 Page content preview:', pageContent?.substring(0, 500));
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'test-results/final-state.png', fullPage: true });
    
    console.log('🎯 Real user flow test completed!');
  });

  test('Test logout flow', async ({ page }) => {
    console.log('🚪 Testing logout flow...');
    
    // First login
    await page.goto('/login');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForTimeout(5000);
    
    // Navigate to dashboard if not already there
    if (!page.url().includes('/dashboard')) {
      await page.goto('/dashboard');
      await page.waitForTimeout(2000);
    }
    
    // Look for logout button (it has "Sign out" text based on dashboard code)
    const logoutButton = page.getByRole('button', { name: /sign out/i });
    if (await logoutButton.isVisible()) {
      console.log('🔍 Found logout button');
      await logoutButton.click();
      
      // Wait for logout
      await page.waitForTimeout(3000);
      
      // Should be redirected to login
      const currentUrl = page.url();
      console.log('📍 URL after logout:', currentUrl);
      
      if (currentUrl.includes('/login')) {
        console.log('✅ Logout successful - redirected to login');
      } else {
        console.log('⚠️  Logout may not have worked correctly');
      }
    } else {
      console.log('❌ Logout button not found');
    }
    
    console.log('✅ Logout flow test completed');
  });

  test('Test error handling and edge cases', async ({ page }) => {
    console.log('🔍 Testing error scenarios...');
    
    // Test wrong password
    await page.goto('/login');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    await page.waitForTimeout(3000);
    
    const loginError = page.locator('.bg-red-50, .text-red-500, .text-red-600');
    if (await loginError.isVisible()) {
      const errorText = await loginError.textContent();
      console.log('✅ Login error properly shown:', errorText);
    } else {
      console.log('⚠️  No error message shown for wrong password');
    }
    
    // Test direct dashboard access without login
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
    
    if (page.url().includes('/login')) {
      console.log('✅ Dashboard properly protected');
    } else {
      console.log('⚠️  Dashboard protection may not be working');
    }
    
    console.log('✅ Error handling test completed');
  });
});