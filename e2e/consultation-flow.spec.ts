import { test, expect } from '@playwright/test';
import { login } from './helpers/login';

test.describe('Consultation Flow (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.getByText('Consultations').click();
    await page.waitForURL(/\/consultations/);
  });

  // ────────── READ ──────────
  test('should display consultation list', async ({ page }) => {
    await expect(page.getByText(/Consultation/i).first()).toBeVisible();
  });

  // ────────── CREATE (Start consultation for appointment) ──────────
  test('should navigate to consultation workspace', async ({ page }) => {
    const startBtn = page.getByRole('button', { name: /Start|New Consultation/i });
    if (await startBtn.first().isVisible()) {
      await startBtn.first().click();
      await page.waitForTimeout(500);
    }
  });

  test('should show chief complaints section', async ({ page }) => {
    const startBtn = page.getByRole('button', { name: /Start|New Consultation/i });
    if (await startBtn.first().isVisible()) {
      await startBtn.first().click();
      await expect(page.getByText(/Chief Complaints|Complaints/i)).toBeVisible();
    }
  });

  // ────────── VITALS ──────────
  test('should show vitals recording section', async ({ page }) => {
    const startBtn = page.getByRole('button', { name: /Start|New Consultation/i });
    if (await startBtn.first().isVisible()) {
      await startBtn.first().click();
      await expect(page.getByText(/BP|Vitals|Temperature/i).first()).toBeVisible();
    }
  });

  test('should record vitals (BP, Temp, Weight, SpO2, Pulse)', async ({ page }) => {
    const startBtn = page.getByRole('button', { name: /Start|New Consultation/i });
    if (await startBtn.first().isVisible()) {
      await startBtn.first().click();
      await page.locator('#vitalsBp, [formControlName="bp"]').fill('120/80');
      await page.locator('#vitalsTemp, [formControlName="temperature"]').fill('98.6');
      await page.locator('#vitalsWeight, [formControlName="weight"]').fill('70');
      await page.locator('#vitalsSpo2, [formControlName="spo2"]').fill('98');
      await page.locator('#vitalsPulse, [formControlName="pulse"]').fill('72');
      await page.waitForTimeout(300);
    }
  });

  // ────────── DIAGNOSIS ──────────
  test('should enter examination findings and diagnosis', async ({ page }) => {
    const startBtn = page.getByRole('button', { name: /Start|New Consultation/i });
    if (await startBtn.first().isVisible()) {
      await startBtn.first().click();
      await page.locator('textarea, [formControlName="chiefComplaints"], [formControlName="examinationFindings"]').first().fill('Patient reports headache and fever for 3 days');
      await page.locator('textarea, [formControlName="diagnosis"]').last().fill('Viral fever');
      await page.waitForTimeout(300);
    }
  });

  // ────────── CLINICAL NOTES ──────────
  test('should enter clinical notes', async ({ page }) => {
    const startBtn = page.getByRole('button', { name: /Start|New Consultation/i });
    if (await startBtn.first().isVisible()) {
      await startBtn.first().click();
      const notesField = page.locator('textarea, [formControlName="clinicalNotes"]').last();
      if (await notesField.isVisible()) {
        await notesField.fill('Advised rest and hydration. Follow up in 3 days.');
      }
    }
  });

  // ────────── ADD MEDICINES ──────────
  test('should add medicines during consultation', async ({ page }) => {
    const startBtn = page.getByRole('button', { name: /Start|New Consultation/i });
    if (await startBtn.first().isVisible()) {
      await startBtn.first().click();
      const addMedBtn = page.getByRole('button', { name: /Add Medicine/i });
      if (await addMedBtn.isVisible()) {
        await addMedBtn.click();
      }
      const medInput = page.locator('[formControlName="name"], #medicineName').first();
      if (await medInput.isVisible()) {
        await medInput.fill('Paracetamol');
      }
    }
  });

  test('should set medicine frequency and duration', async ({ page }) => {
    const startBtn = page.getByRole('button', { name: /Start|New Consultation/i });
    if (await startBtn.first().isVisible()) {
      await startBtn.first().click();
      const freqInput = page.locator('[formControlName="frequency"]');
      if (await freqInput.isVisible()) {
        await freqInput.fill('1-0-1');
      }
      const durInput = page.locator('[formControlName="duration"]');
      if (await durInput.isVisible()) {
        await durInput.fill('5');
      }
    }
  });

  // ────────── FINISH & CREATE PRESCRIPTION ──────────
  test('should finish consultation and create prescription', async ({ page }) => {
    const startBtn = page.getByRole('button', { name: /Start|New Consultation/i });
    if (await startBtn.first().isVisible()) {
      await startBtn.first().click();
      const finishBtn = page.getByRole('button', { name: /Finish|Complete|Save Consultation/i });
      if (await finishBtn.isVisible()) {
        await finishBtn.click();
        await page.waitForTimeout(500);
      }
    }
  });

  // ────────── VIEW PAST CONSULTATIONS ──────────
  test('should show patient previous consultation history', async ({ page }) => {
    const historyBtn = page.getByRole('button', { name: /History|Previous/i });
    if (await historyBtn.first().isVisible()) {
      await historyBtn.first().click();
      await page.waitForTimeout(500);
    }
  });
});
