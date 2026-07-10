import { TestBed } from '@angular/core/testing';
import { PatientDetail } from './patient-detail';
import { PatientService } from '../../../../core/services/patient.service';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { ApiResponse, PagedResponse } from '../../../../core/models/common.model';
import { Patient } from '../../../../core/models/patient.model';

describe('PatientDetail', () => {
  const mockPatient: Patient = {
    id: 'p1', patientId: 'CLV-001', fullName: 'Rahul Sharma',
    dateOfBirth: '1990-01-01', age: 36, gender: 'MALE', phone: '9876543210',
  };

  const mockPaged: ApiResponse<PagedResponse<Patient>> = {
    success: true,
    data: { content: [mockPatient, { ...mockPatient, id: 'p2' }], pageNumber: 0, pageSize: 20, totalElements: 2, totalPages: 1, last: true },
    message: 'ok', timestamp: '', requestId: 'r1',
  };

  function createComponent() {
    TestBed.configureTestingModule({
      providers: [
        { provide: PatientService, useValue: { getPatients: vi.fn().mockReturnValue(of(mockPaged)) } },
        { provide: ActivatedRoute, useValue: { params: of({ id: 'p1' }), snapshot: { paramMap: { get: () => 'p1' } }, parent: { snapshot: { params: {} } } } },
      ],
    });
    return TestBed.runInInjectionContext(() => new PatientDetail());
  }

  it('should create with initial state', () => {
    const component = createComponent();
    expect(component).toBeTruthy();
    expect(component.patientId).toBe('');
    expect(component.patient).toBeNull();
    expect(component.visits).toEqual([]);
    expect(component.isLoading).toBe(false);
  });

  it('should load patient from route params on init', () => {
    const component = createComponent();
    component.ngOnInit();
    expect(component.patientId).toBe('p1');
    expect(component.patient).toEqual(mockPatient);
    expect(component.isLoading).toBe(false);
  });

  it('should handle patient not found', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: PatientService, useValue: { getPatients: vi.fn().mockReturnValue(of(mockPaged)) } },
        { provide: ActivatedRoute, useValue: { params: of({ id: 'p-not-found' }), snapshot: { paramMap: { get: () => 'p-not-found' } }, parent: { snapshot: { params: {} } } } },
      ],
    });
    const component = TestBed.runInInjectionContext(() => new PatientDetail());
    component.ngOnInit();
    expect(component.patient).toBeNull();
  });

  it('should compute getInitials', () => {
    const component = createComponent();
    expect(component.getInitials('Rahul Sharma')).toBe('RS');
    expect(component.getInitials('')).toBe('');
    expect(component.getInitials('A')).toBe('A');
  });
});
