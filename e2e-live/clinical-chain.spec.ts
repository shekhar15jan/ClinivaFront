import { expect, test } from '@playwright/test';
import { addMedicine, bookAppointment, registerDoctor, registerPatient, setDoctorHours, signInAsNewAdmin, signInWithOtp } from './helpers';

/**
 * The whole visit on real services, by the people who really do each part: the front desk books the
 * patient, the doctor (signed in with their own emailed code) records the consultation and prescribes
 * from the clinic's catalog, and the front desk generates the bill and takes the payment.
 */
test.describe('Visit from booking to payment, real backend', () => {
  test('consultation, prescription, bill and payment carry the right people and amounts through', async ({ page, request, browser }) => {
    const admin = await signInAsNewAdmin(page, request, 'HMS_FULL');
    const stamp = Date.now().toString().slice(-6);
    const doctorName = `Dr. Chain ${stamp}`;
    const doctorEmail = `dr.chain${stamp}@live-staff.test`;
    const patientName = `Chain Patient ${stamp}`;
    const medicine = `Amoxil ${stamp}`;

    // Front desk sets the clinic up and books the visit. The doctor is added with an email, which creates their login.
    await registerDoctor(page, admin.hospitalCode, doctorName, `98${stamp}11`.slice(0, 10), doctorEmail); // consultation fee 600
    await registerPatient(page, admin.hospitalCode, patientName, `97${stamp}12`.slice(0, 10));
    await addMedicine(page, admin.hospitalCode, medicine, '12.50');
    await setDoctorHours(page, admin.hospitalCode, doctorName);
    const appointmentId = await bookAppointment(page, admin.hospitalCode, doctorName, patientName);

    // A new booking waits for approval; the front desk approves it from the day's list.
    await page.goto(`/${admin.hospitalCode}/appointments`);
    const booked = page.locator('li', { hasText: patientName });
    await expect(booked).toContainText('Pending', { timeout: 15000 });
    const approved = page.waitForResponse((r) => r.request().method() === 'PUT' && /\/approve$/.test(r.url()));
    await booked.getByRole('button', { name: 'Approve' }).click();
    expect((await approved).ok(), 'appointment approved').toBeTruthy();
    await expect(booked).toContainText('Approved');

    const doctorContext = await browser.newContext();
    const doctorPage = await doctorContext.newPage();
    await signInWithOtp(doctorPage, request, doctorEmail);

    // Consultation: notes and one medicine from the catalog.
    await doctorPage.goto(`/${admin.hospitalCode}/appointments`);
    await doctorPage.locator('li', { hasText: patientName }).getByRole('link', { name: 'Start consultation' }).click();
    await expect(doctorPage).toHaveURL(new RegExp(`/${admin.hospitalCode}/consultations/${appointmentId}$`));
    await expect(doctorPage.locator('#chiefComplaint')).toBeVisible({ timeout: 15000 });
    await doctorPage.fill('#chiefComplaint', 'Fever for three days');
    await doctorPage.fill('#diagnosis', 'Viral fever');
    await doctorPage.fill('input[formControlName="bp"]', '120/80');
    await doctorPage.fill('input[formControlName="temp"]', '101.2');
    // The workspace opens with one empty medicine row.
    const name = doctorPage.locator('input[formControlName="name"]').first();
    await name.fill(stamp);
    await doctorPage.getByRole('button', { name: new RegExp(medicine) }).click();
    await expect(name).toHaveValue(medicine);
    await doctorPage.locator('input[formControlName="duration"]').first().fill('5');

    const consultation = doctorPage.waitForResponse((r) => r.request().method() === 'POST' && /\/hms\/consultations$/.test(r.url()));
    const prescription = doctorPage.waitForResponse((r) => r.request().method() === 'POST' && /\/hms\/prescriptions$/.test(r.url()));
    await doctorPage.getByRole('button', { name: /Finish & Print/ }).click();
    const consultationRes = await consultation;
    expect(consultationRes.ok(), `consultation saved (${consultationRes.status()} ${(await consultationRes.text()).slice(0, 200)})`).toBeTruthy();
    const prescriptionRes = await prescription;
    expect(prescriptionRes.ok(), `prescription saved (${prescriptionRes.status()})`).toBeTruthy();
    const prescriptionId = (await prescriptionRes.json()).data.id as string;

    // The doctor is told, and lands on what was saved; billing is not theirs to do.
    await expect(doctorPage.getByText('Consultation and prescription saved')).toBeVisible();
    await expect(doctorPage).toHaveURL(new RegExp(`/${admin.hospitalCode}/prescriptions/${prescriptionId}$`));
    await expect(doctorPage.getByText(patientName).first()).toBeVisible();
    await expect(doctorPage.getByText(doctorName).first()).toBeVisible();
    await expect(doctorPage.getByText(medicine).first()).toBeVisible();
    await expect(doctorPage.locator('#generate-bill')).toHaveCount(0);
    await doctorContext.close();

    // Front desk opens the same prescription and bills it: fee 600 + 10 doses x 12.50 = 125, plus 50 extra, less 25 discount.
    await page.goto(`/${admin.hospitalCode}/prescriptions/${prescriptionId}`);
    await page.fill('#bill-additional', '50');
    await page.fill('#bill-discount', '25');
    const generated = page.waitForResponse((r) => r.request().method() === 'POST' && /\/hms\/bills\/generate/.test(r.url()));
    await page.locator('#generate-bill-button').click();
    const bill = await generated;
    expect(bill.ok(), 'bill generated').toBeTruthy();
    await expect(page).toHaveURL(new RegExp(`/${admin.hospitalCode}/billing/[0-9a-f-]{36}$`));
    const totalInPaisa = (await bill.json()).data.totalAmountInPaisa as number;
    expect(totalInPaisa, 'consultation 600 + medicine 125 + extra 50 - discount 25').toBe(75000);

    // The invoice shows the people and the amount, and starts unpaid.
    await expect(page.getByText(patientName).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('UNPAID').first()).toBeVisible();

    // Take the payment in cash. It must be recorded on the server, not just shown as paid in the browser.
    await page.locator('#collect-payment').click();
    const paid = page.waitForResponse((r) => r.request().method() === 'POST' && /\/hms\/payments\/save$/.test(r.url()));
    await page.locator('#payment-confirm').click();
    const payment = await paid;
    expect(payment.ok(), `payment saved (${payment.status()})`).toBeTruthy();
    expect((await payment.json()).data.amountInPaisa).toBe(75000);
    await expect(page.getByText('Payment recorded')).toBeVisible();
    await expect(page.getByText('PAID', { exact: true }).first()).toBeVisible();

    // A reload still says paid, so it is the server's state, and there is nothing left to collect.
    await page.reload();
    await expect(page.getByText('PAID', { exact: true }).first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#collect-payment')).toHaveCount(0);

    // The payment appears in the Payments list.
    await page.goto(`/${admin.hospitalCode}/payments`);
    await expect(page.getByText(patientName).first()).toBeVisible({ timeout: 15000 });
  });
});
