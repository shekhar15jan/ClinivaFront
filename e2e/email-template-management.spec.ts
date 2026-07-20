import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/login-as';

test.describe('Email Template Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/settings/email-templates');
  });

  test('should display email templates page', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Email Templates');
    await expect(page.getByRole('button', { name: /new template/i })).toBeVisible();
  });

  test('should show empty state when no templates', async ({ page }) => {
    await expect(page.getByText(/no email templates configured/i)).toBeVisible();
  });

  test('should open create template dialog', async ({ page }) => {
    await page.getByRole('button', { name: /new template/i }).click();
    
    const dialog = page.locator('div').filter({ hasText: /create email template/i });
    await expect(dialog).toBeVisible();
    
    await expect(page.locator('select').first()).toBeVisible();
    await expect(page.getByLabel(/subject/i)).toBeVisible();
    await expect(page.getByLabel(/body/i)).toBeVisible();
  });

  test('should create new email template', async ({ page }) => {
    await page.getByRole('button', { name: /new template/i }).click();
    
    // Select template type
    await page.locator('select').first().selectOption('APPOINTMENT_CONFIRMATION');
    
    // Fill in subject
    await page.getByLabel(/subject/i).fill('Appointment Confirmed - Test');
    
    // Fill in from email
    await page.getByLabel(/from email/i).fill('test@cliniva.com');
    
    // Fill in body
    await page.getByLabel(/body/i).fill('Your appointment is confirmed. Details: %s');
    
    // Save
    await page.getByRole('button', { name: /save template/i }).click();
    
    // Verify success message
    await expect(page.getByText(/template created/i)).toBeVisible({ timeout: 5000 });
  });

  test('should edit existing template', async ({ page }) => {
    // Assuming a template exists
    const editButton = page.locator('button').filter({ has: page.locator('text=edit') }).first();
    
    if (await editButton.isVisible()) {
      await editButton.click();
      
      const dialog = page.locator('div').filter({ hasText: /edit email template/i });
      await expect(dialog).toBeVisible();
      
      // Modify subject
      const subjectInput = page.getByLabel(/subject/i);
      await subjectInput.clear();
      await subjectInput.fill('Updated Subject');
      
      // Save
      await page.getByRole('button', { name: /save template/i }).click();
      
      // Verify success
      await expect(page.getByText(/template updated/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test('should delete email template', async ({ page }) => {
    const deleteButton = page.locator('button').filter({ has: page.locator('text=delete') }).first();
    
    if (await deleteButton.isVisible()) {
      // Mock confirm dialog
      page.on('dialog', dialog => dialog.accept());
      
      await deleteButton.click();
      
      // Verify success
      await expect(page.getByText(/template deleted/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test('should validate required fields', async ({ page }) => {
    await page.getByRole('button', { name: /new template/i }).click();
    
    // Try to save without filling required fields
    const saveButton = page.getByRole('button', { name: /save template/i });
    await expect(saveButton).toBeDisabled();
    
    // Fill required fields
    await page.locator('select').first().selectOption('OTP');
    await page.getByLabel(/subject/i).fill('Test Subject');
    await page.getByLabel(/body/i).fill('Test body');
    
    // Save button should now be enabled
    await expect(saveButton).toBeEnabled();
  });
});
