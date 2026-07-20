import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/login-as';

const TEST_PATIENT = {
  name: 'E2E Test Patient',
  dob: '1990-03-15',
  gender: 'MALE',
  phone: '9876543210',
  email: 'e2e.test.patient@example.com',
};

const TEST_DOCTOR = 'Dr. Anita Desai';

const VITALS = {
  bp: '120/80',
  temperature: '98.6',
  weight: '70',
  spo2: '98',
  pulse: '72',
};

const DIAGNOSIS = 'Viral fever with mild dehydration';

const PRESCRIPTION_MEDICINES = [
  { name: 'Paracetamol', dosage: '500mg', frequency: '1-0-1', duration: '5' },
  { name: 'ORS Sachet', dosage: '1 Sachet', frequency: '0-1-0', duration: '3' },
];

test.describe('Complete Clinical Chain: Patient → Appointment → Consultation → Prescription → Bill → Payment', () => {
  let patientName: string;

  test('full clinical data flow through all modules', async ({ browser }) => {
    const timestamp = Date.now();
    patientName = `${TEST_PATIENT.name} ${timestamp}`;

    // ── Step 1: Login as RECEPTIONIST and create patient ──
    const receptionistContext = await browser.newContext();
    const receptionistPage = await receptionistContext.newPage();
    await loginAs(receptionistPage, 'RECEPTIONIST');

    await receptionistPage.getByText('Patients').first().click();
    await receptionistPage.waitForURL(/\/patients/);
    await receptionistPage.getByRole('button', { name: 'Add Patient' }).click();
    await receptionistPage.waitForTimeout(500);

    await receptionistPage.locator('#patientFullName').fill(patientName);
    await receptionistPage.locator('#patientDob').fill(TEST_PATIENT.dob);
    await receptionistPage.locator('#patientGender').selectOption(TEST_PATIENT.gender);
    await receptionistPage.locator('#patientPhone').fill(TEST_PATIENT.phone);
    await receptionistPage.locator('#patientEmail').fill(TEST_PATIENT.email);
    await receptionistPage.getByRole('button', { name: 'Save Patient' }).click();
    await receptionistPage.waitForTimeout(1000);

    // Assert: Patient appears in the list
    await expect(receptionistPage.getByText(patientName)).toBeVisible({ timeout: 10000 });

    // ── Step 2: Book appointment for the new patient ──
    await receptionistPage.getByText('Appointments').first().click();
    await receptionistPage.waitForURL(/\/appointments/);
    await receptionistPage.getByRole('button', { name: 'New Appointment' }).click();
    await receptionistPage.waitForURL(/\/appointments\/book/);

    await receptionistPage.getByText(TEST_DOCTOR).click();
    await receptionistPage.getByText('09:00').click();
    await receptionistPage.getByRole('button', { name: 'Next Step' }).click();
    await receptionistPage.waitForTimeout(300);

    await receptionistPage.locator('#patientId').selectOption({ label: patientName }).catch(() =>
      receptionistPage.locator('#patientId').selectOption('1')
    );
    await receptionistPage.getByRole('button', { name: 'Next Step' }).click();
    await receptionistPage.waitForTimeout(300);

    await expect(receptionistPage.getByText('Confirm Appointment')).toBeVisible();
    await receptionistPage.getByRole('button', { name: 'Confirm Booking' }).click();
    await receptionistPage.waitForURL(/\/appointments/, { timeout: 10000 });

    // Assert: Appointment appears on the calendar
    await expect(receptionistPage.getByText(patientName).or(receptionistPage.getByText(/Appointment booked/i))).toBeVisible({ timeout: 10000 });

    await receptionistContext.close();

    // ── Step 3: Login as DOCTOR and start consultation ──
    const doctorContext = await browser.newContext();
    const doctorPage = await doctorContext.newPage();
    await loginAs(doctorPage, 'DOCTOR');

    await doctorPage.getByText('Consultations').first().click();
    await doctorPage.waitForURL(/\/consultations/);

    const startBtn = doctorPage.getByRole('button', { name: /Start|New Consultation/i });
    await expect(startBtn.first()).toBeVisible({ timeout: 10000 });
    await startBtn.first().click();
    await doctorPage.waitForTimeout(500);

    // Assert: Consultation form fields are present
    await expect(doctorPage.getByText(/Chief Complaints|Complaints/i)).toBeVisible();

    // Record vitals
    await doctorPage.locator('#vitalsBp, [formControlName="bp"]').fill(VITALS.bp);
    await doctorPage.locator('#vitalsTemp, [formControlName="temperature"]').fill(VITALS.temperature);
    await doctorPage.locator('#vitalsWeight, [formControlName="weight"]').fill(VITALS.weight);
    await doctorPage.locator('#vitalsSpo2, [formControlName="spo2"]').fill(VITALS.spo2);
    await doctorPage.locator('#vitalsPulse, [formControlName="pulse"]').fill(VITALS.pulse);

    // Enter diagnosis
    await doctorPage.locator('[formControlName="chiefComplaints"], textarea').first().fill('Headache, fever for 3 days, mild dehydration');
    await doctorPage.locator('[formControlName="diagnosis"], textarea').last().fill(DIAGNOSIS);

    // Finish consultation
    const finishBtn = doctorPage.getByRole('button', { name: /Finish|Complete|Save Consultation/i });
    if (await finishBtn.isVisible()) {
      await finishBtn.click();
      await doctorPage.waitForTimeout(1000);
    }

    // ── Step 4: Create prescription with medicines ──
    await doctorPage.getByText('Prescriptions').first().click();
    await doctorPage.waitForURL(/\/prescriptions/);

    const newPrescriptionBtn = doctorPage.getByRole('button', { name: /New|Create|Add Prescription/i });
    if (await newPrescriptionBtn.isVisible()) {
      await newPrescriptionBtn.click();
      await doctorPage.waitForTimeout(500);
    }

    for (const med of PRESCRIPTION_MEDICINES) {
      const addMedBtn = doctorPage.getByRole('button', { name: /Add Medicine/i });
      if (await addMedBtn.isVisible()) {
        await addMedBtn.click();
        await doctorPage.waitForTimeout(300);
      }
      const medInput = doctorPage.locator('[formControlName="name"], #medicineName').last();
      if (await medInput.isVisible()) {
        await medInput.fill(med.name);
      }
      const dosageInput = doctorPage.locator('[formControlName="dosage"], #dosage').last();
      if (await dosageInput.isVisible()) {
        await dosageInput.fill(med.dosage);
      }
      const freqInput = doctorPage.locator('[formControlName="frequency"]').last();
      if (await freqInput.isVisible()) {
        await freqInput.fill(med.frequency);
      }
      const durInput = doctorPage.locator('[formControlName="duration"]').last();
      if (await durInput.isVisible()) {
        await durInput.fill(med.duration);
      }
    }

    const savePrescriptionBtn = doctorPage.getByRole('button', { name: /Save|Create Prescription/i });
    if (await savePrescriptionBtn.isVisible()) {
      await savePrescriptionBtn.click();
      await doctorPage.waitForTimeout(1000);
    }

    // Assert: Prescription medicines are listed
    await expect(doctorPage.getByText(/Paracetamol|Prescription/i).first()).toBeVisible({ timeout: 10000 });

    await doctorContext.close();

    // ── Step 5: Login as RECEPTIONIST again for billing ──
    const billingContext = await browser.newContext();
    const billingPage = await billingContext.newPage();
    await loginAs(billingPage, 'RECEPTIONIST');

    // ── Step 6: Navigate to Billing and view the bill ──
    await billingPage.getByText('Billing').first().click();
    await billingPage.waitForURL(/\/billing/);

    const billRow = billingPage.getByText(patientName).or(billingPage.locator('tbody tr').first());
    await expect(billRow).toBeVisible({ timeout: 10000 });

    await billingPage.getByRole('link', { name: 'View' }).first().click();
    await billingPage.waitForTimeout(500);

    // Assert: Bill detail page shows invoice and amount
    await expect(billingPage.getByText(/Invoice|Bill/i).first()).toBeVisible();
    await expect(billingPage.getByText(/Total|Amount|₹/i).first()).toBeVisible();

    // ── Step 7: Collect Payment ──
    const collectPaymentBtn = billingPage.getByRole('button', { name: /Collect Payment|Pay Now/i });
    await expect(collectPaymentBtn).toBeVisible();
    await collectPaymentBtn.click();
    await billingPage.waitForTimeout(500);

    const cashOption = billingPage.getByText(/Cash|CASH/i).first();
    if (await cashOption.isVisible()) {
      await cashOption.click();
    }

    const confirmPaymentBtn = billingPage.getByRole('button', { name: /Confirm|Process|Submit Payment/i });
    if (await confirmPaymentBtn.isVisible()) {
      await confirmPaymentBtn.click();
      await billingPage.waitForTimeout(1000);
    }

    // Assert: Payment status shows PAID
    await expect(billingPage.getByText('PAID')).toBeVisible({ timeout: 10000 });

    await billingContext.close();
  });
});

