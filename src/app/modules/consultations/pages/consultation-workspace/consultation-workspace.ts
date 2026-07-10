import { Component, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';

@Component({
  selector: 'app-consultation-workspace',
  templateUrl: './consultation-workspace.html',
  styleUrl: './consultation-workspace.scss',
  imports: [FormsModule, ReactiveFormsModule],
})
export class ConsultationWorkspace implements OnInit {
  private fb = inject(FormBuilder);

  consultationForm: FormGroup;

  constructor() {
    this.consultationForm = this.fb.group({
      notes: this.fb.group({
        chiefComplaint: [''],
        vitals: this.fb.group({
          bp: [''],
          temp: [''],
          pulse: [''],
          weight: [''],
        }),
        diagnosis: [''],
      }),
      medicines: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    // Add one empty medicine by default
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
    if (frequency === 'SOS') {
      timesPerDay = 1;
    } else {
      timesPerDay = frequency.split('-').reduce((acc, curr) => acc + parseInt(curr || '0', 10), 0);
    }

    return `${timesPerDay * duration} Tabs`;
  }

  finishAndPrint(): void {
    if (this.consultationForm.invalid) {
      alert('Please fill out required fields');
      return;
    }
    console.log('Consultation Data:', this.consultationForm.value);
    alert('Consultation saved successfully!');
  }
}
