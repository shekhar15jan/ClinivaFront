import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MedicineService } from '../../../../core/services/medicine.service';
import { Medicine } from '../../../../core/models/medicine.model';
import { PaginatorComponent } from '../../../../shared/components/paginator/paginator.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-medicine-catalog',
  templateUrl: './medicine-catalog.html',
  styleUrl: './medicine-catalog.scss',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, PaginatorComponent, ConfirmDialogComponent],
})
export class MedicineCatalog implements OnInit {
  private medicineService = inject(MedicineService);
  private fb = inject(FormBuilder);

  medicines: Medicine[] = [];
  filteredMedicines: Medicine[] = [];
  isLoading = false;
  searchQuery = '';
  selectedCategory = '';
  totalElements = 0;
  currentPage = 0;
  pageSize = 20;

  showFormModal = false;
  editingMedicine: Medicine | null = null;
  medicineForm: FormGroup;
  isSubmitting = false;
  formError = '';

  showCsvUpload = false;
  csvFile: File | null = null;
  isUploading = false;
  uploadResult: string | null = null;

  showDeleteConfirm = false;
  deletingMedicine: Medicine | null = null;

  constructor() {
    this.medicineForm = this.fb.group({
      medicineName: ['', Validators.required],
      genericName: ['', Validators.required],
      category: ['Analgesic', Validators.required],
      manufacturer: ['', Validators.required],
      unit: ['tablet', Validators.required],
      price: ['', [Validators.required, Validators.min(0.01)]],
    });
  }

  ngOnInit(): void {
    this.loadMedicines();
  }

  loadMedicines(): void {
    this.isLoading = true;
    this.medicineService.getMedicines(this.currentPage, this.pageSize, this.searchQuery || undefined).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.medicines = res.data.content || [];
          this.totalElements = res.data.totalElements || 0;
          this.applyFilters();
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  onSearch(): void {
    this.currentPage = 0;
    if (this.searchQuery.trim().length > 1) {
      this.isLoading = true;
      this.medicineService.searchMedicines(this.searchQuery).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.medicines = res.data;
            this.totalElements = res.data.length;
            this.applyFilters();
          }
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        },
      });
    } else if (this.searchQuery.trim().length === 0) {
      this.loadMedicines();
    }
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let temp = [...this.medicines];
    if (this.selectedCategory) {
      temp = temp.filter((m) => m.category === this.selectedCategory);
    }
    this.filteredMedicines = temp;
  }

  onPageChange(event: { page: number; size: number }): void {
    this.currentPage = event.page;
    this.pageSize = event.size;
    if (this.searchQuery.trim().length > 1) {
      this.onSearch();
    } else {
      this.loadMedicines();
    }
  }

  openAddModal(): void {
    this.editingMedicine = null;
    this.medicineForm.reset({ category: 'Analgesic', unit: 'tablet' });
    this.formError = '';
    this.showFormModal = true;
  }

  openEditModal(med: Medicine): void {
    this.editingMedicine = med;
    this.medicineForm.patchValue({
      medicineName: med.medicineName,
      genericName: med.genericName,
      category: med.category,
      manufacturer: med.manufacturer,
      unit: med.unit,
      price: (med.priceInPaisa / 100).toFixed(2),
    });
    this.formError = '';
    this.showFormModal = true;
  }

  closeFormModal(): void {
    this.showFormModal = false;
    this.editingMedicine = null;
    this.formError = '';
  }

  submitForm(): void {
    if (this.medicineForm.invalid) {
      this.formError = 'Please fill all required fields';
      return;
    }
    this.isSubmitting = true;
    this.formError = '';
    const formVal = this.medicineForm.value;
    const payload: Partial<Medicine> = {
      medicineName: formVal.medicineName,
      genericName: formVal.genericName,
      category: formVal.category,
      manufacturer: formVal.manufacturer,
      unit: formVal.unit,
      priceInPaisa: Math.round(formVal.price * 100),
    };

    const request$ = this.editingMedicine
      ? this.medicineService.updateMedicine(this.editingMedicine.id, payload)
      : this.medicineService.createMedicine({ ...payload, isDiscontinued: false });

    request$.subscribe({
      next: () => {
        this.isSubmitting = false;
        this.closeFormModal();
        this.loadMedicines();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.formError = err?.message || 'Failed to save medicine';
      },
    });
  }

  openDeleteConfirm(med: Medicine): void {
    this.deletingMedicine = med;
    this.showDeleteConfirm = true;
  }

  confirmDelete(): void {
    if (!this.deletingMedicine) return;
    this.medicineService.deactivate(this.deletingMedicine.id).subscribe({
      next: () => this.loadMedicines(),
      error: (err) => console.error('Failed to deactivate medicine', err),
    });
  }

  closeDeleteConfirm(): void {
    this.showDeleteConfirm = false;
    this.deletingMedicine = null;
  }

  toggleCsvUpload(): void {
    this.showCsvUpload = !this.showCsvUpload;
    this.csvFile = null;
    this.uploadResult = null;
  }

  onCsvFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.csvFile = input.files[0];
      this.uploadResult = null;
    }
  }

  uploadCsv(): void {
    if (!this.csvFile) return;
    this.isUploading = true;
    this.medicineService.uploadMedicines(this.csvFile).subscribe({
      next: (res) => {
        if (res.success) {
          this.uploadResult = `Imported ${res.data?.imported || 0} medicines`;
          this.showCsvUpload = false;
          this.loadMedicines();
        }
        this.isUploading = false;
      },
      error: (err) => {
        this.uploadResult = err?.message || 'Upload failed';
        this.isUploading = false;
      },
    });
  }

  getPriceInRupees(priceInPaisa: number | undefined): string {
    return ((priceInPaisa || 0) / 100).toFixed(2);
  }
}
