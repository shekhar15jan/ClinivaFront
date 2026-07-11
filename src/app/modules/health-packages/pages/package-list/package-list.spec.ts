import { TestBed } from '@angular/core/testing';
import { PackageList } from './package-list';
import { HealthPackageService } from '../../../../core/services/health-package.service';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { ApiResponse, PagedResponse } from '../../../../core/models/common.model';
import { HealthPackageResponse } from '../../../../core/models/health-package.model';

describe('PackageList', () => {
  const mockPackage: HealthPackageResponse = {
    id: 'hp1', packageName: 'Basic Checkup', description: 'Basic checkup',
    actualPriceInPaisa: 200000, offerPriceInPaisa: 150000, testsIncluded: 'Blood, Urine',
    isActive: true, createdAt: '2026-01-01T00:00:00Z',
  };

  const pagedData: PagedResponse<HealthPackageResponse> = {
    content: [mockPackage], pageNumber: 0, pageSize: 20, totalElements: 1, totalPages: 1, last: true,
  };

  const mockListResponse: ApiResponse<PagedResponse<HealthPackageResponse>> = {
    success: true, data: pagedData, message: '', timestamp: '', requestId: '',
  };

  const mockToggleResponse: ApiResponse<HealthPackageResponse> = {
    success: true, data: { ...mockPackage, isActive: false }, message: '', timestamp: '', requestId: '',
  };

  function createComponent(overrides?: Partial<HealthPackageService>) {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: HealthPackageService,
          useValue: {
            list: vi.fn().mockReturnValue(of(mockListResponse)),
            toggleActive: vi.fn().mockReturnValue(of(mockToggleResponse)),
            ...overrides,
          },
        },
      ],
    });
    return TestBed.runInInjectionContext(() => new PackageList());
  }

  it('should create with initial state', () => {
    const component = createComponent();
    expect(component).toBeTruthy();
    expect(component.packages).toEqual([]);
    expect(component.isLoading).toBe(false);
    expect(component.error).toBe('');
  });

  it('should load packages on init', () => {
    const component = createComponent();
    component.ngOnInit();
    expect(component.packages.length).toBe(1);
    expect(component.packages[0].packageName).toBe('Basic Checkup');
    expect(component.isLoading).toBe(false);
  });

  it('should handle load error', () => {
    const component = createComponent({
      list: vi.fn().mockReturnValue(throwError(() => ({ message: 'Server error' }))),
    });
    component.ngOnInit();
    expect(component.isLoading).toBe(false);
    expect(component.error).toBe('Server error');
  });

  it('should handle null data in response', () => {
    const component = createComponent({
      list: vi.fn().mockReturnValue(of({ success: true, data: null, message: '', timestamp: '', requestId: '' })),
    });
    component.ngOnInit();
    expect(component.packages).toEqual([]);
  });

  it('should toggle package active state', () => {
    const listSpy = vi.fn().mockReturnValue(of(mockListResponse));
    const component = createComponent({ list: listSpy });

    component.toggleActive(mockPackage);

    expect(listSpy).toHaveBeenCalled();
  });

  it('should handle toggle error gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(vi.fn());
    const component = createComponent({
      toggleActive:       vi.fn().mockReturnValue(throwError(() => new Error('fail'))),
    });

    component.toggleActive(mockPackage);

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should format paisa to rupees correctly', () => {
    const component = createComponent();
    expect(component.getPrice(150000)).toBe('₹1500.00');
    expect(component.getPrice(0)).toBe('₹0.00');
  });
});
