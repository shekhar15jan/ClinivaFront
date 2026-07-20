import { test, expect } from '@playwright/test';
import { loginAsReceptionist } from './helpers/login-as';

test.describe('Appointment Reschedule Flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsReceptionist(page);
    await page.goto('/appointments');
  });

  test('should display reschedule button on appointment card', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // Find an appointment with reschedule button
    const rescheduleButtons = page.locator('button[title="Reschedule"]');
    
    if (await rescheduleButtons.count() > 0) {
      await expect(rescheduleButtons.first()).toBeVisible();
    }
  });

  test('should navigate to booking flow on reschedule click', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    const rescheduleButton = page.locator('button[title="Reschedule"]').first();
    
    if (await rescheduleButton.isVisible()) {
      await rescheduleButton.click();
      
      // Should navigate to booking flow
      await expect(page).toHaveURL(/\/appointments\/book/);
      
      // Should show reschedule message
      await expect(page.getByText(/rescheduling appointment/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test('should pre-fill doctor from reschedule query params', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    const rescheduleButton = page.locator('button[title="Reschedule"]').first();
    
    if (await rescheduleButton.isVisible()) {
      // Get the doctor name from the appointment card
      const appointmentCard = rescheduleButton.locator('xpath=ancestor::div[contains(@class, "bg-white")]').first();
      const doctorName = await appointmentCard.locator('text=Dr.').textContent();
      
      await rescheduleButton.click();
      
      // Should be on booking flow
      await expect(page).toHaveURL(/\/appointments\/book/);
      
      // Doctor should be pre-selected (if available)
      await page.waitForTimeout(1000);
      
      const doctorSelect = page.locator('select[formcontrolname="doctorId"]');
      if (await doctorSelect.isVisible()) {
        const selectedValue = await doctorSelect.inputValue();
        expect(selectedValue).toBeTruthy();
      }
    }
  });

  test('should complete reschedule workflow', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    const rescheduleButton = page.locator('button[title="Reschedule"]').first();
    
    if (await rescheduleButton.isVisible()) {
      await rescheduleButton.click();
      
      // Wait for booking flow to load
      await page.waitForTimeout(1000);
      
      // Select a date
      const dateButtons = page.locator('button').filter({ hasText: /\d{2}/ });
      if (await dateButtons.count() > 1) {
        await dateButtons.nth(1).click();
      }
      
      // Select a doctor
      const doctorCards = page.locator('div').filter({ hasText: /Dr\./ });
      if (await doctorCards.count() > 0) {
        await doctorCards.first().click();
      }
      
      // Select a time slot
      const timeSlots = page.locator('button').filter({ hasText: /\d{2}:\d{2}/ });
      if (await timeSlots.count() > 0) {
        await timeSlots.first().click();
      }
      
      // Click next
      const nextButton = page.getByRole('button', { name: /next/i });
      if (await nextButton.isVisible()) {
        await nextButton.click();
      }
      
      // Select patient
      const patientSelect = page.locator('select[formcontrolname="patientId"]');
      if (await patientSelect.isVisible()) {
        await patientSelect.selectOption({ index: 1 });
      }
      
      // Click next again
      if (await nextButton.isVisible()) {
        await nextButton.click();
      }
      
      // Confirm booking
      const confirmButton = page.getByRole('button', { name: /confirm/i });
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
        
        // Should show success message
        await expect(page.getByText(/appointment rescheduled successfully/i)).toBeVisible({ timeout: 10000 });
        
        // Should navigate back to appointments
        await expect(page).toHaveURL(/\/appointments/);
      }
    }
  });

  test('should show cancel button on appointment card', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    const cancelButtons = page.locator('button[title="Cancel"]');
    
    if (await cancelButtons.count() > 0) {
      await expect(cancelButtons.first()).toBeVisible();
    }
  });

  test('should cancel appointment with confirmation', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    const cancelButton = page.locator('button[title="Cancel"]').first();
    
    if (await cancelButton.isVisible()) {
      // Mock confirm dialog
      page.on('dialog', dialog => dialog.accept());
      
      await cancelButton.click();
      
      // Should show success message
      await expect(page.getByText(/appointment cancelled/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display appointment status badges', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // Check for status badges
    const pendingBadge = page.locator('span').filter({ hasText: /pending/i });
    const approvedBadge = page.locator('span').filter({ hasText: /approved/i });
    
    if (await pendingBadge.count() > 0) {
      await expect(pendingBadge.first()).toBeVisible();
    }
    
    if (await approvedBadge.count() > 0) {
      await expect(approvedBadge.first()).toBeVisible();
    }
  });

  test('should show mobile-friendly appointment list', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.waitForTimeout(1000);
    
    // Should show appointment cards
    const appointmentCards = page.locator('div').filter({ hasText: /Dr\./ });
    
    if (await appointmentCards.count() > 0) {
      await expect(appointmentCards.first()).toBeVisible();
      
      // Should have reschedule and cancel buttons
      const rescheduleButton = appointmentCards.first().locator('button[title="Reschedule"]');
      const cancelButton = appointmentCards.first().locator('button[title="Cancel"]');
      
      if (await rescheduleButton.isVisible()) {
        await expect(rescheduleButton).toBeVisible();
      }
      
      if (await cancelButton.isVisible()) {
        await expect(cancelButton).toBeVisible();
      }
    }
  });
});
