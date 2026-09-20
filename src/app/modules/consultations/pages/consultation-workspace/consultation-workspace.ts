import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FormBuilder, FormGroup, FormArray, Validators, FormsModule, ReactiveFormsModule,
} from '@angular/forms';
import { ConsultationService } from '../../../../core/services/consultation.service';
import { AppointmentService } from '../../../../core/services/appointment.service';
import { MedicineService } from '../../../../core/services/medicine.service';
import { PrescriptionService } from '../../../../core/services/prescription.service';
import { Medicine } from '../../../../core/models/medicine.model';
import { Appointment } from '../../../../core/models/appointment.model';
import { PrescriptionTemplate, Prescription, PrescriptionMedicine } from '../../../../core/models/prescription.model';
import { Consultation } from '../../../../core/models/consultation.model';
import { ConsultationStore } from '../../store/consultation.store';
import { hospitalCodeFrom } from '../../../../core/utils/route.util';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-consultation-workspace',
  templateUrl: './consultation-workspace.html',
  styleUrl: './consultation-workspace.scss',
  imports: [FormsModule, ReactiveFormsModule, DatePipe],
})
export class ConsultationWorkspace implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private consultationService = inject(ConsultationService);
  private appointmentService = inject(AppointmentService);
  private medicineService = inject(MedicineService);
  private prescriptionService = inject(PrescriptionService);
  private cdr = inject(ChangeDetectorRef);

  readonly store = inject(ConsultationStore);

  consultationForm: FormGroup;
  isSubmitting = false;
  error = '';

  selectedAppointment: Appointment | null = null;
  existingConsultationId: string | null = null;
  existingPrescriptionId: string | null = null;
  loadingContext = false;

  medicineSuggestions = new Map<number, Medicine[]>();
  medicineSearchTerms = new Map<number, string>();

  prescriptionTemplates: PrescriptionTemplate[] = [];
  showTemplateDropdown = false;

  appointmentSearchTerm = '';
  appointmentSuggestions: Appointment[] = [];
  showQueue = false;
  searchingAppointments = false;

  constructor() {
    this.consultationForm = this.fb.group({
      notes: this.fb.group({
        chiefComplaint: [''],
        vitals: this.fb.group({ bp: [''], temp: [''], pulse: [''], weight: [''] }),
        diagnosis: [''],
      }),
      medicines: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    const appointmentId = this.route.snapshot.paramMap.get('appointmentId');
    if (appointmentId) {
      this.loadAppointment(appointmentId);
    } else {
      this.addMedicine();
      this.showQueue = true;
    }
  }

  private loadAppointment(id: string): void {
    this.loadingContext = true;
    this.error = '';
    this.appointmentService.getAppointmentById(id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.selectedAppointment = res.data;
          this.loadingContext = false;
          this.addMedicine();
          this.loadExistingConsultation(id);
        } else {
          this.error = 'Appointment not found';
          this.loadingContext = false;
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Failed to load appointment', err);
        this.error = 'Failed to load appointment';
        this.loadingContext = false;
        this.cdr.markForCheck();
      },
    });
  }

  private loadExistingConsultation(appointmentId: string): void {
    this.consultationService.getByAppointment(appointmentId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.existingConsultationId = res.data.id;
          this.populateForm(res.data);
          this.loadExistingPrescription(appointmentId);
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.existingConsultationId = null;
        this.cdr.markForCheck();
      },
    });
  }

  private loadExistingPrescription(appointmentId: string): void {
    this.prescriptionService.getByAppointment(appointmentId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.existingPrescriptionId = res.data.id;
          this.populatePrescription(res.data);
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.existingPrescriptionId = null;
        this.cdr.markForCheck();
      },
    });
  }

  private populateForm(consultation: Consultation): void {
    const notesGroup = this.consultationForm.get('notes') as FormGroup;
    notesGroup.patchValue({
      chiefComplaint: consultation.chiefComplaints || '',
      diagnosis: consultation.diagnosis || '',
    });
    if (consultation.vitals) {
      notesGroup.get('vitals')?.patchValue({
        bp: consultation.vitals.bp || '',
        temp: consultation.vitals.temperature || '',
        pulse: consultation.vitals.pulse || '',
        weight: consultation.vitals.weight || '',
      });
    }
  }

  private populatePrescription(prescription: Prescription): void {
    while (this.medicines.length) {
      this.medicines.removeAt(0);
    }
    this.medicineSuggestions.clear();
    this.medicineSearchTerms.clear();
    if (prescription.medicines && prescription.medicines.length > 0) {
      prescription.medicines.forEach((med: PrescriptionMedicine) => {
        const group = this.fb.group({
          name: [med.medicineName, Validators.required],
          instructions: [med.instructions || ''],
          frequency: [med.frequency || '1-0-1', Validators.required],
          duration: [med.duration || 3, [Validators.required, Validators.min(1)]],
        });
        this.medicines.push(group);
      });
    } else {
      this.addMedicine();
    }
  }

  searchAppointments(term: string): void {
    this.appointmentSearchTerm = term;
    if (term.length < 2) {
      this.appointmentSuggestions = [];
      return;
    }
    this.searchingAppointments = true;
    this.appointmentService.getAppointments(0, 20, 'APPROVED').subscribe({
      next: (res) => {
        const all = res.data?.content ?? [];
        const q = term.toLowerCase();
        this.appointmentSuggestions = all.filter(
          (a) =>
            a.patient?.fullName?.toLowerCase().includes(q) ||
            a.doctor?.fullName?.toLowerCase().includes(q) ||
            a.tokenNumber?.toString() === q ||
            a.id?.toLowerCase() === q,
        );
        this.searchingAppointments = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.appointmentSuggestions = [];
        this.searchingAppointments = false;
        this.cdr.markForCheck();
      },
    });
  }

  selectAppointment(appt: Appointment): void {
    this.selectedAppointment = appt;
    this.showQueue = false;
    this.appointmentSuggestions = [];
    this.appointmentSearchTerm = '';
    this.consultationForm.reset();
    this.existingConsultationId = null;
    this.existingPrescriptionId = null;
    while (this.medicines.length) {
      this.medicines.removeAt(0);
    }
    this.medicineSuggestions.clear();
    this.medicineSearchTerms.clear();
    this.router.navigate([], {
      relativeTo: this.route.parent,
      queryParamsHandling: 'merge',
    });
    this.loadAppointment(appt.id);
  }

  clearAppointment(): void {
    this.selectedAppointment = null;
    this.existingConsultationId = null;
    this.existingPrescriptionId = null;
    this.showQueue = true;
    this.consultationForm.reset();
    while (this.medicines.length) {
      this.medicines.removeAt(0);
    }
    this.medicineSuggestions.clear();
    this.medicineSearchTerms.clear();
    this.router.navigate(['/', hospitalCodeFrom(this.route), 'consultations']);
  }

  get medicines(): FormArray {
    return this.consultationForm.get('medicines') as FormArray;
  }

  createMedicineFormGroup(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      instructions: [''],
      frequency: ['1-0-1', Validators.required],
      duration: [3, [Validators.required, Validators.min(1)]],
    });
  }

  addMedicine(): void {
    const index = this.medicines.length;
    this.medicines.push(this.createMedicineFormGroup());
    this.medicineSuggestions.set(index, []);
    this.medicineSearchTerms.set(index, '');
  }

  removeMedicine(index: number): void {
    this.medicines.removeAt(index);
    this.medicineSuggestions.delete(index);
    this.medicineSearchTerms.delete(index);
  }

  searchMedicine(index: number, term: string): void {
    this.medicineSearchTerms.set(index, term);
    if (term.length < 2) {
      this.medicineSuggestions.set(index, []);
      return;
    }
    this.medicineService.searchMedicines(term).subscribe({
      next: (res) => {
        this.medicineSuggestions.set(index, res.data ?? []);
      },
      error: () => {
        this.medicineSuggestions.set(index, []);
      },
    });
  }

  selectMedicine(index: number, medicine: Medicine): void {
    const group = this.medicines.at(index) as FormGroup;
    group.patchValue({ name: medicine.medicineName });
    this.medicineSuggestions.set(index, []);
    this.medicineSearchTerms.set(index, medicine.medicineName);
  }

  hideSuggestions(index: number): void {
    setTimeout(() => this.medicineSuggestions.set(index, []), 200);
  }

  getSuggestions(index: number): Medicine[] {
    return this.medicineSuggestions.get(index) ?? [];
  }

  calculateTotal(frequency: string, duration: number): string {
    if (!frequency || !duration) return '0 Tabs';
    let timesPerDay: number;
    if (frequency === 'SOS') {
      timesPerDay = 1;
    } else {
      timesPerDay = frequency.split('-').reduce((acc, curr) => acc + parseInt(curr || '0', 10), 0);
    }
    return `${timesPerDay * duration} Tabs`;
  }

  loadTemplates(): void {
    this.prescriptionService.getTemplates().subscribe({
      next: (res) => {
        this.prescriptionTemplates = res.data ?? [];
        this.showTemplateDropdown = true;
      },
      error: () => {
        this.prescriptionTemplates = [];
        this.showTemplateDropdown = true;
      },
    });
  }

  applyTemplate(template: PrescriptionTemplate): void {
    const notesGroup = this.consultationForm.get('notes') as FormGroup;
    if (template.diagnosis) {
      notesGroup.patchValue({ diagnosis: template.diagnosis });
    }
    this.medicines.clear();
    this.medicineSuggestions.clear();
    this.medicineSearchTerms.clear();
    if (template.medicines && template.medicines.length > 0) {
      template.medicines.forEach((med) => {
        const group = this.fb.group({
          name: [med.medicineName, Validators.required],
          instructions: [med.instructions || ''],
          frequency: [med.frequency || '1-0-1', Validators.required],
          duration: [med.duration || 3, [Validators.required, Validators.min(1)]],
        });
        this.medicines.push(group);
      });
    } else {
      this.addMedicine();
    }
    this.showTemplateDropdown = false;
  }

  closeTemplateDropdown(): void {
    this.showTemplateDropdown = false;
  }

  finishAndPrint(): void {
    if (this.consultationForm.invalid) {
      this.error = 'Please fill out required fields';
      return;
    }
    if (!this.selectedAppointment) {
      this.error = 'Please select an appointment first';
      return;
    }
    this.isSubmitting = true;
    this.error = '';
    const formVal = this.consultationForm.value;
    const appointmentId = this.selectedAppointment.id;

    const consultationPayload = {
      appointmentId,
      chiefComplaints: formVal.notes?.chiefComplaint || '',
      examinationFindings: '',
      diagnosis: formVal.notes?.diagnosis || '',
      clinicalNotes: '',
      vitals: {
        bp: formVal.notes?.vitals?.bp || undefined,
        temperature: formVal.notes?.vitals?.temp ? String(formVal.notes.vitals.temp) : undefined,
        weight: formVal.notes?.vitals?.weight ? String(formVal.notes.vitals.weight) : undefined,
        pulse: formVal.notes?.vitals?.pulse ? String(formVal.notes.vitals.pulse) : undefined,
      },
    };

    const saveConsultation$ = this.existingConsultationId
      ? this.consultationService.updateConsultation(this.existingConsultationId, consultationPayload)
      : this.consultationService.createConsultation(consultationPayload);

    saveConsultation$.subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const consultationId = res.data.id;
          this.existingConsultationId = consultationId;
          this.savePrescription(consultationId, formVal);
        } else {
          this.isSubmitting = false;
          this.error = 'Failed to save consultation';
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.error = err?.message || 'Error saving consultation';
        this.cdr.markForCheck();
      },
    });
  }

  private savePrescription(consultationId: string, formVal: ConsultationWorkspace['consultationForm']['value']): void {
    const medicines = (formVal.medicines || []).map((m: { name: string; frequency: string; duration: number; instructions?: string }) => ({
      medicineName: m.name,
      frequency: m.frequency,
      duration: m.duration,
      instructions: m.instructions || '',
    }));

    const prescriptionPayload = {
      consultationId,
      diagnosis: formVal.notes?.diagnosis || '',
      medicines,
    };

    const savePrescription$ = this.existingPrescriptionId
      ? this.prescriptionService.updatePrescription(this.existingPrescriptionId, prescriptionPayload)
      : this.prescriptionService.createPrescription(prescriptionPayload);

    savePrescription$.subscribe({
      next: (presRes) => {
        this.isSubmitting = false;
        if (presRes.success && presRes.data) {
          this.existingPrescriptionId = presRes.data.id;
          this.consultationForm.reset();
          while (this.medicines.length) {
            this.medicines.removeAt(0);
          }
          this.medicineSuggestions.clear();
          this.medicineSearchTerms.clear();
          this.addMedicine();
        } else {
          this.error = 'Consultation saved but failed to save prescription';
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.error = 'Consultation saved but prescription error: ' + (err?.message || 'unknown');
        this.cdr.markForCheck();
      },
    });
  }
}
