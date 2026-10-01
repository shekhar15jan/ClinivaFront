import { TestBed } from '@angular/core/testing';
import { PatientList } from './patient-list';
import { PatientService } from '../../../../core/services/patient.service';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { ApiResponse, PagedResponse } from '../../../../core/models/common.model';
import { Patient } from '../../../../core/models/patient.model';

describe('PatientList', () => {
  const mockPatient: Patient = {
    id: 'p1', patientId: 'CLV-001', fullName: 'Rahul Sharma',
    dateOfBirth: '1990-01-01', age: 36, gender: 'MALE', phone: '9876543210',
  };

  const mockPaged: ApiResponse<PagedResponse<Patient>> = {
    success: true,
    data: { content: [mockPatient], pageNumber: 0, pageSize: 20, totalElements: 1, totalPages: 1, last: true },
    message: 'ok', timestamp: '', requestId: 'r1',
  };

  function createComponent(overrides?: Partial<PatientService>, role = 'ADMIN', query: Record<string, string> = {}) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { currentUserValue: { role } } },
        { provide: ActivatedRoute, useValue: { queryParamMap: of(convertToParamMap(query)) } },
        { provide: PatientService, useValue: { getPatients: vi.fn().mockReturnValue(of(mockPaged)), searchPatients: vi.fn().mockReturnValue(of(mockPaged)), createPatient: vi.fn().mockReturnValue(of({ success: true, data: mockPatient, message: 'created', timestamp: '', requestId: 'r1' })), ...overrides } },
        FormBuilder,
      ],
    });
    return TestBed.runInInjectionContext(() => new PatientList());
  }

  it('should create with initial state', () => {
    const component = createComponent();
    expect(component).toBeTruthy();
    expect(component.patients).toEqual([]);
    expect(component.isLoading).toBe(false);
    expect(component.showAddModal).toBe(false);
    expect(component.isSubmitting).toBe(false);
  });

  it('should load patients on init', () => {
    const component = createComponent();
    component.ngOnInit();
    expect(component.patients).toEqual([mockPatient]);
    expect(component.isLoading).toBe(false);
  });

  it('should handle load patients error', () => {
    const component = createComponent({ getPatients: vi.fn().mockReturnValue(throwError(() => new Error('fail'))) });
    component.ngOnInit();
    expect(component.patients).toEqual([]);
    expect(component.isLoading).toBe(false);
  });

  it('should compute getInitials', () => {
    const component = createComponent();
    expect(component.getInitials('Rahul Sharma')).toBe('RS');
    expect(component.getInitials('John')).toBe('J');
    expect(component.getInitials('')).toBe('');
  });

  it('should toggle add modal and reset form', () => {
    const component = createComponent();
    expect(component.showAddModal).toBe(false);
    component.toggleAddModal();
    expect(component.showAddModal).toBe(true);
    component.toggleAddModal();
    expect(component.showAddModal).toBe(false);
  });

  it('should not submit invalid form', () => {
    const component = createComponent();
    const spy = vi.spyOn(component, 'toggleAddModal');
    component.onSubmitAdd();
    expect(component.isSubmitting).toBe(false);
    expect(spy).not.toHaveBeenCalled();
  });

  it('should submit and create patient', () => {
    const component = createComponent();
    component.showAddModal = true;
    component.addForm.patchValue({ fullName: 'Test', dateOfBirth: '2000-01-01', gender: 'MALE', phone: '9876543210' });
    component.onSubmitAdd();
    expect(component.isSubmitting).toBe(false);
    expect(component.showAddModal).toBe(false);
  });

  it('should handle create patient error', () => {
    const component = createComponent({ createPatient: vi.fn().mockReturnValue(throwError(() => new Error('fail'))) });
    component.addForm.patchValue({ fullName: 'Test', dateOfBirth: '2000-01-01', gender: 'MALE', phone: '9876543210' });
    component.onSubmitAdd();
    expect(component.isSubmitting).toBe(false);
  });

  describe('importing a CSV', () => {
    const file = new File(['name,phone\nA,9000000001'], 'patients.csv', { type: 'text/csv' });
    const reply = (data: unknown) => ({ success: true, data, message: 'ok', timestamp: '', requestId: 'r' });

    it('says how many were imported and how many were left out, with the reasons', () => {
      const component = createComponent({
        uploadPatients: vi.fn().mockReturnValue(of(reply({ imported: 2, skipped: 1, errors: ['Row 3: Duplicate phone 9000000001'] }))),
      } as unknown as Partial<PatientService>);
      component.csvFile = file;
      component.uploadCsv();
      expect(component.uploadResult).toBe('Imported 2 patients, skipped 1.');
      expect(component.uploadIssues).toEqual(['Row 3: Duplicate phone 9000000001']);
      expect(component.uploadFailed).toBe(false);
      expect(component.showCsvUpload).toBe(false);
    });

    it('uses the singular for one patient and mentions no skips when there were none', () => {
      const component = createComponent({
        uploadPatients: vi.fn().mockReturnValue(of(reply({ imported: 1, skipped: 0, errors: [] }))),
      } as unknown as Partial<PatientService>);
      component.csvFile = file;
      component.uploadCsv();
      expect(component.uploadResult).toBe('Imported 1 patient.');
    });

    it('shows the server reason when the file is refused', () => {
      const component = createComponent({
        uploadPatients: vi.fn().mockReturnValue(throwError(() => ({ error: { message: 'Only CSV files are accepted' } }))),
      } as unknown as Partial<PatientService>);
      component.csvFile = file;
      component.uploadCsv();
      expect(component.uploadResult).toBe('Only CSV files are accepted');
      expect(component.uploadFailed).toBe(true);
      expect(component.isUploading).toBe(false);
    });
  });

  describe('at clinic scale', () => {
    const pageOf = (n: number, total: number, pageNumber = 0) => ({
      success: true, message: '', timestamp: '', requestId: '',
      data: { content: Array.from({ length: n }, (_, k) => ({ ...mockPatient, id: `p${pageNumber}-${k}` })),
        pageNumber, pageSize: 20, totalElements: total, totalPages: Math.ceil(total / 20), last: false },
    });

    it('shows one page and how many there are in all', () => {
      const component = createComponent({ getPatients: vi.fn().mockReturnValue(of(pageOf(20, 20000))) });
      component.ngOnInit();
      expect(component.patients.length).toBe(20);
      expect(component.totalElements).toBe(20000);
      expect([component.firstShown, component.lastShown]).toEqual([1, 20]);
    });

    it('moves between pages on the server, within range', () => {
      const getPatients = vi.fn().mockImplementation((page: number) => of(pageOf(20, 20000, page)));
      const component = createComponent({ getPatients });
      component.ngOnInit();
      component.goToPage(1);
      expect(getPatients).toHaveBeenLastCalledWith(1, 20);
      getPatients.mockClear();
      component.goToPage(-1);
      component.goToPage(5000);
      expect(getPatients).not.toHaveBeenCalled();
    });

    it('searches the whole clinic on the server once typing pauses', () => {
      vi.useFakeTimers();
      try {
        const searchPatients = vi.fn().mockReturnValue(of(pageOf(1, 1)));
        const component = createComponent({ searchPatients });
        component.ngOnInit();
        component.searchQuery = 'Rao';
        component.onSearchInput();
        expect(searchPatients).not.toHaveBeenCalled();
        vi.advanceTimersByTime(300);
        expect(searchPatients).toHaveBeenCalledWith('Rao', 0, 20);
      } finally {
        vi.useRealTimers();
      }
    });

    it('opens with the search from the header', () => {
      const searchPatients = vi.fn().mockReturnValue(of(pageOf(1, 1)));
      const component = createComponent({ searchPatients }, 'RECEPTIONIST', { q: '98765' });
      component.ngOnInit();
      expect(component.searchQuery).toBe('98765');
      expect(searchPatients).toHaveBeenCalledWith('98765', 0, 20);
    });
  });

  it('offers adding patients to the front desk and administrators, and CSV import to administrators only', () => {
    const nurse = createComponent(undefined, 'NURSE');
    expect([nurse.canAdd, nurse.canImport]).toEqual([false, false]);
    const desk = createComponent(undefined, 'RECEPTIONIST');
    expect([desk.canAdd, desk.canImport]).toEqual([true, false]);
    const admin = createComponent(undefined, 'ADMIN');
    expect([admin.canAdd, admin.canImport]).toEqual([true, true]);
  });
});
