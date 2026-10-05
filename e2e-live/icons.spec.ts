import { expect, test } from '@playwright/test';

/**
 * Icons are drawn straight away from the font served with each app: on a fresh browser (empty cache) the icon font
 * is ready within a few seconds, comes from the app itself (never Google), and an icon is drawn as a glyph, not as
 * its name in letters.
 */
for (const [app, url] of [['Cliniva', process.env.BASE_URL || 'http://localhost:4201'], ['CloudSuite', process.env.CLOUDSUITE_URL || 'http://localhost:4200']]) {
  test(`${app}: icons come from the app and are drawn quickly @desktop`, async ({ page }) => {
    const iconRequests: string[] = [];
    page.on('request', (r) => {
      if (/material.?symbols/i.test(r.url())) iconRequests.push(r.url());
    });
    const started = Date.now();
    await page.goto(`${url}/login`);
    await page.locator('.material-symbols-outlined').first().waitFor({ state: 'attached', timeout: 30000 });
    await page.evaluate(() => document.fonts.ready);
    const ready = await page.evaluate(() => document.fonts.check('24px "Material Symbols Outlined"', 'home'));
    const ms = Date.now() - started;
    expect(ready, 'the icon font is loaded').toBe(true);
    expect(ms, 'icons ready within 5 seconds of opening the page').toBeLessThan(5000);
    expect(iconRequests.length, 'the icon font was requested').toBeGreaterThan(0);
    expect(iconRequests.filter((u) => /googleapis|gstatic/.test(u)), 'nothing fetched from Google for icons').toEqual([]);
    // Drawn as a glyph: an icon ligature is about one em wide; its name in letters would be several times wider.
    const widths = await page.locator('.material-symbols-outlined:visible').evaluateAll((els) =>
      els.slice(0, 5).map((e) => ({ name: e.textContent?.trim(), width: e.getBoundingClientRect().width,
        size: parseFloat(getComputedStyle(e).fontSize) })));
    for (const w of widths) {
      expect(w.width, `"${w.name}" is drawn as an icon`).toBeLessThan(w.size * 1.6);
    }
    test.info().annotations.push({ type: 'icons ready', description: `${ms} ms` });
    console.log(`${app}: icons ready in ${ms} ms; checked ${widths.map((w) => w.name).join(', ')}`);
  });
}
