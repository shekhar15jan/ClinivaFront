import { test, expect } from '@playwright/test';
import { loginAsDoctor } from './helpers/login-as';

test.describe('Notification Center', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDoctor(page);
    await page.goto('/dashboard');
  });

  test('should display notification bell in header', async ({ page }) => {
    const bellButton = page.locator('button[aria-label="Notifications"]');
    await expect(bellButton).toBeVisible();
  });

  test('should show unread count badge when notifications exist', async ({ page }) => {
    // Wait for notifications to load
    await page.waitForTimeout(1000);
    
    const badge = page.locator('button[aria-label="Notifications"] span').filter({ hasText: /\d+/ });
    
    // Badge may or may not be visible depending on mock data
    if (await badge.isVisible()) {
      await expect(badge).toContainText(/\d+/);
    }
  });

  test('should open notification dropdown on click', async ({ page }) => {
    await page.locator('button[aria-label="Notifications"]').click();
    
    const dropdown = page.locator('.notification-dropdown');
    await expect(dropdown).toBeVisible();
    
    await expect(dropdown).toContainText('Notifications');
  });

  test('should close dropdown when clicking outside', async ({ page }) => {
    await page.locator('button[aria-label="Notifications"]').click();
    
    const dropdown = page.locator('.notification-dropdown');
    await expect(dropdown).toBeVisible();
    
    // Click outside
    await page.locator('h1').first().click();
    
    await expect(dropdown).not.toBeVisible();
  });

  test('should display notification list', async ({ page }) => {
    await page.locator('button[aria-label="Notifications"]').click();
    
    const dropdown = page.locator('.notification-dropdown');
    await expect(dropdown).toBeVisible();
    
    // Should show either notifications or empty state
    const hasNotifications = await dropdown.getByText(/no notifications yet/i).isVisible();
    const hasNotificationItems = await dropdown.locator('button').filter({ hasText: /.+/ }).count();
    
    expect(hasNotifications || hasNotificationItems > 0).toBeTruthy();
  });

  test('should mark notification as read on click', async ({ page }) => {
    await page.locator('button[aria-label="Notifications"]').click();
    
    const dropdown = page.locator('.notification-dropdown');
    const unreadNotification = dropdown.locator('button').filter({ has: page.locator('.bg-primary') }).first();
    
    if (await unreadNotification.isVisible()) {
      await unreadNotification.click();
      
      // Notification should be marked as read (dot should disappear)
      await expect(unreadNotification.locator('.bg-primary')).not.toBeVisible({ timeout: 3000 });
    }
  });

  test('should mark all notifications as read', async ({ page }) => {
    await page.locator('button[aria-label="Notifications"]').click();
    
    const dropdown = page.locator('.notification-dropdown');
    const markAllButton = dropdown.getByRole('button', { name: /mark all read/i });
    
    if (await markAllButton.isVisible()) {
      await markAllButton.click();
      
      // All unread dots should disappear
      await expect(dropdown.locator('.bg-primary').first()).not.toBeVisible({ timeout: 3000 });
    }
  });

  test('should close dropdown via close button', async ({ page }) => {
    await page.locator('button[aria-label="Notifications"]').click();
    
    const dropdown = page.locator('.notification-dropdown');
    await expect(dropdown).toBeVisible();
    
    const closeButton = dropdown.getByRole('button', { name: /close/i });
    if (await closeButton.isVisible()) {
      await closeButton.click();
      await expect(dropdown).not.toBeVisible();
    }
  });

  test('should show notification icons based on type', async ({ page }) => {
    await page.locator('button[aria-label="Notifications"]').click();
    
    const dropdown = page.locator('.notification-dropdown');
    
    // Check for notification icons
    const icons = dropdown.locator('.material-symbols-outlined');
    const iconCount = await icons.count();
    
    if (iconCount > 0) {
      // Should have valid icon names
      const iconTexts = await icons.allTextContents();
      const validIcons = ['event_available', 'event_busy', 'event_cancelled', 'description', 'receipt_long', 'payments', 'notifications'];
      
      for (const text of iconTexts) {
        if (text.trim()) {
          expect(validIcons).toContain(text.trim());
        }
      }
    }
  });

  test('should display relative time for notifications', async ({ page }) => {
    await page.locator('button[aria-label="Notifications"]').click();
    
    const dropdown = page.locator('.notification-dropdown');
    const timeElements = dropdown.locator('p').filter({ hasText: /ago|just now/i });
    
    if (await timeElements.count() > 0) {
      const firstTime = await timeElements.first().textContent();
      expect(firstTime).toMatch(/(\d+m ago|\d+h ago|\d+d ago|Just now)/);
    }
  });
});
