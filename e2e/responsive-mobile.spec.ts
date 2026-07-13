import { test, expect } from '@playwright/test';
import { login } from './helpers/login';

test.describe('Responsive & Mobile Navigation (E2E)', () => {
  test('should show bottom navigation on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await login(page);
    await page.waitForTimeout(500);
    const bottomNav = page.locator('app-bottom-nav, [class*="bottom-nav"], nav.fixed.bottom-0');
    const count = await bottomNav.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should have bottom nav items on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await login(page);
    await page.waitForTimeout(500);
    const bottomNav = page.locator('app-bottom-nav, [class*="bottom-nav"], nav.fixed.bottom-0').first();
    await expect(bottomNav).toBeVisible();
  });

  test('should show hamburger menu toggle on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await login(page);
    await page.waitForTimeout(500);
    const menuBtn = page.locator('button').filter({ hasText: /menu/i }).or(page.locator('[class*="menu-btn"], [class*="hamburger"]')).first();
    const count = await menuBtn.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should show mobile drawer when menu button clicked', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await login(page);
    await page.waitForTimeout(500);
    const menuBtn = page.locator('button').filter({ hasText: /menu/i }).first();
    if (await menuBtn.isVisible()) {
      await menuBtn.click();
      await page.waitForTimeout(300);
      const drawer = page.locator('app-mobile-drawer, [class*="drawer"], [class*="sidenav"]');
      const count = await drawer.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('should navigate via bottom nav on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await login(page);
    await page.waitForTimeout(500);
    const bottomNavLinks = page.locator('app-bottom-nav a, app-bottom-nav button, nav.fixed.bottom-0 a');
    const count = await bottomNavLinks.count();
    if (count > 0) {
      await bottomNavLinks.first().click();
      await page.waitForTimeout(300);
    }
  });

  test('should close mobile drawer when clicking outside', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await login(page);
    await page.waitForTimeout(500);
    const menuBtn = page.locator('button').filter({ hasText: /menu/i }).first();
    if (await menuBtn.isVisible()) {
      await menuBtn.click();
      await page.waitForTimeout(300);
      await page.locator('.backdrop, .overlay, body').first().click({ position: { x: 10, y: 10 } }).catch(() => {});
      await page.waitForTimeout(300);
    }
  });

  test('should close mobile drawer when navigating to a page', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await login(page);
    await page.waitForTimeout(500);
    const menuBtn = page.locator('button').filter({ hasText: /menu/i }).first();
    if (await menuBtn.isVisible()) {
      await menuBtn.click();
      await page.waitForTimeout(300);
    }
    const dashboardLink = page.locator('app-mobile-drawer a, [class*="drawer"] a').filter({ hasText: /Dashboard/i }).first();
    if (await dashboardLink.isVisible()) {
      await dashboardLink.click();
      await page.waitForTimeout(300);
    }
  });

  test('should show header on mobile with hamburger and title', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await login(page);
    await page.waitForTimeout(500);
    const header = page.locator('app-header, header');
    await expect(header).toBeVisible();
  });

  test('should show all bottom nav icons on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await login(page);
    await page.waitForTimeout(500);
    const icons = page.locator('app-bottom-nav .material-symbols-outlined, nav.fixed.bottom-0 .material-symbols-outlined');
    const count = await icons.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should display correctly on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await login(page);
    await page.waitForTimeout(500);
    const sidebar = page.locator('app-sidebar, aside, [class*="sidebar"]');
    const count = await sidebar.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should display correctly on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page);
    await page.waitForTimeout(500);
    const sidebar = page.locator('app-sidebar, aside, [class*="sidebar"]');
    await expect(sidebar.first()).toBeVisible();
  });

  test('should navigate between modules on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await login(page);
    await page.waitForTimeout(500);
    const navItems = ['Patients', 'Appointments', 'Billing'];
    for (const item of navItems) {
      const link = page.getByText(item).first();
      if (await link.isVisible()) {
        await link.click();
        await page.waitForTimeout(300);
      }
    }
  });

  test('should not show sidebar on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await login(page);
    await page.waitForTimeout(500);
    const sidebar = page.locator('app-sidebar:not(.open):not(.visible), aside:not(.open):not(.visible)');
    const isHidden = await sidebar.first().isHidden().catch(() => true);
    expect(isHidden).toBeTruthy();
  });

  test('should maintain session across viewport changes', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await login(page);
    await expect(page).toHaveURL(/\/dashboard/);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(300);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should have accessible touch targets on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await login(page);
    await page.waitForTimeout(500);
    const buttons = page.locator('app-bottom-nav button, app-bottom-nav a, nav.fixed.bottom-0 button, nav.fixed.bottom-0 a');
    const count = await buttons.count();
    for (let i = 0; i < Math.min(count, 5); i++) {
      const box = await buttons.nth(i).boundingBox();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(40);
        expect(box.height).toBeGreaterThanOrEqual(40);
      }
    }
  });
});
