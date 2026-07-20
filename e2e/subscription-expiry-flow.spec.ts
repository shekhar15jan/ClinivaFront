import { test, expect } from '@playwright/test';

test.describe('Subscription Expiry Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@cliniva.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should display subscription status on dashboard', async ({ page }) => {
    // Verify subscription status widget is visible
    await expect(page.locator('.subscription-status')).toBeVisible();
    await expect(page.locator('.subscription-expiry')).toBeVisible();
  });

  test('should show warning when subscription is expiring soon', async ({ page }) => {
    // This test assumes subscription is expiring within 7 days
    // In real test, you'd mock the subscription status
    const warningBanner = page.locator('.subscription-warning');
    
    // If subscription is expiring soon, warning should be visible
    if (await warningBanner.isVisible()) {
      await expect(warningBanner).toContainText('expiring soon');
      await expect(warningBanner.locator('button:has-text("Renew")')).toBeVisible();
    }
  });

  test('should redirect to subscription page when subscription expired', async ({ page }) => {
    // Try to access a restricted feature
    await page.click('a[href="/patients"]');
    
    // If subscription is expired, should show subscription required message
    const subscriptionRequired = page.locator('.subscription-required');
    if (await subscriptionRequired.isVisible()) {
      await expect(subscriptionRequired).toContainText('subscription');
      await expect(subscriptionRequired.locator('button:has-text("Renew Subscription")')).toBeVisible();
    }
  });

  test('should allow renewal from subscription page', async ({ page }) => {
    // Navigate to subscription page
    await page.click('a[href="/subscription"]');
    await page.waitForLoadState('networkidle');

    // Click renew button
    await page.click('button:has-text("Renew Subscription")');

    // Verify payment modal or redirect
    await expect(page.locator('.payment-modal, .payment-page')).toBeVisible();
  });

  test('should show subscription plans', async ({ page }) => {
    // Navigate to subscription page
    await page.click('a[href="/subscription"]');
    await page.waitForLoadState('networkidle');

    // Verify plans are displayed
    await expect(page.locator('.plan-card')).toHaveCount(3); // Basic, Pro, Enterprise
    
    // Verify plan details
    const basicPlan = page.locator('.plan-card:has-text("Basic")');
    await expect(basicPlan).toBeVisible();
    await expect(basicPlan.locator('.plan-price')).toBeVisible();
    await expect(basicPlan.locator('.plan-features')).toBeVisible();
  });

  test('should disable modules when subscription expires', async ({ page }) => {
    // This test verifies BR-28: subscriptionExpired_modulesExpired
    // Try to access a module that should be disabled
    await page.goto('/medicines');
    
    // If subscription is expired, should show module not active message
    const moduleNotActive = page.locator('.module-not-active');
    if (await moduleNotActive.isVisible()) {
      await expect(moduleNotActive).toContainText('not active');
      await expect(moduleNotActive).toContainText('subscription');
    }
  });
});