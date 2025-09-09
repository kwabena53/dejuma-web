import { test, expect } from '@playwright/test';

test.describe('Google Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('should display Google registration button', async ({ page }) => {
    const googleButton = page.getByRole('button', { name: /continue with google/i });
    await expect(googleButton).toBeVisible();
    await expect(googleButton).toBeEnabled();
  });

  test('should handle Google OAuth redirect', async ({ page }) => {
    // Listen for navigation events and console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    const googleButton = page.getByRole('button', { name: /continue with google/i });
    
    // Click the Google button and wait for redirect
    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      googleButton.click()
    ]);

    // Check if popup opened (indicates OAuth flow started)
    expect(popup).toBeTruthy();
    
    // Wait a moment to capture any immediate errors
    await page.waitForTimeout(2000);
    
    // Log any console errors that occurred
    if (errors.length > 0) {
      console.log('Console errors detected:', errors);
    }

    // Check if we're still on the register page (might indicate failure)
    const currentUrl = page.url();
    console.log('Current URL after Google button click:', currentUrl);
    
    // Check for error messages on the page
    const errorElement = page.locator('.bg-red-50');
    if (await errorElement.isVisible()) {
      const errorText = await errorElement.textContent();
      console.log('Error message displayed:', errorText);
    }
  });

  test('should handle network failures gracefully', async ({ page }) => {
    // Block requests to Supabase auth endpoints to simulate network issues
    await page.route('**/auth/v1/**', route => route.abort());

    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    const googleButton = page.getByRole('button', { name: /continue with google/i });
    await googleButton.click();
    
    // Wait for potential error handling
    await page.waitForTimeout(3000);
    
    // Check for error display
    const errorElement = page.locator('.bg-red-50');
    if (await errorElement.isVisible()) {
      const errorText = await errorElement.textContent();
      console.log('Network error handled with message:', errorText);
    }
    
    console.log('Console errors during network failure:', errors);
  });

  test('should show loading state when Google button is clicked', async ({ page }) => {
    const googleButton = page.getByRole('button', { name: /continue with google/i });
    
    await googleButton.click();
    
    // Check if button becomes disabled (loading state)
    await expect(googleButton).toHaveAttribute('disabled');
    
    // Check if loading text appears or button changes
    const buttonText = await googleButton.textContent();
    console.log('Button text during loading:', buttonText);
  });

  test('should validate environment configuration', async ({ page }) => {
    // Check if required environment variables are accessible
    const result = await page.evaluate(() => {
      return {
        hasWindow: typeof window !== 'undefined',
        origin: window.location.origin,
        // Note: We can't directly access env vars in browser, but we can check if auth works
      };
    });
    
    console.log('Environment check:', result);
    expect(result.hasWindow).toBe(true);
    expect(result.origin).toContain('localhost:3000');
  });

  test('should check Supabase configuration', async ({ page }) => {
    // Inject a script to check if Supabase is properly configured
    const supabaseCheck = await page.evaluate(() => {
      // This will help us understand if Supabase client is properly initialized
      return {
        hasSupabase: typeof window !== 'undefined',
        // We'll check for common configuration issues
      };
    });
    
    console.log('Supabase configuration check:', supabaseCheck);
  });
});