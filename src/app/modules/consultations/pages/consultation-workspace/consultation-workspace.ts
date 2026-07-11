import { Component, OnInit, inject } from '@angular/core';
import {
  FormBuilder, FormGroup, FormArray, Validators, FormsModule, ReactiveFormsModule,
} from '@angular/forms';
import { ConsultationService } from '../../../../core/services/consultation.service';

@Component({
  selector: 'app-consultation-workspace',
  templateUrl: './consultation-workspace.html',
  styleUrl: './consultation-workspace.scss',
  imports: [FormsModule, ReactiveFormsModule],
})
export class ConsultationWorkspace implements OnInit {
  private fb = inject(FormBuilder);
  private consultationService = inject(ConsultationService);

  consultationForm: FormGroup;
  isSubmitting = false;
  error = '';

  constructor() {
    this.consultationForm = this.fb.group({
      notes: this.fb.group({
        chiefComplaint: [''],
        vitals: this.fb.group({ bp: [''], temp: [''], pulse: [''], weight: [''], }),
        diagnosis: [''],
      }),
      medicines: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    this.addMedicine();
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
    this.medicines.push(this.createMedicineFormGroup());
  }

  removeMedicine(index: number): void {
    this.medicines.removeAt(index);
  }

  calculateTotal(frequency: string, duration: number): string {
    if (!frequency || !duration) return '0 Tabs';
    let timesPerDay: number;
    if (frequency === 'SOS') { timesPerDay = 1; }
    else { timesPerDay = frequency.split('-').reduce((acc, curr) => acc + parseInt(curr || '0', 10), 0); }
    return `${timesPerDay * duration} Tabs`;
  }

  finishAndPrint(): void {
    if (this.consultationForm.invalid) {
      this.error = 'Please fill out required fields';
      return;
    }
    this.isSubmitting = true;
    this.error = '';
    const formVal = this.consultationForm.value;

    this.consultationService.createConsultation({
      appointmentId: '',
      chiefComplaints: formVal.notes?.chiefComplaint || '',
      examinationFindings: '',
      diagnosis: formVal.notes?.diagnosis || '',
      clinicalNotes: '',
      vitals: {
        bloodPressureSystolic: parseInt(formVal.notes?.vitals?.bp?.split('/')[0]) || undefined,
        bloodPressureDiastolic: parseInt(formVal.notes?.vitals?.bp?.split('/')[1]) || undefined,
        temperature: parseFloat(formVal.notes?.vitals?.temp) || undefined,
        weight: parseFloat(formVal.notes?.vitals?.weight) || undefined,
        pulse: parseInt(formVal.notes?.vitals?.pulse) || undefined,
      },
    }).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        if (res.success) {
          this.consultationForm.reset();
          this.medicines.clear();
          this.addMedicine();
        } else {
          this.error = 'Failed to save consultation';
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.error = err?.message || 'Error saving consultation';
      },
    });
  }
}
