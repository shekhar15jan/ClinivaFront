import { Component, OnInit, inject } from '@angular/core';
import { EffectiveLicenseService } from '../../../../core/services/effective-license.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { PatientService } from '../../../../core/services/patient.service';
import { IpdService } from '../../../../core/services/ipd.service';
import { AbdmService, RecordRef } from '../../../../core/services/abdm.service';
import { AdmissionSummary } from '../../../../core/models/ipd.model';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ClinicalAccess, Patient, VisitItem } from '../../../../core/models/patient.model';
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
  imports: [RouterLink, FormsModule, ConfirmDialogComponent, DatePipe],
})
export class PatientDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private patientService = inject(PatientService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private license = inject(EffectiveLicenseService);
  private ipd = inject(IpdService);
  private abdm = inject(AbdmService);

  /** ABDM: the patient's ABHA and the records that can be shared (clinics with the module). */
  editingAbha = false;
  abhaNumber = '';
  abhaAddress = '';
  abhaError = '';
  records: RecordRef[] = [];

  readonly bloodGroups = BLOOD_GROUPS;
  readonly bloodGroupLabel = bloodGroupLabel;

  patientId = '';
  patient: Patient | null = null;
  /** Department access for this patient (clinical staff only); null until known or when not clinical staff. */
  access: ClinicalAccess | null = null;
  emergencyOpen = false;
  emergencyReason = '';
  emergencyError = '';
  openingEmergency = false;
  visits: VisitItem[] = [];
  /** Inpatient stays, newest first (clinics with beds only). */
  stays: AdmissionSummary[] = [];
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

  /** Editing patients needs PATIENT_EDIT; deleting them PATIENT_ADMIN. */
  get canEdit(): boolean {
    return this.auth.can('PATIENT_EDIT');
  }

  /**
   * Clinical history is for staff with clinical access, and (when the clinic uses department access) only for
   * patients in their care; others work with registration details.
   */
  get seesClinical(): boolean {
    return this.auth.can('CLINICAL_VIEW') && (this.access?.clinical ?? true);
  }

  get canDelete(): boolean {
    return this.auth.can('PATIENT_ADMIN');
  }

  /** Visit history (which visits had a consultation, prescription and bill) is for all clinic staff. */
  get canSeeVisits(): boolean {
    return this.auth.can('PATIENT_VIEW');
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
    if (this.auth.can('CLINICAL_VIEW') && this.license.activeModules().includes('DEPARTMENT')) {
      this.patientService.getClinicalAccess(id).subscribe({
        next: (res) => (this.access = res.success ? res.data : null),
        error: () => (this.access = null),
      });
    }
    if (this.hasAbdm && this.auth.can('CLINICAL_VIEW')) {
      this.abdm.records(id).subscribe({ next: (r) => (this.records = r), error: () => (this.records = []) });
    }
    if (this.hasBeds) {
      this.ipd.forPatient(id).subscribe({ next: (list) => (this.stays = list), error: () => (this.stays = []) });
    }
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

  /** Beds & admissions is a plan module; the stays show for anyone who can see the bed board. */
  get hasBeds(): boolean {
    return this.auth.can('IPD_VIEW') && this.license.activeModules().includes('IPD');
  }

  get currentStay(): AdmissionSummary | null {
    return this.stays.find((s) => s.status !== 'DISCHARGED') ?? null;
  }

  get hasAbdm(): boolean {
    return this.license.activeModules().includes('ABDM');
  }

  get canEditAbha(): boolean {
    return this.hasAbdm && this.auth.can('PATIENT_EDIT');
  }

  startAbha(): void {
    this.editingAbha = true;
    this.abhaNumber = this.patient?.abhaNumber ?? '';
    this.abhaAddress = this.patient?.abhaAddress ?? '';
    this.abhaError = '';
  }

  saveAbha(): void {
    this.abdm.setAbha(this.patientId, this.abhaNumber.trim() || null, this.abhaAddress.trim() || null).subscribe({
      next: (r) => {
        if (this.patient) {
          this.patient = { ...this.patient, abhaNumber: r.abhaNumber || null, abhaAddress: r.abhaAddress || null };
        }
        this.editingAbha = false;
        this.toast.success('ABHA saved');
      },
      error: (err) => (this.abhaError = err?.error?.message || 'Not saved.'),
    });
  }

  openRecord(r: RecordRef): void {
    this.abdm.document(r.kind, r.id).subscribe({
      next: (blob) => window.open(URL.createObjectURL(blob), '_blank'),
      error: () => this.toast.error('The record could not be opened.'),
    });
  }

  get canBookSurgery(): boolean {
    return this.auth.can('OT_SCHEDULE') && this.license.activeModules().includes('OT');
  }

  get canOrderImaging(): boolean {
    return this.auth.can('IMAGING_ORDER') && this.license.activeModules().includes('RADIOLOGY');
  }

  get canOrderLab(): boolean {
    return this.auth.can('LAB_ORDER') && this.license.activeModules().includes('LAB');
  }

  get canAdmit(): boolean {
    return this.hasBeds && this.auth.can('IPD_MANAGE') && !this.currentStay;
  }

  /** A real reason is required: it is what the reviewer reads. */
  get emergencyReasonValid(): boolean {
    return this.emergencyReason.trim().length >= 10;
  }

  openEmergencyAccess(): void {
    if (!this.patientId || !this.emergencyReasonValid || this.openingEmergency) return;
    this.openingEmergency = true;
    this.emergencyError = '';
    this.patientService.openEmergencyAccess(this.patientId, this.emergencyReason.trim()).subscribe({
      next: () => {
        this.openingEmergency = false;
        this.emergencyOpen = false;
        this.emergencyReason = '';
        this.toast.warning('Emergency access opened. It is logged and will be reviewed.');
        this.load(this.patientId);
      },
      error: (err) => {
        this.openingEmergency = false;
        this.emergencyError = err?.error?.message || 'Emergency access could not be opened.';
      },
    });
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
