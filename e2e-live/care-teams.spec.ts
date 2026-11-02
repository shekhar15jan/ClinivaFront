import { expect, test } from '@playwright/test';
import { registerDoctor, registerPatient, setDoctorHours, bookAppointment, signInAsNewAdmin, signInWithOtp } from './helpers';

/**
 * Care teams (requirement 45): with department access on, a clinician sees the clinical record of patients booked with
 * their department's doctors (their care team) and only registration details of everybody else's. departments.spec
 * covers the emergency-access override; this one covers the team itself: the booked doctor and a colleague in the
 * same department see the record, a doctor of another department does not, and switching department access off
 * gives everyone the clinic-wide view back.
 */
test('a patient\'s record is open to the care team of the booked department and closed to other departments', { tag: '@desktop' }, async ({ page, request, browser }) => {
  const admin = await signInAsNewAdmin(page, request, 'HMS_FULL');
  const code = admin.hospitalCode;
  const stamp = Date.now().toString().slice(-6);

  // Two departments, three doctors: Rao and Mehta in Cardiology, Iyer in Orthopaedics.
  await page.goto(`${code}/departments`);
  for (const name of ['Cardiology', 'Orthopaedics']) {
    await page.locator('#add-department').click();
    await page.fill('#department-name', name);
    const saved = page.waitForResponse((r) => r.request().method() === 'POST' && /\/hms\/departments$/.test(r.url()));
    await page.locator('#save-department').click();
    expect((await saved).ok(), `${name} created`).toBeTruthy();
    await expect(page.locator(`[data-name="${name}"]`)).toBeVisible();
  }
  const team = [
    { name: `Dr. Rao ${stamp}`, email: `rao${stamp}@live-team.test`, phone: `98${stamp}11`.slice(0, 10), department: 'Cardiology' },
    { name: `Dr. Mehta ${stamp}`, email: `mehta${stamp}@live-team.test`, phone: `98${stamp}22`.slice(0, 10), department: 'Cardiology' },
    { name: `Dr. Iyer ${stamp}`, email: `iyer${stamp}@live-team.test`, phone: `98${stamp}33`.slice(0, 10), department: 'Orthopaedics' },
  ];
  for (const d of team) {
    await registerDoctor(page, code, d.name, d.phone, d.email);
    await page.goto(`${code}/doctors`);
    await page.getByRole('button', { name: `View ${d.name}` }).filter({ visible: true }).click();
    const moved = page.waitForResponse((r) => r.request().method() === 'PUT' && /\/departments\/doctors$/.test(r.url()));
    await page.locator('#doctor-department-select').selectOption({ label: d.department });
    expect((await moved).ok(), `${d.name} moved to ${d.department}`).toBeTruthy();
  }

  // The patient is booked with Dr. Rao (Cardiology).
  const patient = `LIVE- Team Patient ${stamp}`;
  await registerPatient(page, code, patient, `97${stamp}44`.slice(0, 10));
  await setDoctorHours(page, code, team[0].name);
  await bookAppointment(page, code, team[0].name, patient);

  // Department access on.
  await page.goto(`${code}/departments`);
  await page.locator('#toggle-scoping').click();
  await expect(page.locator('#department-access')).toContainText('Department access is on');

  async function openRecord(email: string) {
    const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    const doctor = await context.newPage();
    await signInWithOtp(doctor, request, email);
    await doctor.goto(`${code}/patients?q=${encodeURIComponent(patient)}`);
    await doctor.getByRole('link', { name: patient }).filter({ visible: true }).first().click();
    return { doctor, context };
  }

  // The booked doctor and the colleague in the same department see the clinical record.
  for (const member of [team[0], team[1]]) {
    const { doctor, context } = await openRecord(member.email);
    await expect(doctor.locator('#detail-history'), `${member.name} sees the record`).toBeVisible({ timeout: 15000 });
    await expect(doctor.locator('#out-of-department')).toHaveCount(0);
    await context.close();
  }

  // A doctor of another department sees registration details only.
  {
    const { doctor, context } = await openRecord(team[2].email);
    await expect(doctor.locator('#out-of-department')).toBeVisible({ timeout: 15000 });
    await expect(doctor.locator('#detail-history')).toHaveCount(0);
    await context.close();
  }

  // Department access off: the clinic-wide view is back for the other department too.
  await page.goto(`${code}/departments`);
  await page.locator('#toggle-scoping').click();
  await expect(page.locator('#department-access')).not.toContainText('Department access is on');
  {
    const { doctor, context } = await openRecord(team[2].email);
    await expect(doctor.locator('#detail-history')).toBeVisible({ timeout: 15000 });
    await expect(doctor.locator('#out-of-department')).toHaveCount(0);
    await context.close();
  }
});
