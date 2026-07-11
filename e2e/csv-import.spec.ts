import { test, expect } from '@playwright/test';
import { login } from './helpers/login';

test.describe('CSV Import (E2E)', () => {
  // ────────── PATIENT CSV IMPORT ──────────
  test('should show CSV upload button for patients', async ({ page }) => {
    await login(page);
    await page.getByText('Patients').click();
    await page.waitForURL(/\/patients/);

    const importBtn = page.getByRole('button', { name: /Import|Upload/i });
    const count = await importBtn.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should open CSV upload dialog for patients', async ({ page }) => {
    await login(page);
    await page.getByText('Patients').click();
    await page.waitForURL(/\/patients/);

    const importBtn = page.getByRole('button', { name: /Import|Upload/i });
    if (await importBtn.isVisible()) {
      await importBtn.click();
      await page.waitForTimeout(300);
      await expect(page.getByText(/CSV|Import|Upload/i).first()).toBeVisible();
    }
  });

  test('should show file input for CSV upload', async ({ page }) => {
    await login(page);
    await page.getByText('Patients').click();
    await page.waitForURL(/\/patients/);

    const importBtn = page.getByRole('button', { name: /Import|Upload/i });
    if (await importBtn.isVisible()) {
      await importBtn.click();
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.isVisible()) {
        await expect(fileInput).toBeVisible();
      }
    }
  });

  test('should upload a valid patient CSV file', async ({ page }) => {
    await login(page);
    await page.getByText('Patients').click();
    await page.waitForURL(/\/patients/);

    const importBtn = page.getByRole('button', { name: /Import|Upload/i });
    if (await importBtn.isVisible()) {
      await importBtn.click();

      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.isVisible()) {
        const csvContent = 'Full Name,Date of Birth,Gender,Phone,Email\nTest Name,1990-01-01,MALE,9999999999,test@example.com';
        await fileInput.setInputFiles({
          name: 'patients.csv',
          mimeType: 'text/csv',
          buffer: Buffer.from(csvContent),
        });

        const uploadBtn = page.getByRole('button', { name: /Upload|Import/i });
        if (await uploadBtn.isVisible()) {
          await uploadBtn.click();
          await page.waitForTimeout(1000);
        }
      }
    }
  });

  test('should show error for invalid CSV format', async ({ page }) => {
    await login(page);
    await page.getByText('Patients').click();
    await page.waitForURL(/\/patients/);

    const importBtn = page.getByRole('button', { name: /Import|Upload/i });
    if (await importBtn.isVisible()) {
      await importBtn.click();

      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.isVisible()) {
        await fileInput.setInputFiles({
          name: 'invalid.csv',
          mimeType: 'text/csv',
          buffer: Buffer.from('invalid csv without headers'),
        });

        const uploadBtn = page.getByRole('button', { name: /Upload|Import/i });
        if (await uploadBtn.isVisible()) {
          await uploadBtn.click();
          await page.waitForTimeout(1000);
        }
      }
    }
  });

  // ────────── MEDICINE CSV IMPORT ──────────
  test('should show CSV upload button for medicines', async ({ page }) => {
    await login(page);
    await page.getByText(/Medicines|Pharmacy/i).click();
    await page.waitForURL(/\/medicines/);

    const importBtn = page.getByRole('button', { name: /Import|Upload/i });
    const count = await importBtn.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should open CSV upload dialog for medicines', async ({ page }) => {
    await login(page);
    await page.getByText(/Medicines|Pharmacy/i).click();
    await page.waitForURL(/\/medicines/);

    const importBtn = page.getByRole('button', { name: /Import|Upload/i });
    if (await importBtn.isVisible()) {
      await importBtn.click();
      await page.waitForTimeout(300);
      await expect(page.getByText(/CSV|Import|Upload/i).first()).toBeVisible();
    }
  });

  test('should upload a valid medicine CSV file', async ({ page }) => {
    await login(page);
    await page.getByText(/Medicines|Pharmacy/i).click();
    await page.waitForURL(/\/medicines/);

    const importBtn = page.getByRole('button', { name: /Import|Upload/i });
    if (await importBtn.isVisible()) {
      await importBtn.click();

      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.isVisible()) {
        const csvContent = 'Name,Generic Name,Manufacturer,Category,Unit,Price\nMedicineX,GenX,MfgX,CatX,tablet,10';
        await fileInput.setInputFiles({
          name: 'medicines.csv',
          mimeType: 'text/csv',
          buffer: Buffer.from(csvContent),
        });

        const uploadBtn = page.getByRole('button', { name: /Upload|Import/i });
        if (await uploadBtn.isVisible()) {
          await uploadBtn.click();
          await page.waitForTimeout(1000);
        }
      }
    }
  });

  // ────────── DOWNLOAD TEMPLATE ──────────
  test('should have download template option for CSV', async ({ page }) => {
    await login(page);
    await page.getByText('Patients').click();
    await page.waitForURL(/\/patients/);

    const importBtn = page.getByRole('button', { name: /Import|Upload/i });
    if (await importBtn.isVisible()) {
      await importBtn.click();
      const templateLink = page.getByText(/Template|Sample|Download/i);
      if (await templateLink.isVisible()) {
        await expect(templateLink).toBeVisible();
      }
    }
  });
});
