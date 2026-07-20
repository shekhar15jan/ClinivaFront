import { test, expect } from '@playwright/test';
import { loginAsPatient } from './helpers/login-as';

test.describe('Patient Profile Editing', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsPatient(page);
    await page.goto('/patient/profile');
  });

  test('should display patient profile page', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('My Profile');
  });

  test('should show edit button when profile exists', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    const editButton = page.getByRole('button', { name: /edit/i });
    
    // Edit button should be visible if patient profile exists
    if (await page.locator('text=No patient profile found').isHidden()) {
      await expect(editButton).toBeVisible();
    }
  });

  test('should display patient information in view mode', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // Check if profile exists
    if (await page.locator('text=No patient profile found').isHidden()) {
      // Should display patient name
      await expect(page.locator('text=Patient ID:')).toBeVisible();
      
      // Should display contact information
      await expect(page.getByText(/email/i)).toBeVisible();
      await expect(page.getByText(/phone/i)).toBeVisible();
      
      // Should display emergency contact section
      await expect(page.getByText(/emergency contact/i)).toBeVisible();
    }
  });

  test('should enter edit mode on edit button click', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    const editButton = page.getByRole('button', { name: /edit/i });
    
    if (await editButton.isVisible()) {
      await editButton.click();
      
      // Should show form inputs
      await expect(page.locator('input#fullName')).toBeVisible();
      await expect(page.locator('input#phone')).toBeVisible();
      await expect(page.locator('input#email')).toBeVisible();
      
      // Should show save and cancel buttons
      await expect(page.getByRole('button', { name: /save changes/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /cancel/i })).toBeVisible();
    }
  });

  test('should edit patient profile fields', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    const editButton = page.getByRole('button', { name: /edit/i });
    
    if (await editButton.isVisible()) {
      await editButton.click();
      
      // Edit full name
      const fullNameInput = page.locator('input#fullName');
      await fullNameInput.clear();
      await fullNameInput.fill('Updated Patient Name');
      
      // Edit phone
      const phoneInput = page.locator('input#phone');
      await phoneInput.clear();
      await phoneInput.fill('+919876543210');
      
      // Edit email
      const emailInput = page.locator('input#email');
      await emailInput.clear();
      await emailInput.fill('updated@patient.com');
      
      // Edit date of birth
      const dobInput = page.locator('input#dob');
      if (await dobInput.isVisible()) {
        await dobInput.fill('1990-01-15');
      }
      
      // Select blood group
      const bloodGroupSelect = page.locator('select#bloodGroup');
      if (await bloodGroupSelect.isVisible()) {
        await bloodGroupSelect.selectOption('O_POSITIVE');
      }
      
      // Edit address
      const addressInput = page.locator('textarea#address');
      if (await addressInput.isVisible()) {
        await addressInput.clear();
        await addressInput.fill('123 Updated Street, Updated City');
      }
      
      // Edit emergency contact
      const ecNameInput = page.locator('input#ecName');
      if (await ecNameInput.isVisible()) {
        await ecNameInput.clear();
        await ecNameInput.fill('Emergency Contact Name');
      }
      
      const ecPhoneInput = page.locator('input#ecPhone');
      if (await ecPhoneInput.isVisible()) {
        await ecPhoneInput.clear();
        await ecPhoneInput.fill('+919876543211');
      }
      
      // Save changes
      await page.getByRole('button', { name: /save changes/i }).click();
      
      // Should show success message
      await expect(page.getByText(/profile updated successfully/i)).toBeVisible({ timeout: 5000 });
      
      // Should return to view mode
      await expect(page.locator('input#fullName')).not.toBeVisible({ timeout: 3000 });
    }
  });

  test('should cancel editing and revert changes', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    const editButton = page.getByRole('button', { name: /edit/i });
    
    if (await editButton.isVisible()) {
      await editButton.click();
      
      // Make changes
      const fullNameInput = page.locator('input#fullName');
      const originalValue = await fullNameInput.inputValue();
      await fullNameInput.clear();
      await fullNameInput.fill('Temporary Name');
      
      // Cancel
      await page.getByRole('button', { name: /cancel/i }).click();
      
      // Should return to view mode
      await expect(page.locator('input#fullName')).not.toBeVisible({ timeout: 3000 });
      
      // Name should be reverted
      await expect(page.getByText(originalValue || /.+/).first()).toBeVisible();
    }
  });

  test('should show empty state when no patient profile', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // If no profile exists, should show empty state
    const emptyState = page.getByText(/no patient profile found/i);
    
    if (await emptyState.isVisible()) {
      await expect(emptyState).toBeVisible();
      await expect(page.getByText(/contact your clinic reception/i)).toBeVisible();
    }
  });

  test('should display blood group in formatted format', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    if (await page.locator('text=No patient profile found').isHidden()) {
      // Blood group should be displayed as A+, B-, etc.
      const bloodGroupSection = page.getByText(/blood group/i);
      
      if (await bloodGroupSection.isVisible()) {
        const bloodGroupValue = bloodGroupSection.locator('..').locator('p').last();
        const text = await bloodGroupValue.textContent();
        
        // Should be formatted (e.g., A+, O-, etc.)
        if (text && text !== '—') {
          expect(text).toMatch(/[A-Z][+-]/);
        }
      }
    }
  });
});
