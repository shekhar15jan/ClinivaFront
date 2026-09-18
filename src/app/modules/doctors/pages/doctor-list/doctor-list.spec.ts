import { TestBed } from '@angular/core/testing';
import { DoctorList } from './doctor-list';
import { DoctorService } from '../../../../core/services/doctor.service';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { ApiResponse } from '../../../../core/models/common.model';
import { Doctor } from '../../../../core/models/doctor.model';

describe('DoctorList', () => {
  const mockDoctor: Doctor = {
    id: 'd1', fullName: 'Dr. Anita Desai', specialization: 'Cardiologist',
    qualification: 'MD', consultationFeeInPaisa: 50000, isActive: true, email: 'anita@test.com',
  };

  const mockResponse: ApiResponse<{
    content: Doctor[];
    pageNumber: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    last: boolean;
  }> = {
    success: true,
    data: { content: [mockDoctor], pageNumber: 0, pageSize: 20, totalElements: 1, totalPages: 1, last: true },
    message: 'ok',
    timestamp: '',
    requestId: 'r1',
  };

  function createComponent(overrides?: Partial<DoctorService>) {
    TestBed.configureTestingModule({
      providers: [
        { provide: DoctorService, useValue: { getDoctors: vi.fn().mockReturnValue(of(mockResponse)), ...overrides } },
      ],
    });
    return TestBed.runInInjectionContext(() => new DoctorList());
  }

  it('should create with initial state', () => {
    const component = createComponent();
    expect(component).toBeTruthy();
    expect(component.doctors).toEqual([]);
    expect(component.isLoading).toBe(false);
  });

  it('should load doctors on init', () => {
    const component = createComponent();
    component.ngOnInit();
    expect(component.doctors).toEqual([mockDoctor]);
    expect(component.isLoading).toBe(false);
  });

  it('should handle load doctors error', () => {
    const component = createComponent({ getDoctors: vi.fn().mockReturnValue(throwError(() => new Error('fail'))) });
    component.ngOnInit();
    expect(component.doctors).toEqual([]);
    expect(component.isLoading).toBe(false);
  });
});
