import { TestBed } from '@angular/core/testing';
import { ConsultationWorkspace } from './consultation-workspace';
import { FormBuilder } from '@angular/forms';
import { ConsultationService } from '../../../../core/services/consultation.service';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

describe('ConsultationWorkspace', () => {
  function createComponent(overrides?: Partial<ConsultationService>) {
    TestBed.configureTestingModule({
      providers: [
        FormBuilder,
        {
          provide: ConsultationService,
          useValue: {
            createConsultation: vi.fn().mockReturnValue(of({ success: true })),
            ...overrides,
          },
        },
      ],
    });
    return TestBed.runInInjectionContext(() => new ConsultationWorkspace());
  }

  it('should create with initial state', () => {
    const component = createComponent();
    expect(component).toBeTruthy();
    expect(component.consultationForm).toBeDefined();
  });

  it('should add one medicine on init', () => {
    const component = createComponent();
    component.ngOnInit();
    expect(component.medicines.length).toBe(1);
  });

  it('should get medicines form array', () => {
    const component = createComponent();
    expect(component.medicines.length).toBe(0);
    component.addMedicine();
    expect(component.medicines.length).toBe(1);
  });

  it('should add medicine', () => {
    const component = createComponent();
    component.addMedicine();
    expect(component.medicines.length).toBe(1);
    component.addMedicine();
    expect(component.medicines.length).toBe(2);
  });

  it('should remove medicine at index', () => {
    const component = createComponent();
    component.addMedicine();
    component.addMedicine();
    component.removeMedicine(0);
    expect(component.medicines.length).toBe(1);
  });

  it('should create medicine form group with defaults', () => {
    const component = createComponent();
    const fg = component.createMedicineFormGroup();
    expect(fg.get('name')?.value).toBe('');
    expect(fg.get('frequency')?.value).toBe('1-0-1');
    expect(fg.get('duration')?.value).toBe(3);
  });

  it('should calculate total tabs', () => {
    const component = createComponent();
    expect(component.calculateTotal('1-0-1', 5)).toBe('10 Tabs');
    expect(component.calculateTotal('1-1-1', 7)).toBe('21 Tabs');
    expect(component.calculateTotal('SOS', 3)).toBe('3 Tabs');
    expect(component.calculateTotal('', 0)).toBe('0 Tabs');
  });

  it('should show error when finishAndPrint called with invalid form', () => {
    const component = createComponent();
    component.ngOnInit();
    component.finishAndPrint();
    expect(component.error).toBe('Please fill out required fields');
  });

  it('should submit via API when finishAndPrint with valid form', () => {
    const createSpy = vi.fn().mockReturnValue(of({ success: true }));
    const component = createComponent({ createConsultation: createSpy });
    component.ngOnInit();
    component.medicines.at(0).patchValue({ name: 'Paracetamol' });
    component.finishAndPrint();
    expect(component.isSubmitting).toBe(false);
  });

  it('should handle API error on submit', () => {
    const component = createComponent({
      createConsultation: vi.fn().mockReturnValue(throwError(() => ({ message: 'Server error' }))),
    });
    component.ngOnInit();
    component.medicines.at(0).patchValue({ name: 'Paracetamol' });
    component.finishAndPrint();
    expect(component.error).toBe('Server error');
  });
});
