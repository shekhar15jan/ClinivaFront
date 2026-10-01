import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { PatientService } from '../../../../core/services/patient.service';
import { Patient } from '../../../../core/models/patient.model';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-patient-list',
  templateUrl: './patient-list.html',
  styleUrl: './patient-list.scss',
  imports: [RouterLink, FormsModule, ReactiveFormsModule],
})
export class PatientList implements OnInit, OnDestroy {
  private patientService = inject(PatientService);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  /** The page on screen. Paging and search run on the server: a clinic can have tens of thousands of patients. */
  patients: Patient[] = [];
  page = 0;
  totalPages = 1;
  totalElements = 0;
  searchQuery = '';
  private searchTimer?: ReturnType<typeof setTimeout>;
  isLoading = false;
  showAddModal = false;
  showCsvUpload = false;
  csvFile: File | null = null;
  isUploading = false;
  uploadIssues: string[] = [];
  uploadFailed = false;
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
    // The header search opens this screen with ?q=...; a new search there while on this screen reloads it.
    this.route.queryParamMap.subscribe((params) => {
      this.searchQuery = params.get('q') ?? this.searchQuery;
      this.loadPatients(0);
    });
  }

  ngOnDestroy(): void {
    clearTimeout(this.searchTimer);
  }

  /** Registering patients is for the front desk and administrators (the API refuses others). */
  get canAdd(): boolean {
    const role = this.auth.currentUserValue?.role;
    return role === 'ADMIN' || role === 'RECEPTIONIST';
  }

  /** CSV import is for administrators only. */
  get canImport(): boolean {
    return this.auth.currentUserValue?.role === 'ADMIN';
  }

  get firstShown(): number {
    return this.totalElements === 0 ? 0 : this.page * PAGE_SIZE + 1;
  }

  get lastShown(): number {
    return this.page * PAGE_SIZE + this.patients.length;
  }

  loadPatients(page = this.page) {
    this.isLoading = true;
    const query = this.searchQuery.trim();
    const request = query ? this.patientService.searchPatients(query, page, PAGE_SIZE)
      : this.patientService.getPatients(page, PAGE_SIZE);
    request.subscribe({
      next: (res) => {
        if (res.success) {
          this.patients = res.data.content;
          this.page = res.data.pageNumber;
          this.totalPages = Math.max(1, res.data.totalPages);
          this.totalElements = res.data.totalElements;
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  /** Searches once typing pauses, from the first page. */
  onSearchInput(): void {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.loadPatients(0), 300);
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages || page === this.page) return;
    this.loadPatients(page);
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
    this.uploadIssues = [];
    this.uploadFailed = false;
    this.patientService.uploadPatients(this.csvFile).subscribe({
      next: (res) => {
        this.isUploading = false;
        if (res.success) {
          const data = res.data as { imported?: number; skipped?: number; errors?: string[] } | undefined;
          const imported = data?.imported ?? 0;
          const skipped = data?.skipped ?? 0;
          // Say what was left out and why; before, only the imported count was shown.
          this.uploadResult = `Imported ${imported} ${imported === 1 ? 'patient' : 'patients'}${skipped ? `, skipped ${skipped}` : ''}.`;
          this.uploadIssues = (data?.errors ?? []).slice(0, 10);
          this.showCsvUpload = false;
          this.csvFile = null;
          this.loadPatients(0);
        } else {
          this.uploadFailed = true;
          this.uploadResult = res.message || 'The file could not be imported.';
        }
      },
      error: (err) => {
        this.isUploading = false;
        this.uploadFailed = true;
        this.uploadResult = err?.error?.message || 'The file could not be imported.';
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
        this.loadPatients(0);
      },
      error: () => {
        this.isSubmitting = false;
      },
    });
  }
}
