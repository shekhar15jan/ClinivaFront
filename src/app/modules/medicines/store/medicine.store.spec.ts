import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { MedicineStore } from './medicine.store';
import { MedicineService } from '../../../core/services/medicine.service';
import { Medicine } from '../../../core/models/medicine.model';
import { ApiResponse, PagedResponse } from '../../../core/models/common.model';

describe('MedicineStore', () => {
  let store: InstanceType<typeof MedicineStore>;
  let mockMedicineService: Partial<MedicineService>;

  const mockMedicine: Medicine = {
    id: 'm1',
    medicineName: 'Paracetamol',
    genericName: 'Acetaminophen',
    manufacturer: 'Generic Pharma',
    category: 'Analgesic',
    unit: 'tablet',
    priceInPaisa: 500,
    quantity: 100,
    isDiscontinued: false,
    createdAt: '2026-01-01T00:00:00Z',
  };

  const mockInactiveMedicine: Medicine = {
    ...mockMedicine,
    id: 'm2',
    medicineName: 'Old Med',
    isDiscontinued: true,
  };

  const mockPagedResponse: ApiResponse<PagedResponse<Medicine>> = {
    success: true,
    data: {
      content: [mockMedicine],
      pageNumber: 0,
      pageSize: 20,
      totalElements: 1,
      totalPages: 1,
      last: true,
    },
    message: 'ok',
    timestamp: '',
    requestId: 'r1',
  };

  const mockSearchResponse: ApiResponse<Medicine[]> = {
    success: true,
    data: [mockMedicine],
    message: 'ok',
    timestamp: '',
    requestId: 'r1',
  };

  beforeEach(() => {
    mockMedicineService = {
      getMedicines: vi.fn().mockReturnValue(of(mockPagedResponse)),
      getMedicineById: vi.fn().mockReturnValue(of({ success: true, data: mockMedicine, message: 'ok', timestamp: '', requestId: 'r1' })),
      searchMedicines: vi.fn().mockReturnValue(of(mockSearchResponse)),
      createMedicine: vi.fn().mockReturnValue(of({ success: true, data: mockMedicine, message: 'created', timestamp: '', requestId: 'r1' })),
      updateMedicine: vi.fn().mockReturnValue(of({ success: true, data: mockMedicine, message: 'updated', timestamp: '', requestId: 'r1' })),
    };

    TestBed.configureTestingModule({
      providers: [
        MedicineStore,
        { provide: MedicineService, useValue: mockMedicineService },
      ],
    });

    store = TestBed.inject(MedicineStore);
  });

  it('should have initial state', () => {
    expect(store.medicines()).toEqual([]);
    expect(store.searchResults()).toEqual([]);
    expect(store.selectedMedicine()).toBeNull();
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.totalElements()).toBe(0);
    expect(store.currentPage()).toBe(0);
  });

  it('should have computed false initially', () => {
    expect(store.hasMedicines()).toBe(false);
    expect(store.activeMedicines()).toEqual([]);
  });

  it('should load medicines successfully', fakeAsync(() => {
    store.loadMedicines({ page: 0, size: 20 });
    tick();
    expect(store.medicines()).toEqual([mockMedicine]);
    expect(store.totalElements()).toBe(1);
    expect(store.loading()).toBe(false);
    expect(store.hasMedicines()).toBe(true);
  }));

  it('should load medicines with default params', fakeAsync(() => {
    store.loadMedicines();
    tick();
    expect(mockMedicineService.getMedicines).toHaveBeenCalledWith(0, 20, undefined);
  }));

  it('should handle load medicines error', fakeAsync(() => {
    mockMedicineService.getMedicines = vi.fn().mockReturnValue(throwError(() => new Error('Load failed')));
    const errorStore = TestBed.inject(MedicineStore);
    errorStore.loadMedicines();
    tick();
    expect(errorStore.error()).toBe('Load failed');
    expect(errorStore.loading()).toBe(false);
  }));

  it('should search medicines', fakeAsync(() => {
    store.searchMedicines('para');
    tick();
    expect(store.searchResults()).toEqual([mockMedicine]);
    expect(mockMedicineService.searchMedicines).toHaveBeenCalledWith('para');
  }));

  it('should handle search medicines error', fakeAsync(() => {
    mockMedicineService.searchMedicines = vi.fn().mockReturnValue(throwError(() => new Error('Search failed')));
    const errorStore = TestBed.inject(MedicineStore);
    errorStore.searchMedicines('para');
    tick();
    expect(errorStore.error()).toBe('Search failed');
  }));

  it('should load single medicine', fakeAsync(() => {
    store.loadMedicine('m1');
    tick();
    expect(store.selectedMedicine()).toEqual(mockMedicine);
  }));

  it('should handle load medicine error', fakeAsync(() => {
    mockMedicineService.getMedicineById = vi.fn().mockReturnValue(throwError(() => new Error('Not found')));
    const errorStore = TestBed.inject(MedicineStore);
    errorStore.loadMedicine('m1');
    tick();
    expect(errorStore.error()).toBe('Not found');
  }));

  it('should create medicine', fakeAsync(() => {
    store.loadMedicines();
    tick();
    const initialCount = store.medicines().length;
    store.createMedicine({ medicineName: 'New Med' } as Partial<Medicine>);
    tick();
    expect(mockMedicineService.createMedicine).toHaveBeenCalled();
    expect(store.medicines().length).toBe(initialCount + 1);
    expect(store.totalElements()).toBe(initialCount + 1);
  }));

  it('should handle create medicine error', fakeAsync(() => {
    mockMedicineService.createMedicine = vi.fn().mockReturnValue(throwError(() => new Error('Create failed')));
    const errorStore = TestBed.inject(MedicineStore);
    errorStore.createMedicine({ medicineName: 'Bad' } as Partial<Medicine>);
    tick();
    expect(errorStore.error()).toBe('Create failed');
  }));

  it('should update medicine', fakeAsync(() => {
    store.loadMedicines();
    tick();
    store.updateMedicine({ id: 'm1', medicine: { priceInPaisa: 1000 } });
    tick();
    expect(mockMedicineService.updateMedicine).toHaveBeenCalledWith('m1', { priceInPaisa: 1000 });
  }));

  it('should handle update medicine error', fakeAsync(() => {
    mockMedicineService.updateMedicine = vi.fn().mockReturnValue(throwError(() => new Error('Update failed')));
    const errorStore = TestBed.inject(MedicineStore);
    errorStore.updateMedicine({ id: 'm1', medicine: { medicineName: 'Bad' } });
    tick();
    expect(errorStore.error()).toBe('Update failed');
  }));

  it('should compute activeMedicines filtering inactive', fakeAsync(() => {
    mockMedicineService.getMedicines = vi.fn().mockReturnValue(of({
      ...mockPagedResponse,
      data: { ...mockPagedResponse.data, content: [mockMedicine, mockInactiveMedicine], totalElements: 2 },
    }));
    store.loadMedicines();
    tick();
    expect(store.activeMedicines()).toEqual([mockMedicine]);
  }));

  it('should clear search results', () => {
    store.clearSearchResults();
    expect(store.searchResults()).toEqual([]);
  });

  it('should clear selected medicine', () => {
    store.clearSelectedMedicine();
    expect(store.selectedMedicine()).toBeNull();
  });

  it('should clear error', () => {
    store.clearError();
    expect(store.error()).toBeNull();
  });
});
