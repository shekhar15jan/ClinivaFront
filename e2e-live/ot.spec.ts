import { Page, expect, test } from '@playwright/test';
import { registerDoctor, registerPatient, signInAsNewAdmin } from './helpers';

/** The operation theatre on real services: a theatre, a day case booked, the safety checklist in order, the note, the bill. */
function watch(page: Page): string[] {
  const problems: string[] = [];
  page.on('response', (r) => {
    if (r.url().includes('/api/v1/') && r.status() >= 400 && !r.url().includes('/auth/refresh')) {
      problems.push(`${r.status()} ${r.request().method()} ${r.url().split('/api/v1')[1]}`);
    }
  });
  page.on('pageerror', (e) => problems.push(`uncaught: ${e.message.slice(0, 160)}`));
  return problems;
}

test('a day-case surgery from booking through the checklist to its bill @desktop', async ({ page, request }) => {
  test.setTimeout(240000);
  const admin = await signInAsNewAdmin(page, request, 'HMS_FULL');
  const problems = watch(page);
  const code = admin.hospitalCode;
  const stamp = Date.now().toString().slice(-6);
  const patientName = `Surgery Patient ${stamp}`;
  const surgeon = `Surgeon ${stamp}`;
  await registerDoctor(page, code, surgeon, `88${stamp}83`.slice(0, 10));
  await registerPatient(page, code, patientName, `89${stamp}84`.slice(0, 10));

  await page.goto(`${code}/ot`);
  await expect(page.locator('#ot-theatres')).toBeVisible();
  await page.fill('#new-theatre', 'OT 1');
  await page.locator('#add-theatre').click();
  await expect(page.locator('[data-theatre="OT 1"]')).toBeVisible();

  await page.goto(`${code}/patients`);
  await page.getByText(patientName).first().click();
  await page.locator('#book-surgery').click();
  await expect(page.locator('#ot-book-for')).toContainText(patientName);
  await page.locator('#ot-surgeon').selectOption({ label: `Dr ${surgeon}` });
  await page.fill('#ot-procedure', 'Excision of lipoma');
  const tomorrow = new Date(Date.now() + 86_400_000);
  const day = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
  await page.fill('#ot-start', `${day}T10:00`);
  await page.fill('#ot-surgeon-fee', '5000');
  await page.locator('#ot-book').click();
  await expect(page.locator('#ot-status')).toHaveText('Booked');

  for (const step of ['consent', 'sign-in', 'time-out']) {
    await page.locator(`#step-${step}`).click();
    await expect(page.locator(`#step-${step}`)).toHaveAttribute('data-done', 'true');
  }
  await expect(page.locator('#ot-status')).toHaveText('In surgery');
  await expect(page.locator('#step-sign-out')).toBeDisabled();
  await page.locator('#write-note').click();
  await page.fill('#note-procedure', 'Lipoma excised in toto; skin closed with 3-0 nylon.');
  await page.locator('#save-note').click();
  await expect(page.locator('#ot-note-text')).toContainText('excised');
  await page.locator('#step-sign-out').click();
  await expect(page.locator('#ot-status')).toHaveText('Over');

  await page.locator('#ot-bill').click();
  await expect(page.locator('#ot-fees')).toContainText('Billed: BILL-');
  expect(problems, problems.join('\n')).toEqual([]);
});
