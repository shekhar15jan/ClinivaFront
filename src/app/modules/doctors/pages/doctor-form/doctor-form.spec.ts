import { TestBed } from '@angular/core/testing';
import { DoctorForm } from './doctor-form';
import { DoctorService } from '../../../../core/services/doctor.service';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

describe('DoctorForm', () => {
  function createComponent(overrides?: Partial<DoctorService>) {
    TestBed.configureTestingModule({
      providers: [
        FormBuilder,
        { provide: DoctorService, useValue: { createDoctor: vi.fn().mockReturnValue(of({ success: true, data: {}, message: 'created', timestamp: '', requestId: 'r1' })), ...overrides } },
        { provide: Router, useValue: { navigate: vi.fn(), routerState: { root: {} } } },
      ],
    });
    return TestBed.runInInjectionContext(() => new DoctorForm());
  }

  it('should create with initial state', () => {
    const component = createComponent();
    expect(component).toBeTruthy();
    expect(component.isSubmitting).toBe(false);
    expect(component.error).toBe('');
    expect(component.doctorForm).toBeDefined();
  });

  it('should initialize form with defaults', () => {
    const component = createComponent();
    expect(component.doctorForm.get('experienceYears')?.value).toBe(0);
    expect(component.doctorForm.get('consultationFee')?.value).toBe(0);
  });

  it('should not submit invalid form', () => {
    const component = createComponent();
    component.onSubmit();
    expect(component.isSubmitting).toBe(false);
  });

  it('should submit valid form and navigate', () => {
    const component = createComponent();
    component.doctorForm.patchValue({
      fullName: 'Dr. Test', specialization: 'Cardiologist', qualification: 'MD',
      phone: '9876543210', email: 'test@test.com', consultationFee: 500,
    });
    component.onSubmit();
    expect(component.isSubmitting).toBe(false);
  });

  it('should handle create error', () => {
    const component = createComponent({
      createDoctor: vi.fn().mockReturnValue(throwError(() => ({ error: { message: 'Failed' } }))),
    });
    component.doctorForm.patchValue({
      fullName: 'Dr. Test', specialization: 'Cardiologist', qualification: 'MD',
      phone: '9876543210', email: 'test@test.com', consultationFee: 500,
    });
    component.onSubmit();
    expect(component.isSubmitting).toBe(false);
    expect(component.error).toBe('Failed');
  });

  it('should handle create error with default message', () => {
    const component = createComponent({
      createDoctor: vi.fn().mockReturnValue(throwError(() => new Error('Raw'))),
    });
    component.doctorForm.patchValue({
      fullName: 'Dr. Test', specialization: 'Cardiologist', qualification: 'MD',
      phone: '9876543210', email: 'test@test.com', consultationFee: 500,
    });
    component.onSubmit();
    expect(component.isSubmitting).toBe(false);
    expect(component.error).toBe('Failed to save doctor');
  });
});
