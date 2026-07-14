import { test, expect } from '@playwright/test';
import { login } from './helpers/login';

test.describe('Appointment Flow (E2E)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.getByText('Appointments').first().click();
    await expect(page).toHaveURL(/\/appointments/);
  });

  test('should display the appointment calendar page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Appointments' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'New Appointment' })).toBeVisible();
  });

  test('should show calendar view toggle buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Day' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Week' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Month' })).toBeVisible();
  });

  test('should display doctor columns in the calendar grid', async ({ page }) => {
    await expect(page.getByText('Dr. Anita Desai')).toBeVisible();
    await expect(page.getByText('Dr. Vivek Kumar')).toBeVisible();
  });

  test('should show time blocks on the calendar', async ({ page }) => {
    await expect(page.getByText('09:00 AM')).toBeVisible();
    await expect(page.getByText('10:00 AM')).toBeVisible();
    await expect(page.getByText('11:00 AM')).toBeVisible();
  });

  test('should display existing appointments on the calendar', async ({ page }) => {
    await expect(page.getByText('Rahul Sharma')).toBeVisible();
    await expect(page.getByText('Priya Patel')).toBeVisible();
    await expect(page.getByText('Amit Singh')).toBeVisible();
  });

  test('should navigate to booking flow when clicking New Appointment', async ({ page }) => {
    await page.getByRole('button', { name: 'New Appointment' }).click();
    await expect(page).toHaveURL(/\/appointments\/book/);
    await expect(page.getByRole('heading', { name: 'Book Appointment' })).toBeVisible();
  });

  test('should display booking wizard with 3 steps', async ({ page }) => {
    await page.getByRole('button', { name: 'New Appointment' }).click();
    await expect(page.getByText('Step 1')).toBeVisible();
    await expect(page.getByText('Step 2')).toBeVisible();
    await expect(page.getByText('Step 3')).toBeVisible();
    await expect(page.getByText('Doctor & Time')).toBeVisible();
    await expect(page.getByText('Patient Details')).toBeVisible();
    await expect(page.getByText('Confirm')).toBeVisible();
  });

  test('should select a doctor and time slot in step 1', async ({ page }) => {
    await page.getByRole('button', { name: 'New Appointment' }).click();
    await page.getByText('Dr. Anita Desai').click();
    await page.getByText('09:00').click();
    await expect(page.getByRole('button', { name: 'Next Step' })).toBeEnabled();
    await page.getByRole('button', { name: 'Next Step' }).click();
    await expect(page.getByText('Step 2')).toBeVisible();
  });

  test('should select existing patient in step 2 and confirm in step 3', async ({ page }) => {
    await page.getByRole('button', { name: 'New Appointment' }).click();
    await page.getByText('Dr. Anita Desai').click();
    await page.getByText('09:00').click();
    await page.getByRole('button', { name: 'Next Step' }).click();
    await page.locator('#patientId').selectOption('1');
    await page.getByRole('button', { name: 'Next Step' }).click();
    await expect(page.getByText('Confirm Appointment')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Confirm Booking' })).toBeVisible();
  });

  test('should successfully create an appointment via the booking flow', async ({ page }) => {
    await page.getByRole('button', { name: 'New Appointment' }).click();
    await page.getByText('Dr. Anita Desai').click();
    await page.getByText('09:00').click();
    await page.getByRole('button', { name: 'Next Step' }).click();
    await page.locator('#patientId').selectOption('1');
    await page.getByRole('button', { name: 'Next Step' }).click();
    await page.getByRole('button', { name: 'Confirm Booking' }).click();
    await expect(page).toHaveURL(/\/appointments/);
  });

  test('should allow navigating back to appointments list from booking flow', async ({ page }) => {
    await page.getByRole('button', { name: 'New Appointment' }).click();
    await page.locator('[routerlink="/appointments"]').first().click();
    await expect(page).toHaveURL(/\/appointments/);
  });
});
