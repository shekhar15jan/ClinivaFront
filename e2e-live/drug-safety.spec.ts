import { expect, test } from '@playwright/test';
import { bookAppointment, registerDoctor, registerPatient, setDoctorHours, signInAsNewAdmin, signInWithOtp } from './helpers';

/**
 * Drug safety on real services: the doctor records an allergy on the consultation screen, tries to prescribe a drug it
 * covers, is stopped, and can go ahead only by acknowledging the warning and giving a reason.
 */
test.describe('Drug allergy warning at prescribing, real backend', () => {
  test('an allergy holds the prescription until the doctor acknowledges it with a reason @desktop', async ({ page, request, browser }) => {
    const admin = await signInAsNewAdmin(page, request, 'HMS_FULL');
    const stamp = Date.now().toString().slice(-6);
    const doctorName = `Dr. Safety ${stamp}`;
    const doctorEmail = `dr.safety${stamp}@live-staff.test`;
    const patientName = `Safety Patient ${stamp}`;

    await registerDoctor(page, admin.hospitalCode, doctorName, `98${stamp}21`.slice(0, 10), doctorEmail);
    await registerPatient(page, admin.hospitalCode, patientName, `97${stamp}22`.slice(0, 10));
    await setDoctorHours(page, admin.hospitalCode, doctorName);
    const appointmentId = await bookAppointment(page, admin.hospitalCode, doctorName, patientName);

    await page.goto(`${admin.hospitalCode}/appointments`);
    const booked = page.locator('li', { hasText: patientName });
    await expect(booked).toContainText('Pending', { timeout: 15000 });
    const approved = page.waitForResponse((r) => r.request().method() === 'PUT' && /\/approve$/.test(r.url()));
    await booked.getByRole('button', { name: 'Approve' }).click();
    expect((await approved).ok(), 'appointment approved').toBeTruthy();

    const doctorContext = await browser.newContext();
    const doctor = await doctorContext.newPage();
    await signInWithOtp(doctor, request, doctorEmail);
    await doctor.goto(`${admin.hospitalCode}/consultations/${appointmentId}`);
    await expect(doctor.locator('#chiefComplaint')).toBeVisible({ timeout: 20000 });

    // The doctor records the allergy on the consultation screen.
    await expect(doctor.locator('#allergy-panel')).toContainText('None recorded');
    await doctor.getByLabel('Allergic to').fill('Penicillin');
    await doctor.getByLabel('How severe').selectOption('SEVERE');
    await doctor.getByLabel('Reaction').fill('Anaphylaxis');
    const added = doctor.waitForResponse((r) => r.request().method() === 'POST' && /\/allergies$/.test(r.url()));
    await doctor.locator('#add-allergy').click();
    expect((await added).ok(), 'allergy recorded').toBeTruthy();
    await expect(doctor.locator('.allergy-chip')).toContainText('Penicillin');

    // A drug the allergy covers.
    await doctor.fill('#chiefComplaint', 'Sore throat');
    await doctor.fill('#diagnosis', 'Tonsillitis');
    await doctor.locator('input[formControlName="name"]').first().fill('Amoxicillin 500');
    await doctor.locator('input[formControlName="duration"]').first().fill('5');

    // Pressing finish shows the warning and saves nothing.
    let saved = false;
    doctor.on('request', (r) => {
      if (r.method() === 'POST' && /\/hms\/(consultations|prescriptions)$/.test(r.url())) saved = true;
    });
    const checked = doctor.waitForResponse((r) => r.request().method() === 'POST' && /\/prescriptions\/safety-check$/.test(r.url()));
    await doctor.getByRole('button', { name: /Finish & Print/ }).click();
    expect((await checked).ok(), 'safety check answered').toBeTruthy();
    await expect(doctor.locator('#safety-panel')).toContainText('allergic to Penicillin');
    await expect(doctor.locator('#safety-panel')).toContainText('not saved yet');
    expect(saved, 'nothing is saved while a serious warning is open').toBe(false);

    // Ticking without a reason does not open the way.
    await doctor.locator('#safety-ack').check();
    // Wait for the check to answer before going on: the decision is taken when it answers, using what is typed by then.
    const checkedAgain = doctor.waitForResponse((r) => r.request().method() === 'POST' && /\/prescriptions\/safety-check$/.test(r.url()));
    await doctor.getByRole('button', { name: /Finish & Print/ }).click();
    await checkedAgain;
    await expect(doctor.locator('#safety-panel')).toBeVisible();
    await expect(doctor.getByRole('button', { name: /Finish & Print/ })).toBeEnabled();
    expect(saved, 'a reason is needed').toBe(false);

    // With a reason the prescription is saved.
    await doctor.locator('#safety-reason').fill('Tolerated a supervised first dose before; no alternative covers this infection');
    const consultation = doctor.waitForResponse((r) => r.request().method() === 'POST' && /\/hms\/consultations$/.test(r.url()));
    const prescription = doctor.waitForResponse((r) => r.request().method() === 'POST' && /\/hms\/prescriptions$/.test(r.url()));
    await doctor.getByRole('button', { name: /Finish & Print/ }).click();
    expect((await consultation).ok(), 'consultation saved').toBeTruthy();
    const prescriptionRes = await prescription;
    expect(prescriptionRes.ok(), `prescription saved (${prescriptionRes.status()})`).toBeTruthy();
    await expect(doctor.getByText('Consultation and prescription saved')).toBeVisible();
    await doctorContext.close();
  });
});
