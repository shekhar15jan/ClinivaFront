import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';
import { PatientService } from '../../../../core/services/patient.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { FormsModule } from '@angular/forms';
import { Patient } from '../../../../core/models/patient.model';

@Component({
  selector: 'app-my-profile',
  templateUrl: './my-profile.html',
  styleUrl: './my-profile.scss',
  imports: [FormsModule],
})
export class MyProfile implements OnInit {
  private authService = inject(AuthService);
  private patientService = inject(PatientService);
  private toastService = inject(ToastService);

  patient: Patient | null = null;
  loading = true;
  editing = false;
  isSaving = false;

  editForm = {
    fullName: '',
    phone: '',
    email: '',
    address: '',
    dateOfBirth: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    bloodGroup: '',
  };

  bloodGroups = [
    'A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE',
    'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE'
  ];

  get user() {
    return this.authService.currentUserValue;
  }

  ngOnInit(): void {
    this.loadPatientProfile();
  }

  loadPatientProfile(): void {
    this.loading = true;
    const email = this.user?.email;
    if (!email) {
      this.loading = false;
      return;
    }
    this.patientService.searchPatients(email).subscribe({
      next: (res) => {
        const patients = res.data;
        if (patients && patients.length > 0) {
          this.patient = patients.find(p => p.email === email) || patients[0];
          if (this.patient) {
            this.populateForm(this.patient);
          }
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  populateForm(patient: Patient): void {
    this.editForm = {
      fullName: patient.fullName || '',
      phone: patient.phone || '',
      email: patient.email || '',
      address: patient.address || '',
      dateOfBirth: patient.dateOfBirth || '',
      emergencyContactName: patient.emergencyContactName || '',
      emergencyContactPhone: patient.emergencyContactPhone || '',
      bloodGroup: patient.bloodGroup || '',
    };
  }

  startEditing(): void {
    this.editing = true;
    if (this.patient) this.populateForm(this.patient);
  }

  cancelEditing(): void {
    this.editing = false;
    if (this.patient) this.populateForm(this.patient);
  }

  saveProfile(): void {
    if (!this.patient) return;
    this.isSaving = true;
    this.patientService.updatePatient(this.patient.id, {
      fullName: this.editForm.fullName,
      phone: this.editForm.phone,
      email: this.editForm.email,
      address: this.editForm.address,
      dateOfBirth: this.editForm.dateOfBirth || undefined,
      emergencyContactName: this.editForm.emergencyContactName,
      emergencyContactPhone: this.editForm.emergencyContactPhone,
      bloodGroup: this.editForm.bloodGroup || undefined,
    }).subscribe({
      next: (res) => {
        this.patient = res.data;
        this.editing = false;
        this.isSaving = false;
        this.toastService.success('Profile updated successfully');
      },
      error: () => {
        this.isSaving = false;
        this.toastService.error('Failed to update profile');
      }
    });
  }

  formatBloodGroup(bg: string): string {
    return bg.replace('_POSITIVE', '+').replace('_NEGATIVE', '-');
  }
}
