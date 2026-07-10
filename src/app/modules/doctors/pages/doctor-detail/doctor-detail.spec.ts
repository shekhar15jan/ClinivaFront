import { TestBed } from '@angular/core/testing';
import { DoctorDetail } from './doctor-detail';
import { DoctorService } from '../../../../core/services/doctor.service';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { ApiResponse } from '../../../../core/models/common.model';
import { Doctor } from '../../../../core/models/doctor.model';

describe('DoctorDetail', () => {
  const mockDoctor: Doctor = {
    id: 'd1', fullName: 'Dr. Anita Desai', specialization: 'Cardiologist',
    qualification: 'MD', consultationFeeInPaisa: 50000, isActive: true,
    phone: '9876543210', email: 'anita@test.com',
  };

  const mockResponse: ApiResponse<Doctor> = {
    success: true, data: mockDoctor, message: 'ok', timestamp: '', requestId: 'r1',
  };

  function createComponent(overrides?: Partial<DoctorService>) {
    TestBed.configureTestingModule({
      providers: [
        { provide: DoctorService, useValue: { getDoctorById: vi.fn().mockReturnValue(of(mockResponse)), ...overrides } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'd1' } }, params: of({ id: 'd1' }), parent: { snapshot: { params: {} } } } },
      ],
    });
    return TestBed.runInInjectionContext(() => new DoctorDetail());
  }

  it('should create with initial state', () => {
    const component = createComponent();
    expect(component).toBeTruthy();
    expect(component.doctor).toBeUndefined();
    expect(component.isLoading).toBe(false);
    expect(component.todayAppointments).toBe(8);
    expect(component.experience).toBe(12);
    expect(component.weekDays.length).toBe(7);
  });

  it('should load doctor on init from route param', () => {
    const component = createComponent();
    component.ngOnInit();
    expect(component.doctor).toEqual(mockDoctor);
    expect(component.isLoading).toBe(false);
  });

  it('should not load if no route param', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: DoctorService, useValue: { getDoctorById: vi.fn() } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } }, params: of({}), parent: { snapshot: { params: {} } } } },
      ],
    });
    const component = TestBed.runInInjectionContext(() => new DoctorDetail());
    component.ngOnInit();
    expect(component.doctor).toBeUndefined();
  });

  it('should handle load doctor error', () => {
    const component = createComponent({ getDoctorById: vi.fn().mockReturnValue(throwError(() => new Error('fail'))) });
    component.ngOnInit();
    expect(component.isLoading).toBe(false);
    expect(component.doctor).toBeUndefined();
  });
});
