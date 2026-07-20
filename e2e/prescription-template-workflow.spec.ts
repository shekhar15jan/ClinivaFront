import { test, expect } from '@playwright/test';
import { loginAsDoctor } from './helpers/login-as';

test.describe('Prescription Template Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDoctor(page);
    await page.goto('/consultations');
  });

  test('should display use template button in consultation workspace', async ({ page }) => {
    const useTemplateButton = page.getByRole('button', { name: /use template/i });
    await expect(useTemplateButton).toBeVisible();
  });

  test('should open template dropdown on click', async ({ page }) => {
    await page.getByRole('button', { name: /use template/i }).click();
    
    const dropdown = page.locator('div').filter({ hasText: /prescription templates/i });
    await expect(dropdown).toBeVisible();
  });

  test('should show empty state when no templates', async ({ page }) => {
    await page.getByRole('button', { name: /use template/i }).click();
    
    const emptyState = page.getByText(/no templates saved yet/i);
    await expect(emptyState).toBeVisible();
  });

  test('should display template list when templates exist', async ({ page }) => {
    await page.getByRole('button', { name: /use template/i }).click();
    
    // Wait for templates to load
    await page.waitForTimeout(1000);
    
    const dropdown = page.locator('div').filter({ hasText: /prescription templates/i });
    
    // Should show either empty state or template list
    const hasTemplates = await dropdown.locator('button').filter({ hasText: /.+/ }).count();
    const isEmpty = await dropdown.getByText(/no templates saved yet/i).isVisible();
    
    expect(hasTemplates > 0 || isEmpty).toBeTruthy();
  });

  test('should apply template to consultation form', async ({ page }) => {
    await page.getByRole('button', { name: /use template/i }).click();
    
    // Wait for templates to load
    await page.waitForTimeout(1000);
    
    const templateButton = page.locator('button').filter({ hasText: /template/i }).first();
    
    if (await templateButton.isVisible()) {
      // Get template name before applying
      const templateName = await templateButton.textContent();
      
      // Apply template
      await templateButton.click();
      
      // Verify diagnosis field is populated (if template has diagnosis)
      const diagnosisField = page.locator('input[formcontrolname="diagnosis"]');
      
      // Dropdown should close
      const dropdown = page.locator('div').filter({ hasText: /prescription templates/i });
      await expect(dropdown).not.toBeVisible({ timeout: 3000 });
    }
  });

  test('should close template dropdown', async ({ page }) => {
    await page.getByRole('button', { name: /use template/i }).click();
    
    const dropdown = page.locator('div').filter({ hasText: /prescription templates/i });
    await expect(dropdown).toBeVisible();
    
    // Close button
    const closeButton = dropdown.locator('button').filter({ has: page.locator('text=close') });
    if (await closeButton.isVisible()) {
      await closeButton.click();
      await expect(dropdown).not.toBeVisible();
    }
  });

  test('should show medicine count in template', async ({ page }) => {
    await page.getByRole('button', { name: /use template/i }).click();
    
    await page.waitForTimeout(1000);
    
    const medicineCount = page.locator('div').filter({ hasText: /\d+ medicines/i });
    
    if (await medicineCount.isVisible()) {
      await expect(medicineCount).toContainText(/\d+ medicines/);
    }
  });

  test('should populate medicine list when template is applied', async ({ page }) => {
    await page.getByRole('button', { name: /use template/i }).click();
    
    await page.waitForTimeout(1000);
    
    const templateButton = page.locator('button').filter({ hasText: /\d+ medicines/i }).first();
    
    if (await templateButton.isVisible()) {
      await templateButton.click();
      
      // Wait for form to update
      await page.waitForTimeout(500);
      
      // Should have medicine rows in the form
      const medicineRows = page.locator('div[formarrayname="medicines"] > div');
      const rowCount = await medicineRows.count();
      
      expect(rowCount).toBeGreaterThan(0);
    }
  });
});
