import { TestBed } from '@angular/core/testing';
import { OnboardingWizard } from './onboarding-wizard';
import { OnboardingService } from '../../../core/services/onboarding.service';
import { TenantContextService } from '../../../core/services/tenant-context.service';
import { Router, ActivatedRoute } from '@angular/router';
import { of, Subject } from 'rxjs';
import { vi } from 'vitest';

const mockTenant = {
  id: 't1',
  tenantId: 'test-hospital',
  name: 'Test Hospital',
  contactEmail: 'admin@test.com',
  contactPhone: '',
  address: '123 Main St',
  status: 'ACTIVE' as const,
  timezone: 'Asia/Kolkata',
  currency: 'INR',
  patientIdPrefix: 'PAT',
  logoUrl: '',
};

function createOnboardingWizard(overrides?: { hospitalCode?: string; tenant?: typeof mockTenant | null }) {
  const hospitalCode = overrides?.hospitalCode ?? 'test-hospital';
  const tenant = overrides?.tenant !== undefined ? overrides.tenant : mockTenant;

  const saveClinicConfig = vi.fn();
  const saveDepartments = vi.fn();
  const saveDoctors = vi.fn();
  const saveStaff = vi.fn();
  const complete = vi.fn();
  const onboardingSpy = { saveClinicConfig, saveDepartments, saveDoctors, saveStaff, complete };

  const getMaxDoctors = vi.fn().mockReturnValue(5);
  const tenantContextSpy = { tenant: vi.fn().mockReturnValue(tenant), getMaxDoctors };

  const routerSpy = { navigate: vi.fn() };
  const routeSpy = { snapshot: { params: { hospitalCode } } };

  TestBed.configureTestingModule({
    providers: [
      { provide: OnboardingService, useValue: onboardingSpy },
      { provide: TenantContextService, useValue: tenantContextSpy },
      { provide: Router, useValue: routerSpy },
      { provide: ActivatedRoute, useValue: routeSpy },
    ],
  });

  const component = TestBed.runInInjectionContext(() => new OnboardingWizard());
  component.ngOnInit();
  return { component, onboardingSpy, tenantContextSpy, routerSpy, routeSpy };
}

