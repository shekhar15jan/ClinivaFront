import { Component, OnInit, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { OnboardingService } from '../../../core/services/onboarding.service';
import { TenantContextService } from '../../../core/services/tenant-context.service';
import {
  ClinicConfig,
  DepartmentConfig,
  DoctorConfig,
  StaffConfig,
} from '../../../core/models/tenant.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-onboarding-wizard',
  templateUrl: './onboarding-wizard.html',
  styleUrl: './onboarding-wizard.scss',
  imports: [FormsModule],
})
export class OnboardingWizard implements OnInit {
  private onboardingService = inject(OnboardingService);
  private tenantContext = inject(TenantContextService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  currentStep = 1;
  totalSteps = 5;
  isLoading = false;
  hospitalCode = '';

  clinicConfig: ClinicConfig = {
    clinicName: '',
    address: '',
    phone: '',
    email: '',
    patientIdPrefix: '',
    timezone: 'Asia/Kolkata',
    facilities: [],
  };
  departments: DepartmentConfig[] = [];
  doctors: DoctorConfig[] = [];
  staff: StaffConfig[] = [];
  facilityInput = '';

  ngOnInit(): void {
    this.hospitalCode = this.route.snapshot.params['hospitalCode'] || '';
    const tenant = this.tenantContext.tenant();
    if (tenant) {
      this.clinicConfig.clinicName = tenant.name;
      this.clinicConfig.email = tenant.contactEmail || '';
      this.clinicConfig.patientIdPrefix = tenant.patientIdPrefix || '';
    }
  }

  get stepTitle(): string {
    const titles = ['Clinic Configuration', 'Departments', 'Doctors', 'Staff', 'Review & Complete'];
    return titles[this.currentStep - 1] || '';
  }

  addFacility(): void {
    if (this.facilityInput.trim()) {
      this.clinicConfig.facilities.push(this.facilityInput.trim());
      this.facilityInput = '';
    }
  }

  removeFacility(index: number): void {
    this.clinicConfig.facilities.splice(index, 1);
  }

  addDepartment(): void {
    this.departments.push({ name: '', description: '' });
  }

  removeDepartment(index: number): void {
    this.departments.splice(index, 1);
  }

  addDoctor(): void {
    const max = this.tenantContext.getMaxDoctors();
    if (this.doctors.length >= max) return;
    this.doctors.push({
      fullName: '',
      specialization: '',
      qualification: '',
      consultationFeeInPaisa: 0,
      phone: '',
      email: '',
    });
  }

  removeDoctor(index: number): void {
    this.doctors.splice(index, 1);
  }

  addStaff(): void {
    this.staff.push({ fullName: '', email: '', role: 'RECEPTIONIST' });
  }

  removeStaff(index: number): void {
    this.staff.splice(index, 1);
  }

  nextStep(): void {
    if (this.isLoading) return;

    if (this.currentStep === 1) {
      if (!this.clinicConfig.clinicName || !this.clinicConfig.address) {
        return;
      }
      this.isLoading = true;
      this.onboardingService.saveClinicConfig(this.clinicConfig).subscribe({
        next: () => {
          this.isLoading = false;
          this.currentStep = 2;
        },
        error: () => {
          this.isLoading = false;
        },
      });
    } else if (this.currentStep === 2) {
      this.isLoading = true;
      this.onboardingService.saveDepartments(this.departments).subscribe({
        next: () => {
          this.isLoading = false;
          this.currentStep = 3;
        },
        error: () => {
          this.isLoading = false;
        },
      });
    } else if (this.currentStep === 3) {
      if (this.doctors.length === 0) return;
      this.isLoading = true;
      this.onboardingService.saveDoctors(this.doctors).subscribe({
        next: () => {
          this.isLoading = false;
          this.currentStep = 4;
        },
        error: () => {
          this.isLoading = false;
        },
      });
    } else if (this.currentStep === 4) {
      this.isLoading = true;
      this.onboardingService.saveStaff(this.staff).subscribe({
        next: () => {
          this.isLoading = false;
          this.currentStep = 5;
        },
        error: () => {
          this.isLoading = false;
        },
      });
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) this.currentStep--;
  }

  skipStep(): void {
    if (this.currentStep === 2) {
      this.departments = [];
      this.currentStep = 3;
    } else if (this.currentStep === 4 && this.staff.length === 0) {
      this.currentStep = 5;
    }
  }

  completeOnboarding(): void {
    this.isLoading = true;
    this.onboardingService.complete().subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate([`/${this.hospitalCode}/dashboard`]);
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  getMaxDoctors(): number {
    return this.tenantContext.getMaxDoctors();
  }
}
