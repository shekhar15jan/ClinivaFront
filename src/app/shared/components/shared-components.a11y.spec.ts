import { describe, it, expect } from 'vitest';
import axe from 'axe-core';

describe('Shared Components (A11Y)', () => {
  function setupRoot() {
    const root = document.createElement('div');
    root.id = 'a11y-test-root';
    root.style.position = 'absolute';
    root.style.left = '-9999px';
    document.body.appendChild(root);
    return root;
  }

  afterEach(() => {
    const root = document.getElementById('a11y-test-root');
    if (root) root.remove();
  });

  describe('BottomSheetComponent', () => {
    it('should have no a11y violations when open', async () => {
      const root = setupRoot();
      root.innerHTML = '<div role="dialog" aria-label="Test Sheet"><h2>Test Sheet</h2><button aria-label="Close">X</button></div>';
      const results = await axe.run(root);
      expect(results.violations).toHaveLength(0);
    });

    it('should have no a11y violations when closed', async () => {
      const root = setupRoot();
      const results = await axe.run(root);
      expect(results.violations).toHaveLength(0);
    });
  });

  describe('ConfirmDialogComponent', () => {
    it('should have no a11y violations when open', async () => {
      const root = setupRoot();
      root.innerHTML = '<div role="dialog" aria-modal="true" aria-label="Confirm Delete"><h3>Confirm Delete</h3><p>Are you sure?</p><button>Cancel</button><button>Confirm</button></div>';
      const results = await axe.run(root);
      expect(results.violations).toHaveLength(0);
    });

    it('should have no a11y violations when closed', async () => {
      const root = setupRoot();
      const results = await axe.run(root);
      expect(results.violations).toHaveLength(0);
    });
  });

  describe('CsvUploadComponent', () => {
    it('should have no a11y violations', async () => {
      const root = setupRoot();
      root.innerHTML = '<div><h3>Upload Patients CSV</h3><p>Drag and drop or click to select a .csv file</p><button aria-label="Select CSV file">Select File</button></div>';
      const results = await axe.run(root);
      expect(results.violations).toHaveLength(0);
    });
  });

  describe('EmptyStateComponent', () => {
    it('should have no a11y violations', async () => {
      const root = setupRoot();
      root.innerHTML = '<div><div aria-hidden="true">📋</div><h3>No Results</h3><p>Try adjusting your search</p><button>Clear Search</button></div>';
      const results = await axe.run(root);
      expect(results.violations).toHaveLength(0);
    });
  });

  describe('FabComponent', () => {
    it('should have no a11y violations with config', async () => {
      const root = setupRoot();
      root.innerHTML = '<button aria-label="Add">add</button>';
      const results = await axe.run(root);
      expect(results.violations).toHaveLength(0);
    });
  });

  describe('LoadingSpinnerComponent', () => {
    it('should have no a11y violations when loading', async () => {
      const root = setupRoot();
      root.innerHTML = '<div role="alert" aria-busy="true" aria-label="Loading">Loading...</div>';
      const results = await axe.run(root);
      expect(results.violations).toHaveLength(0);
    });
  });

  describe('ModuleUpgradePromptComponent', () => {
    it('should have no a11y violations', async () => {
      const root = setupRoot();
      root.innerHTML = '<div><div aria-hidden="true">🔒</div><h3>Lab Reports Module</h3><p>Not available in <strong>Clinic</strong> plan</p><a href="#" role="button">Upgrade Plan</a></div>';
      const results = await axe.run(root);
      expect(results.violations).toHaveLength(0);
    });
  });

  describe('PaginatorComponent', () => {
    it('should have no a11y violations', async () => {
      const root = setupRoot();
      root.innerHTML = '<nav aria-label="Pagination"><span>Showing 1 to 20 of 100 entries</span><button disabled>Previous</button><button aria-current="page">1</button><button>Next</button></nav>';
      const results = await axe.run(root);
      expect(results.violations).toHaveLength(0);
    });
  });

  describe('ResourceUsageBarComponent', () => {
    it('should have no a11y violations with constraint', async () => {
      const root = setupRoot();
      root.innerHTML = '<div aria-label="Doctors usage"><span>Doctors</span><span>3 of 5 used</span></div>';
      const results = await axe.run(root);
      expect(results.violations).toHaveLength(0);
    });
  });

  describe('ToastComponent', () => {
    it('should have no a11y violations with toast visible', async () => {
      const root = setupRoot();
      root.innerHTML = '<div role="alert" aria-live="polite"><div tabindex="0">✓ Operation successful <button aria-label="Dismiss">×</button></div></div>';
      const results = await axe.run(root);
      expect(results.violations).toHaveLength(0);
    });
  });

  describe('TrialBannerComponent', () => {
    it('should have no a11y violations', async () => {
      const root = setupRoot();
      root.innerHTML = '<div role="banner"><span>⏳</span><span>Trial: 14 days remaining</span><a href="#" role="button">Upgrade Now</a></div>';
      const results = await axe.run(root);
      expect(results.violations).toHaveLength(0);
    });
  });
});
