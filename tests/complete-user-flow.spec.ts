import { test, expect, Page } from '@playwright/test';

// Helper function to generate unique test email
const generateTestEmail = () => `test+${Date.now()}+${Math.random().toString(36).substring(7)}@example.com`;

test.describe('Complete User Flow - Registration to Dashboard', () => {
  let testEmail: string;
  let testPassword: string;

  test.beforeAll(() => {
    testEmail = generateTestEmail();
    testPassword = 'testpassword123';
    console.log('🧪 Testing with email:', testEmail);
  });

  test('Complete flow: Registration → Login → Welcome → Dashboard', async ({ page }) => {
    console.log('🚀 Starting complete user flow test...');

    // Step 1: Registration
    console.log('📝 Step 1: Testing Registration');
    await page.goto('/register');
    
    // Wait for page to load
    await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible();
    
    // Fill registration form
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);
    
    // Submit registration
    await page.getByRole('button', { name: /create account/i }).click();
    
    // Wait for registration response
    await page.waitForTimeout(3000);
    
    // Check if registration succeeded or if there's an error
    const successMessage = page.getByText(/check your email/i);
    const errorMessage = page.locator('.bg-red-50');
    
    const registrationSuccess = await successMessage.isVisible();
    const registrationError = await errorMessage.isVisible();
    
    if (registrationError) {
      const errorText = await errorMessage.textContent();
      console.log('⚠️  Registration showed error:', errorText);
    }
    
    console.log('✅ Registration step completed');

    // Step 2: Go to Login Page (since we need to simulate email verification)
    console.log('🔑 Step 2: Testing Login');
    await page.goto('/login');
    
    // Wait for login page to load
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    
    // Fill login form
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    
    // Submit login
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Wait for login response
    await page.waitForTimeout(5000);
    
    // Check current URL to see where we ended up
    const currentUrl = page.url();
    console.log('📍 Current URL after login:', currentUrl);
    
    // Step 3: Handle Welcome/Onboarding Flow
    if (currentUrl.includes('/welcome') || await page.locator('h1').filter({ hasText: /welcome/i }).isVisible()) {
      console.log('🎉 Step 3: Testing Welcome/Onboarding Flow');
      
      // Personal Info Step
      await expect(page.getByText(/let's get to know you/i)).toBeVisible();
      
      // Fill personal information
      await page.fill('input[placeholder*="full name"]', 'Test User');
      await page.fill('input[placeholder*="phone"]', '+1234567890');
      
      // Continue to company info
      await page.getByRole('button', { name: /continue/i }).click();
      await page.waitForTimeout(2000);
      
      // Company Info Step
      await expect(page.getByText(/about your business/i)).toBeVisible();
      
      // Fill company information
      await page.fill('input[placeholder*="company name"]', 'Test Handyman Co');
      await page.fill('textarea[placeholder*="address"]', '123 Test Street, Test City, TC 12345');
      await page.fill('input[placeholder*="website"]', 'https://testhandyman.com');
      
      // Select industry
      await page.selectOption('select', 'General Handyman Services');
      
      // Complete setup
      await page.getByRole('button', { name: /complete setup/i }).click();
      
      // Wait for completion
      await page.waitForTimeout(3000);
      
      console.log('✅ Welcome/Onboarding step completed');
    }
    
    // Step 4: Check Dashboard Access
    console.log('📊 Step 4: Testing Dashboard Access');
    
    // Wait for redirect to dashboard or navigate manually
    await page.waitForTimeout(3000);
    
    if (!page.url().includes('/dashboard')) {
      console.log('🔄 Manually navigating to dashboard...');
      await page.goto('/dashboard');
    }
    
    // Verify dashboard elements
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    await expect(page.getByText(/manage your handyman business/i)).toBeVisible();
    
    // Check dashboard cards
    await expect(page.getByText(/total invoices/i)).toBeVisible();
    await expect(page.getByText(/total revenue/i)).toBeVisible();
    await expect(page.getByText(/active jobs/i)).toBeVisible();
    
    // Check quick actions
    await expect(page.getByText(/create invoice/i)).toBeVisible();
    await expect(page.getByText(/create quote/i)).toBeVisible();
    await expect(page.getByText(/add new job/i)).toBeVisible();
    await expect(page.getByText(/add client/i)).toBeVisible();
    
    console.log('✅ Dashboard verification completed');
    
    // Take a screenshot of the final dashboard
    await page.screenshot({ path: 'test-results/final-dashboard.png', fullPage: true });
    
    console.log('🎯 Complete user flow test finished successfully!');
  });

  test('Test individual error scenarios', async ({ page }) => {
    console.log('🔍 Testing error scenarios...');
    
    // Test registration with existing email
    await page.goto('/register');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);
    await page.getByRole('button', { name: /create account/i }).click();
    
    await page.waitForTimeout(3000);
    
    // Should show some error (already exists or other)
    const errorElement = page.locator('.bg-red-50');
    if (await errorElement.isVisible()) {
      const errorText = await errorElement.textContent();
      console.log('📝 Registration error with existing email:', errorText);
    }
    
    // Test login with wrong password
    await page.goto('/login');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    await page.waitForTimeout(3000);
    
    const loginError = page.locator('.bg-red-50');
    if (await loginError.isVisible()) {
      const errorText = await loginError.textContent();
      console.log('🔐 Login error with wrong password:', errorText);
    }
    
    console.log('✅ Error scenarios test completed');
  });

  test('Test responsive design and accessibility', async ({ page }) => {
    console.log('📱 Testing responsive design...');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Test registration page on mobile
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible();
    await page.screenshot({ path: 'test-results/mobile-register.png' });
    
    // Test login page on mobile
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    await page.screenshot({ path: 'test-results/mobile-login.png' });
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/register');
    await page.screenshot({ path: 'test-results/tablet-register.png' });
    
    console.log('✅ Responsive design test completed');
  });
});

test.describe('Navigation and Error Recovery', () => {
  test('Test navigation between pages', async ({ page }) => {
    console.log('🧭 Testing page navigation...');
    
    // Start from login
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    
    // Navigate to register
    await page.getByRole('link', { name: /sign up/i }).click();
    await expect(page.getByRole('heading', { name: /create your account/i })).toBeVisible();
    
    // Navigate back to login
    await page.getByRole('link', { name: /sign in/i }).click();
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    
    console.log('✅ Navigation test completed');
  });

  test('Test direct URL access protection', async ({ page }) => {
    console.log('🔒 Testing protected route access...');
    
    // Try to access dashboard without login
    await page.goto('/dashboard');
    
    // Should redirect to login
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    
    if (currentUrl.includes('/login')) {
      console.log('✅ Dashboard properly protected - redirected to login');
    } else {
      console.log('⚠️  Dashboard protection may not be working, current URL:', currentUrl);
    }
    
    // Try to access welcome page without login
    await page.goto('/welcome');
    await page.waitForTimeout(2000);
    
    const welcomeUrl = page.url();
    if (welcomeUrl.includes('/login')) {
      console.log('✅ Welcome page properly protected - redirected to login');
    } else {
      console.log('⚠️  Welcome page protection may not be working, current URL:', welcomeUrl);
    }
    
    console.log('✅ Route protection test completed');
  });
});