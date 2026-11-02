import { expect, test } from '@playwright/test';
import { signInAsNewAdmin } from './helpers';

/**
 * The in-app Help link and the first-run tour (requirement 77). Every other spec switches the tour off
 * (cliniva.tour.off); this one leaves it on so the first sign-in shows it.
 */
test.use({ storageState: { cookies: [], origins: [] } });

test('the first sign-in shows the tour once; Help opens the guides and can start the tour again', async ({ page, request }) => {
  const admin = await signInAsNewAdmin(page, request, 'HMS_FULL');
  const code = admin.hospitalCode;

  // First sign-in: the tour card sits on the home screen, with a step count and a title.
  const card = page.locator('#tour-card');
  await expect(card).toBeVisible({ timeout: 20000 });
  await expect(page.locator('#tour-count')).toContainText(/Step 1 of \d+/);
  const title = await page.locator('#tour-title').innerText();
  expect(title.trim().length, 'step title').toBeGreaterThan(0);

  // Next moves on, Back returns, and closing remembers it for this person.
  await page.locator('#tour-next').click();
  await expect(page.locator('#tour-count')).toContainText(/Step 2 of/);
  await page.locator('#tour-back').click();
  await expect(page.locator('#tour-count')).toContainText(/Step 1 of/);
  await page.locator('#tour-skip').click();
  await expect(card).toHaveCount(0);

  // A reload does not bring it back.
  await page.reload();
  await expect(page.locator('#header-help').filter({ visible: true })).toBeVisible({ timeout: 20000 });
  await page.waitForTimeout(1500);
  await expect(card).toHaveCount(0);

  // The Help link in the header opens the guides for the role.
  await page.locator('#header-help').filter({ visible: true }).click();
  await expect(page).toHaveURL(new RegExp(`/${code}/help$`, 'i'));
  await expect(page.locator('#help-for')).toContainText(/Short guides for/);
  const articles = page.locator('#help-list [data-article]');
  expect(await articles.count(), 'at least one guide for the owner').toBeGreaterThan(0);
  await articles.first().locator('summary').click();
  await expect(articles.first().locator('ol li').first()).toBeVisible();
  // "Everything" shows at least as many guides as "For my role".
  const mine = await articles.count();
  await page.locator('#show-all').click();
  expect(await articles.count()).toBeGreaterThanOrEqual(mine);

  // "Take the quick tour again" restarts it; it shows on the home screen (back, without a reload).
  await page.locator('#start-tour').click();
  await page.goBack();
  await expect(page.locator('#tour-card')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('#tour-count')).toContainText(/Step 1 of/);
  await page.locator('#tour-skip').click();
});
