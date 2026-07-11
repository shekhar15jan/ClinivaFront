import { Component, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { PatientService } from '../../../../core/services/patient.service';
import { Patient } from '../../../../core/models/patient.model';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-patient-list',
  templateUrl: './patient-list.html',
  styleUrl: './patient-list.scss',
  imports: [RouterLink, FormsModule, ReactiveFormsModule],
})
export class PatientList implements OnInit {
  private patientService = inject(PatientService);
  private fb = inject(FormBuilder);

  patients: Patient[] = [];
  isLoading = false;
  showAddModal = false;
  showCsvUpload = false;
  csvFile: File | null = null;
  isUploading = false;
  uploadResult: string | null = null;
  addForm: FormGroup;
  isSubmitting = false;

  constructor() {
    this.addForm = this.fb.group({
      fullName: ['', Validators.required],
      dateOfBirth: ['', Validators.required],
      gender: ['MALE', Validators.required],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      email: ['', Validators.email],
    });
  }

  ngOnInit(): void {
    this.loadPatients();
  }

  loadPatients() {
    this.isLoading = true;
    this.patientService.getPatients().subscribe({
      next: (res) => {
        if (res.success) {
          this.patients = res.data.content;
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  getInitials(name: string): string {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2);
  }

  toggleAddModal() {
    this.showAddModal = !this.showAddModal;
    if (!this.showAddModal) {
      this.addForm.reset({ gender: 'MALE' });
    }
  }

  toggleCsvUpload() {
    this.showCsvUpload = !this.showCsvUpload;
    this.csvFile = null;
    this.uploadResult = null;
  }

  onCsvFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.csvFile = input.files[0];
      this.uploadResult = null;
    }
  }

  uploadCsv() {
    if (!this.csvFile) return;
    this.isUploading = true;
    this.uploadResult = null;
    this.patientService.uploadPatients(this.csvFile).subscribe({
      next: (res) => {
        if (res.success) {
          this.uploadResult = `Imported ${res.data?.imported || 0} patients`;
          this.showCsvUpload = false;
          this.loadPatients();
        }
        this.isUploading = false;
      },
      error: (err) => {
        this.uploadResult = err?.message || 'Upload failed';
        this.isUploading = false;
      },
    });
  }

  onSubmitAdd() {
    if (this.addForm.invalid) return;
    this.isSubmitting = true;
    const formVal = this.addForm.value;
    const birthYear = new Date(formVal.dateOfBirth).getFullYear();
    const age = new Date().getFullYear() - birthYear;
    const newPatient: Partial<Patient> = { ...formVal, age };
    this.patientService.createPatient(newPatient).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.toggleAddModal();
        this.loadPatients();
      },
      error: () => {
        this.isSubmitting = false;
      },
    });
  }
}