describe('OnboardingWizard', () => {
  describe('creation and initial state', () => {
    it('should create', () => {
      const { component } = createOnboardingWizard();
      expect(component).toBeTruthy();
    });

    it('should have default initial state', () => {
      const { component } = createOnboardingWizard();
      expect(component.currentStep).toBe(1);
      expect(component.totalSteps).toBe(5);
      expect(component.isLoading).toBe(false);
      expect(component.hospitalCode).toBe('test-hospital');
      expect(component.clinicConfig.clinicName).toBe('Test Hospital');
      expect(component.clinicConfig.email).toBe('admin@test.com');
      expect(component.clinicConfig.patientIdPrefix).toBe('PAT');
      expect(component.clinicConfig.timezone).toBe('Asia/Kolkata');
      expect(component.clinicConfig.facilities).toEqual([]);
      expect(component.departments).toEqual([]);
      expect(component.doctors).toEqual([]);
      expect(component.staff).toEqual([]);
      expect(component.facilityInput).toBe('');
    });

    it('should not populate clinicConfig when no tenant', () => {
      const { component } = createOnboardingWizard({ tenant: null });
      expect(component.clinicConfig.clinicName).toBe('');
      expect(component.clinicConfig.email).toBe('');
      expect(component.clinicConfig.patientIdPrefix).toBe('');
    });

    it('should handle empty hospitalCode', () => {
      const { component } = createOnboardingWizard({ hospitalCode: '' });
      expect(component.hospitalCode).toBe('');
    });
  });

  describe('stepTitle', () => {
    it('should return correct title for each step', () => {
      const { component } = createOnboardingWizard();
      component.currentStep = 1;
      expect(component.stepTitle).toBe('Clinic Configuration');
      component.currentStep = 2;
      expect(component.stepTitle).toBe('Departments');
      component.currentStep = 3;
      expect(component.stepTitle).toBe('Doctors');
      component.currentStep = 4;
      expect(component.stepTitle).toBe('Staff');
      component.currentStep = 5;
      expect(component.stepTitle).toBe('Review & Complete');
    });

    it('should return empty string for unknown step', () => {
      const { component } = createOnboardingWizard();
      component.currentStep = 99;
      expect(component.stepTitle).toBe('');
    });
  });

  describe('addFacility / removeFacility', () => {
    it('should add facility when input is non-empty', () => {
      const { component } = createOnboardingWizard();
      component.facilityInput = 'Pharmacy';
      component.addFacility();
      expect(component.clinicConfig.facilities).toEqual(['Pharmacy']);
      expect(component.facilityInput).toBe('');
    });

    it('should not add facility when input is empty', () => {
      const { component } = createOnboardingWizard();
      component.facilityInput = '   ';
      component.addFacility();
      expect(component.clinicConfig.facilities).toEqual([]);
    });

    it('should not add facility when input is empty string', () => {
      const { component } = createOnboardingWizard();
      component.facilityInput = '';
      component.addFacility();
      expect(component.clinicConfig.facilities).toEqual([]);
    });

    it('should remove facility by index', () => {
      const { component } = createOnboardingWizard();
      component.clinicConfig.facilities = ['Pharmacy', 'Lab', 'X-Ray'];
      component.removeFacility(1);
      expect(component.clinicConfig.facilities).toEqual(['Pharmacy', 'X-Ray']);
    });
  });

  describe('addDepartment / removeDepartment', () => {
    it('should add a department', () => {
      const { component } = createOnboardingWizard();
      component.addDepartment();
      expect(component.departments.length).toBe(1);
      expect(component.departments[0]).toEqual({ name: '', description: '' });
    });

    it('should remove a department by index', () => {
      const { component } = createOnboardingWizard();
      component.addDepartment();
      component.addDepartment();
      component.removeDepartment(0);
      expect(component.departments.length).toBe(1);
    });
  });

  describe('addDoctor / removeDoctor', () => {
    it('should add a doctor', () => {
      const { component } = createOnboardingWizard();
      component.addDoctor();
      expect(component.doctors.length).toBe(1);
      expect(component.doctors[0]).toEqual({
        fullName: '',
        specialization: '',
        qualification: '',
        consultationFeeInPaisa: 0,
        phone: '',
        email: '',
      });
    });

    it('should not add doctor beyond max limit', () => {
      const { component, tenantContextSpy } = createOnboardingWizard();
      tenantContextSpy.getMaxDoctors.mockReturnValue(2);
      component.addDoctor();
      component.addDoctor();
      component.addDoctor();
      expect(component.doctors.length).toBe(2);
    });

    it('should remove a doctor by index', () => {
      const { component } = createOnboardingWizard();
      component.addDoctor();
      component.addDoctor();
      component.removeDoctor(1);
      expect(component.doctors.length).toBe(1);
    });
  });

  describe('addStaff / removeStaff', () => {
    it('should add a staff member', () => {
      const { component } = createOnboardingWizard();
      component.addStaff();
      expect(component.staff.length).toBe(1);
      expect(component.staff[0]).toEqual({ fullName: '', email: '', role: 'RECEPTIONIST' });
    });

    it('should remove a staff member by index', () => {
      const { component } = createOnboardingWizard();
      component.addStaff();
      component.addStaff();
      component.removeStaff(0);
      expect(component.staff.length).toBe(1);
    });
  });

  describe('nextStep', () => {
    it('should not proceed when isLoading is true', () => {
      const { component } = createOnboardingWizard();
      component.isLoading = true;
      component.nextStep();
      expect(component.currentStep).toBe(1);
    });

    describe('step 1', () => {
      it('should not proceed when clinicName is missing', () => {
        const { component } = createOnboardingWizard();
        component.clinicConfig.clinicName = '';
        component.clinicConfig.address = '123 Main St';
        component.nextStep();
        expect(component.currentStep).toBe(1);
      });

      it('should not proceed when address is missing', () => {
        const { component } = createOnboardingWizard();
        component.clinicConfig.clinicName = 'Test Clinic';
        component.clinicConfig.address = '';
        component.nextStep();
        expect(component.currentStep).toBe(1);
      });

      it('should save clinic config and advance', () => {
        const { component, onboardingSpy } = createOnboardingWizard();
        const subject = new Subject<unknown>();
        onboardingSpy.saveClinicConfig.mockReturnValue(subject);
        component.clinicConfig.clinicName = 'Test Clinic';
        component.clinicConfig.address = '123 Main St';
        component.nextStep();
        expect(component.isLoading).toBe(true);
        expect(onboardingSpy.saveClinicConfig).toHaveBeenCalledWith(component.clinicConfig);
        subject.next({ success: true });
        expect(component.isLoading).toBe(false);
        expect(component.currentStep).toBe(2);
      });

      it('should handle save clinic config error', () => {
        const { component, onboardingSpy } = createOnboardingWizard();
        const subject = new Subject<unknown>();
        onboardingSpy.saveClinicConfig.mockReturnValue(subject);
        component.clinicConfig.clinicName = 'Test Clinic';
        component.clinicConfig.address = '123 Main St';
        component.nextStep();
        expect(component.isLoading).toBe(true);
        subject.error({ message: 'Error' });
        expect(component.isLoading).toBe(false);
        expect(component.currentStep).toBe(1);
      });
    });

    describe('step 2', () => {
      it('should save departments and advance', () => {
        const { component, onboardingSpy } = createOnboardingWizard();
        const subject = new Subject<unknown>();
        onboardingSpy.saveDepartments.mockReturnValue(subject);
        component.currentStep = 2;
        component.addDepartment();
        component.nextStep();
        expect(component.isLoading).toBe(true);
        expect(onboardingSpy.saveDepartments).toHaveBeenCalledWith(component.departments);
        subject.next({ success: true });
        expect(component.isLoading).toBe(false);
        expect(component.currentStep).toBe(3);
      });
    });

    describe('step 3', () => {
      it('should not proceed when no doctors', () => {
        const { component } = createOnboardingWizard();
        component.currentStep = 3;
        component.nextStep();
        expect(component.currentStep).toBe(3);
      });

      it('should save doctors and advance', () => {
        const { component, onboardingSpy } = createOnboardingWizard();
        component.currentStep = 3;
        component.addDoctor();
        onboardingSpy.saveDoctors.mockReturnValue(of({ success: true }));
        component.nextStep();
        expect(onboardingSpy.saveDoctors).toHaveBeenCalledWith(component.doctors);
        expect(component.currentStep).toBe(4);
      });
    });

    describe('step 4', () => {
      it('should save staff and advance', () => {
        const { component, onboardingSpy } = createOnboardingWizard();
        component.currentStep = 4;
        onboardingSpy.saveStaff.mockReturnValue(of({ success: true }));
        component.nextStep();
        expect(onboardingSpy.saveStaff).toHaveBeenCalledWith(component.staff);
        expect(component.currentStep).toBe(5);
      });
    });
  });

  describe('prevStep', () => {
    it('should decrement currentStep', () => {
      const { component } = createOnboardingWizard();
      component.currentStep = 3;
      component.prevStep();
      expect(component.currentStep).toBe(2);
    });

    it('should not go below step 1', () => {
      const { component } = createOnboardingWizard();
      component.prevStep();
      expect(component.currentStep).toBe(1);
    });
  });

  describe('skipStep', () => {
    it('should skip departments (step 2)', () => {
      const { component } = createOnboardingWizard();
      component.currentStep = 2;
      component.skipStep();
      expect(component.departments).toEqual([]);
      expect(component.currentStep).toBe(3);
    });

    it('should skip staff when empty (step 4)', () => {
      const { component } = createOnboardingWizard();
      component.currentStep = 4;
      component.skipStep();
      expect(component.currentStep).toBe(5);
    });

    it('should not skip staff when non-empty (step 4)', () => {
      const { component } = createOnboardingWizard();
      component.currentStep = 4;
      component.addStaff();
      component.skipStep();
      expect(component.currentStep).toBe(4);
    });

    it('should do nothing on other steps', () => {
      const { component } = createOnboardingWizard();
      component.currentStep = 3;
      component.skipStep();
      expect(component.currentStep).toBe(3);
    });
  });

  describe('completeOnboarding', () => {
    it('should complete onboarding and navigate to dashboard', () => {
      const { component, onboardingSpy, routerSpy } = createOnboardingWizard();
      onboardingSpy.complete.mockReturnValue(of({ success: true }));
      component.completeOnboarding();
      expect(onboardingSpy.complete).toHaveBeenCalled();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/test-hospital/dashboard']);
      expect(component.isLoading).toBe(false);
    });

    it('should handle complete error', () => {
      const { component, onboardingSpy, routerSpy } = createOnboardingWizard();
      const subject = new Subject<unknown>();
      onboardingSpy.complete.mockReturnValue(subject);
      component.completeOnboarding();
      expect(component.isLoading).toBe(true);
      subject.error({ message: 'Error' });
      expect(routerSpy.navigate).not.toHaveBeenCalled();
      expect(component.isLoading).toBe(false);
    });
  });

  describe('getMaxDoctors', () => {
    it('should delegate to tenantContext.getMaxDoctors', () => {
      const { component, tenantContextSpy } = createOnboardingWizard();
      tenantContextSpy.getMaxDoctors.mockReturnValue(10);
      expect(component.getMaxDoctors()).toBe(10);
    });
  });
});