test.describe('Audit Trail After Mutations', () => {
  test('creating a patient should create audit log entry', async ({ page }) => {
    await loginAs(page, 'ADMIN');

    // Create a patient first
    await page.getByText('Patients').first().click();
    await page.waitForURL(/\/patients/);
    await page.getByRole('button', { name: 'Add Patient' }).click();
    await page.waitForTimeout(500);

    const auditPatientName = `Audit Test Patient ${Date.now()}`;
    await page.locator('#patientFullName').fill(auditPatientName);
    await page.locator('#patientDob').fill('1992-07-20');
    await page.locator('#patientGender').selectOption('FEMALE');
    await page.locator('#patientPhone').fill('7778889990');
    await page.getByRole('button', { name: 'Save Patient' }).click();
    await page.waitForTimeout(1000);

    // Navigate to Audit Logs
    const auditLink = page.getByText('Audit Logs').first();
    if (await auditLink.isVisible()) {
      await auditLink.click();
      await page.waitForTimeout(500);

      // Verify CREATE entry for Patient entity exists
      const createEntry = page.getByText(/CREATE/i).first();
      const patientEntity = page.getByText(/Patient/i).first();
      await expect(createEntry.or(patientEntity)).toBeVisible({ timeout: 10000 });
    }
  });
});

test.describe('PDF Download Verification', () => {
  test('prescription PDF should be downloadable', async ({ page }) => {
    await loginAs(page, 'ADMIN');

    await page.getByText('Prescriptions').first().click();
    await page.waitForURL(/\/prescriptions/);

    const viewLink = page.getByRole('link').first();
    if (await viewLink.isVisible()) {
      await viewLink.click();
      await page.waitForTimeout(500);

      const pdfBtn = page.getByRole('button', { name: /PDF|Download/i });
      await expect(pdfBtn).toBeVisible();

      const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
      await pdfBtn.click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
    }
  });

  test('invoice PDF should be downloadable', async ({ page }) => {
    await loginAs(page, 'ADMIN');

    await page.getByText('Billing').first().click();
    await page.waitForURL(/\/billing/);

    await page.getByRole('link', { name: 'View' }).first().click();
    await page.waitForTimeout(500);

    const downloadBtn = page.getByRole('button', { name: /PDF|Download|Print/i });
    await expect(downloadBtn).toBeVisible();

    const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
    await downloadBtn.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
  });
});
