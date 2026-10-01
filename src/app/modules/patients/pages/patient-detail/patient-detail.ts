import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PatientService } from '../../../../core/services/patient.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { Patient, VisitItem } from '../../../../core/models/patient.model';
import { hospitalCodeFrom } from '../../../../core/utils/route.util';

export const BLOOD_GROUPS = [
  ['A_POSITIVE', 'A+'], ['A_NEGATIVE', 'A-'], ['B_POSITIVE', 'B+'], ['B_NEGATIVE', 'B-'],
  ['AB_POSITIVE', 'AB+'], ['AB_NEGATIVE', 'AB-'], ['O_POSITIVE', 'O+'], ['O_NEGATIVE', 'O-'],
] as const;

export const bloodGroupLabel = (code?: string): string => BLOOD_GROUPS.find(([c]) => c === code)?.[1] ?? '—';

/**
 * A patient's record and history. It used to read the first page of every patient to find this one (so a
 * patient beyond page one showed nothing), and everything below the name - visits, prescriptions, dates -
 * was a fixed sample from 2023. There was no way to edit or delete a patient from here either.
 */
@Component({
  selector: 'app-patient-detail',
  templateUrl: './patient-detail.html',
  styleUrl: './patient-detail.scss',
  imports: [RouterLink, FormsModule, ConfirmDialogComponent],
})
export class PatientDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private patientService = inject(PatientService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  readonly bloodGroups = BLOOD_GROUPS;
  readonly bloodGroupLabel = bloodGroupLabel;

  patientId = '';
  patient: Patient | null = null;
  visits: VisitItem[] = [];
  visitsError = '';
  isLoading = false;
  loadError = '';

  editing = false;
  isSaving = false;
  saveError = '';
  form: Partial<Patient> = {};
  confirmDelete = false;

  get role(): string {
    return this.auth.currentUserValue?.role ?? '';
  }

  /** The API lets the front desk edit patients and only administrators delete them. */
  get canEdit(): boolean {
    return ['ADMIN', 'RECEPTIONIST'].includes(this.role);
  }

  /** Clinical history is for clinical staff and administrators; the front desk works with registration details. */
  get seesClinical(): boolean {
    return this.role !== 'RECEPTIONIST';
  }

  get canDelete(): boolean {
    return this.role === 'ADMIN';
  }

  /** Visit history (which visits had a consultation, prescription and bill) is for all clinic staff. */
  get canSeeVisits(): boolean {
    return ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'NURSE'].includes(this.role);
  }

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.patientId = params['id'];
      this.load(this.patientId);
    });
  }

  load(id: string): void {
    this.isLoading = true;
    this.loadError = '';
    this.patientService.getPatientById(id).subscribe({
      next: (res) => {
        this.patient = res.success ? res.data : null;
        this.isLoading = false;
        if (!this.patient) this.loadError = 'This patient could not be found.';
      },
      error: (err) => {
        this.isLoading = false;
        this.loadError = err?.status === 404 ? 'This patient could not be found.' : err?.error?.message || 'The patient could not be loaded.';
      },
    });
    if (this.canSeeVisits) {
      this.patientService.getPatientVisits(id).subscribe({
        next: (res) => {
          this.visits = res.success ? res.data.visits ?? [] : [];
        },
        error: (err) => {
          this.visitsError = err?.error?.message || 'The visit history could not be loaded.';
        },
      });
    }
  }

  startEdit(): void {
    if (!this.patient) return;
    const p = this.patient;
    this.form = {
      fullName: p.fullName, phone: p.phone, email: p.email ?? '', dateOfBirth: p.dateOfBirth, address: p.address ?? '',
      bloodGroup: p.bloodGroup ?? '', emergencyContactName: p.emergencyContactName ?? '',
      emergencyContactPhone: p.emergencyContactPhone ?? '', medicalHistory: p.medicalHistory ?? '',
    };
    this.saveError = '';
    this.editing = true;
  }

  cancelEdit(): void {
    this.editing = false;
  }

  save(): void {
    if (!this.patient || this.isSaving) return;
    if (!this.form.fullName?.trim()) {
      this.saveError = 'Enter the patient\'s name.';
      return;
    }
    const blank = (v?: string) => (v && v.trim() ? v.trim() : undefined);
    this.isSaving = true;
    this.saveError = '';
    this.patientService
      .updatePatient(this.patient.id, {
        fullName: this.form.fullName.trim(),
        phone: blank(this.form.phone),
        email: blank(this.form.email),
        dateOfBirth: blank(this.form.dateOfBirth),
        address: blank(this.form.address),
        bloodGroup: blank(this.form.bloodGroup),
        emergencyContactName: blank(this.form.emergencyContactName),
        emergencyContactPhone: blank(this.form.emergencyContactPhone),
        // Not sent by the front desk: it is not shown the history, and must not blank it out.
        medicalHistory: this.seesClinical ? blank(this.form.medicalHistory) : undefined,
      })
      .subscribe({
        next: (res) => {
          this.isSaving = false;
          if (res.success && res.data) {
            this.patient = res.data;
            this.editing = false;
            this.toast.success('Patient updated');
          } else {
            this.saveError = res.message || 'The patient could not be updated.';
          }
        },
        error: (err) => {
          this.isSaving = false;
          this.saveError = err?.status === 409 ? 'Another patient already has this phone number or email.' : err?.error?.message || 'The patient could not be updated.';
        },
      });
  }

  askDelete(): void {
    this.confirmDelete = true;
  }

  delete(): void {
    this.confirmDelete = false;
    if (!this.patient) return;
    this.patientService.deletePatient(this.patient.id).subscribe({
      next: () => {
        this.toast.success('Patient deleted');
        this.router.navigate(['/', hospitalCodeFrom(this.route), 'patients']);
      },
      error: (err) => this.toast.error(err?.error?.message || 'The patient could not be deleted.'),
    });
  }

  time(value: string): string {
    return (value ?? '').slice(0, 5);
  }

  getInitials(name: string): string {
    if (!name) return '';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
}
