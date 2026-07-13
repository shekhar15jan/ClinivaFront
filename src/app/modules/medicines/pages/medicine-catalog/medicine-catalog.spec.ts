import { TestBed } from '@angular/core/testing';
import { MedicineCatalog } from './medicine-catalog';
import { MedicineService } from '../../../../core/services/medicine.service';
import { FormBuilder } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { ApiResponse, PagedResponse } from '../../../../core/models/common.model';
import { Medicine } from '../../../../core/models/medicine.model';

describe('MedicineCatalog', () => {
  const mockMedicine: Medicine = { id: 'm1', medicineName: 'Paracetamol', genericName: 'Acetaminophen', manufacturer: 'Cipla', category: 'Analgesic', unit: 'tablet', priceInPaisa: 1000, quantity: 100, isDiscontinued: false, createdAt: '2026-01-01' };

  const mockPaged: ApiResponse<PagedResponse<Medicine>> = { success: true, data: { content: [mockMedicine, { ...mockMedicine, id: 'm2', medicineName: 'Amoxicillin', category: 'Antibiotic' }], pageNumber: 0, pageSize: 20, totalElements: 2, totalPages: 1, last: true }, message: 'ok', timestamp: '', requestId: 'r1' };

  const mockSearchResponse: ApiResponse<Medicine[]> = { success: true, data: [mockMedicine], message: 'ok', timestamp: '', requestId: 'r1' };

  function createComponent(overrides?: Partial<MedicineService>) {
    TestBed.configureTestingModule({
      providers: [
        FormBuilder,
        { provide: MedicineService, useValue: { getMedicines: vi.fn().mockReturnValue(of(mockPaged)), searchMedicines: vi.fn().mockReturnValue(of(mockSearchResponse)), createMedicine: vi.fn().mockReturnValue(of({ success: true, data: mockMedicine, message: 'created', timestamp: '', requestId: 'r1' })), ...overrides } },
      ],
    });
    return TestBed.runInInjectionContext(() => new MedicineCatalog());
  }

  it('should create with initial state', () => {
    const component = createComponent();
    expect(component).toBeTruthy();
    expect(component.medicines).toEqual([]);
    expect(component.filteredMedicines).toEqual([]);
    expect(component.isLoading).toBe(false);
    expect(component.searchQuery).toBe('');
    expect(component.selectedCategory).toBe('');
    expect(component.showAddModal).toBe(false);
    expect(component.isSubmitting).toBe(false);
  });

  it('should load medicines on init', () => {
    const component = createComponent();
    component.ngOnInit();
    expect(component.medicines.length).toBe(2);
    expect(component.filteredMedicines.length).toBe(2);
    expect(component.isLoading).toBe(false);
  });

  it('should handle load error', () => {
    const component = createComponent({ getMedicines: vi.fn().mockReturnValue(throwError(() => new Error('fail'))) });
    component.ngOnInit();
    expect(component.isLoading).toBe(false);
    expect(component.medicines).toEqual([]);
  });

  it('should search medicines when query > 1 char', () => {
    const component = createComponent();
    component.searchQuery = 'Para';
    component.onSearch();
    expect(component.medicines).toEqual([mockMedicine]);
    expect(component.filteredMedicines).toEqual([mockMedicine]);
  });

  it('should reload medicines when search query cleared', () => {
    const component = createComponent();
    component.searchQuery = '';
    component.onSearch();
  });

  it('should filter by category', () => {
    const component = createComponent();
    component.ngOnInit();
    component.selectedCategory = 'Antibiotic';
    component.onFilterChange();
    expect(component.filteredMedicines.length).toBe(1);
    expect(component.filteredMedicines[0].medicineName).toBe('Amoxicillin');
  });

  it('should toggle add modal and reset form', () => {
    const component = createComponent();
    expect(component.showAddModal).toBe(false);
    component.toggleAddModal();
    expect(component.showAddModal).toBe(true);
    component.toggleAddModal();
    expect(component.showAddModal).toBe(false);
  });

  it('should not submit invalid add form', () => {
    const component = createComponent();
    component.onSubmitAdd();
    expect(component.isSubmitting).toBe(false);
  });

  it('should submit and create medicine', () => {
    const component = createComponent();
    component.showAddModal = true;
    component.addForm.patchValue({ medicineName: 'Test Med', genericName: 'Test Gen', category: 'Analgesic', manufacturer: 'Test', unit: 'tablet', price: 10 });
    component.onSubmitAdd();
    expect(component.isSubmitting).toBe(false);
    expect(component.showAddModal).toBe(false);
  });

  it('should handle create medicine error', () => {
    const component = createComponent({ createMedicine: vi.fn().mockReturnValue(throwError(() => new Error('fail'))) });
    component.addForm.patchValue({ medicineName: 'Test Med', genericName: 'Test Gen', category: 'Analgesic', manufacturer: 'Test', unit: 'tablet', price: 10 });
    component.onSubmitAdd();
    expect(component.isSubmitting).toBe(false);
  });
});
