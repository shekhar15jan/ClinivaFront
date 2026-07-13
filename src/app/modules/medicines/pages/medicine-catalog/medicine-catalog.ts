import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MedicineService } from '../../../../core/services/medicine.service';
import { Medicine } from '../../../../core/models/medicine.model';

@Component({
  selector: 'app-medicine-catalog',
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-on-surface">Medicine Catalog</h1>
        <div class="flex items-center gap-2">
          <button (click)="toggleCsvUpload()" class="px-4 py-2 rounded-lg text-sm font-medium border border-outline-variant text-on-surface-variant hover:bg-surface-container-high flex items-center gap-2">
            <span class="material-symbols-outlined text-lg">upload_file</span> Import CSV
          </button>
          <button (click)="toggleAddModal()" class="bg-primary text-primary-on px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-light flex items-center gap-2">
            <span class="material-symbols-outlined text-lg">add</span> Add Medicine
          </button>
        </div>
      </div>

      @if (showCsvUpload) {
        <div class="mb-6 border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
          <p class="text-sm font-medium text-gray-700 mb-3">Upload Medicines CSV</p>
          <input #csvInput type="file" accept=".csv" (change)="onCsvFileSelected($event)" class="hidden" />
          <button (click)="csvInput.click()" class="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50">Select File</button>
          @if (csvFile) {
            <p class="mt-2 text-sm text-gray-600">{{ csvFile.name }} ({{ (csvFile.size / 1024).toFixed(1) }} KB)</p>
            <button (click)="uploadCsv()" [disabled]="isUploading" class="mt-3 px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">{{ isUploading ? 'Uploading...' : 'Upload' }}</button>
          }
          @if (uploadResult) {
            <p class="mt-3 text-sm" [class.text-green-600]="!uploadResult.includes('fail')" [class.text-red-600]="uploadResult.includes('fail')">{{ uploadResult }}</p>
          }
          <button (click)="toggleCsvUpload()" class="mt-3 block w-full text-sm text-gray-500 hover:text-gray-700">Cancel</button>
        </div>
      }

      <div class="bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden">
        <div class="p-4 border-b border-outline-variant flex gap-3 flex-wrap">
          <div class="relative flex-1 min-w-[200px]">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
            <input type="text" [(ngModel)]="searchQuery" (input)="onSearch()" placeholder="Search medicines by name or generic..." class="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-primary-light bg-surface-container-lowest text-on-surface" />
          </div>
          <select [(ngModel)]="selectedCategory" (change)="onFilterChange()" class="px-3 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-primary-light bg-surface-container-lowest text-on-surface">
            <option value="">All Categories</option>
            <option>Antibiotic</option><option>Analgesic</option><option>Antihistamine</option><option>Antacid</option><option>Vitamin</option>
          </select>
        </div>
        <div class="hidden md:block overflow-x-auto">
          <table class="w-full"><thead><tr class="bg-surface-container text-left"><th class="px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase">Medicine Name</th><th class="px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase">Generic Name</th><th class="px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase">Category</th><th class="px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase">Manufacturer</th><th class="px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase">Price</th><th class="px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase">Status</th></tr></thead>
            <tbody>
              @if (isLoading) { <tr><td colspan="6" class="px-4 py-8 text-center text-sm text-on-surface-variant">Loading medicines...</td></tr> }
              @if (!isLoading && medicines.length === 0) { <tr><td colspan="6" class="px-4 py-8 text-center text-sm text-on-surface-variant">No medicines found.</td></tr> }
              @for (med of filteredMedicines; track med) {
                <tr class="border-t border-outline-variant hover:bg-surface-container">
                  <td class="px-4 py-3 text-sm font-medium text-on-surface">{{ med.medicineName }}</td>
                  <td class="px-4 py-3 text-sm text-on-surface-variant">{{ med.genericName }}</td>
                  <td class="px-4 py-3"><span class="bg-primary-container text-primary-on-container px-2.5 py-0.5 rounded-full text-xs font-medium">{{ med.category }}</span></td>
                  <td class="px-4 py-3 text-sm text-on-surface-variant">{{ med.manufacturer }}</td>
                  <td class="px-4 py-3 text-sm font-medium text-on-surface">₹{{ (med.priceInPaisa || 0) / 100 }}</td>
                  <td class="px-4 py-3"><span [class]="!med.isDiscontinued ? 'bg-status-green-light text-status-green' : 'bg-status-red-light text-status-red'" class="px-2.5 py-1 rounded-full text-xs font-medium">{{ !med.isDiscontinued ? 'In Stock' : 'Discontinued' }}</span></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div class="md:hidden">
          @if (isLoading) { <div class="px-4 py-8 text-center text-sm text-on-surface-variant">Loading medicines...</div> }
          @if (!isLoading && medicines.length === 0) { <div class="px-4 py-8 text-center text-sm text-on-surface-variant">No medicines found.</div> }
          @if (!isLoading && filteredMedicines.length > 0) {
            <div class="p-4 grid gap-3">
              @for (med of filteredMedicines; track med) {
                <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 space-y-2">
                  <div class="flex items-start justify-between gap-2"><div class="flex-1 min-w-0"><h3 class="text-sm font-semibold text-primary truncate">{{ med.medicineName }}</h3><p class="text-xs text-on-surface-variant mt-0.5">{{ med.genericName }}</p></div><span class="bg-primary-container text-primary-on-container px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap shrink-0">{{ med.category }}</span></div>
                  <div class="flex items-center justify-between pt-1"><span class="text-sm font-semibold text-on-surface">₹{{ (med.priceInPaisa || 0) / 100 }}</span><span [class]="!med.isDiscontinued ? 'bg-status-green-light text-status-green' : 'bg-status-red-light text-status-red'" class="px-2.5 py-1 rounded-full text-xs font-medium">{{ !med.isDiscontinued ? 'In Stock' : 'Discontinued' }}</span></div>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>

    @if (showAddModal) {
      <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="bg-surface-container-lowest rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-outline-variant">
          <div class="px-6 py-4 border-b border-outline-variant flex items-center justify-between"><h3 class="text-base font-bold text-on-surface">Add New Medicine</h3><button (click)="toggleAddModal()" class="text-on-surface-variant hover:text-on-surface"><span class="material-symbols-outlined">close</span></button></div>
          <form [formGroup]="addForm" (ngSubmit)="onSubmitAdd()" class="p-6 space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div><label for="medName" class="block text-sm font-medium text-on-surface-variant mb-1">Medicine Name *</label><input id="medName" type="text" formControlName="medicineName" class="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-primary-light bg-surface-container-lowest text-on-surface" /></div>
              <div><label for="medGenericName" class="block text-sm font-medium text-on-surface-variant mb-1">Generic Name *</label><input id="medGenericName" type="text" formControlName="genericName" class="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-primary-light bg-surface-container-lowest text-on-surface" /></div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div><label for="medCategory" class="block text-sm font-medium text-on-surface-variant mb-1">Category *</label><select id="medCategory" formControlName="category" class="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-primary-light bg-surface-container-lowest text-on-surface"><option>Analgesic</option><option>Antibiotic</option><option>Antihistamine</option><option>Antacid</option><option>Vitamin</option></select></div>
              <div><label for="medManufacturer" class="block text-sm font-medium text-on-surface-variant mb-1">Manufacturer *</label><input id="medManufacturer" type="text" formControlName="manufacturer" class="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-primary-light bg-surface-container-lowest text-on-surface" /></div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div><label for="medUnit" class="block text-sm font-medium text-on-surface-variant mb-1">Unit *</label><input id="medUnit" type="text" formControlName="unit" class="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-primary-light bg-surface-container-lowest text-on-surface" /></div>
              <div><label for="medPrice" class="block text-sm font-medium text-on-surface-variant mb-1">Price (₹) *</label><input id="medPrice" type="number" formControlName="price" class="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-primary-light bg-surface-container-lowest text-on-surface" /></div>
            </div>
            <div class="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant">
              <button type="button" (click)="toggleAddModal()" class="px-4 py-2 text-sm font-medium text-on-surface-variant hover:text-on-surface">Cancel</button>
              <button type="submit" [disabled]="addForm.invalid || isSubmitting" class="bg-primary text-primary-on px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary-light disabled:opacity-50">{{ isSubmitting ? 'Adding...' : 'Add Medicine' }}</button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  imports: [FormsModule, ReactiveFormsModule],
})
export class MedicineCatalog implements OnInit {
  private medicineService = inject(MedicineService);
  private fb = inject(FormBuilder);

  medicines: Medicine[] = [];
  filteredMedicines: Medicine[] = [];
  isLoading = false;
  searchQuery = '';
  selectedCategory = '';
  showAddModal = false;
  showCsvUpload = false;
  csvFile: File | null = null;
  isUploading = false;
  uploadResult: string | null = null;
  addForm: FormGroup;
  isSubmitting = false;

  constructor() {
    this.addForm = this.fb.group({
      medicineName: ['', Validators.required], genericName: ['', Validators.required],
      category: ['Analgesic', Validators.required], manufacturer: ['', Validators.required],
      unit: ['tablet', Validators.required], price: ['', [Validators.required, Validators.min(0.01)]],
    });
  }

  ngOnInit() { this.loadMedicines(); }

  loadMedicines() {
    this.isLoading = true;
    this.medicineService.getMedicines().subscribe({
      next: (res) => {
        if (res.success && res.data) { this.medicines = res.data.content || []; this.applyFilters(); }
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; },
    });
  }

  onSearch() {
    if (this.searchQuery.trim().length > 1) {
      this.medicineService.searchMedicines(this.searchQuery).subscribe({
        next: (res) => { if (res.success && res.data) { this.medicines = res.data || []; this.applyFilters(); } },
      });
    } else if (this.searchQuery.trim().length === 0) { this.loadMedicines(); }
  }

  onFilterChange() { this.applyFilters(); }
  applyFilters() {
    let temp = [...this.medicines];
    if (this.selectedCategory) { temp = temp.filter((m) => m.category === this.selectedCategory); }
    this.filteredMedicines = temp;
  }

  toggleAddModal() { this.showAddModal = !this.showAddModal; if (!this.showAddModal) { this.addForm.reset({ category: 'Analgesic', unit: 'tablet' }); } }
  toggleCsvUpload() { this.showCsvUpload = !this.showCsvUpload; this.csvFile = null; this.uploadResult = null; }

  onCsvFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) { this.csvFile = input.files[0]; this.uploadResult = null; }
  }

  uploadCsv() {
    if (!this.csvFile) return;
    this.isUploading = true;
    this.medicineService.uploadMedicines(this.csvFile).subscribe({
      next: (res) => {
        if (res.success) { this.uploadResult = `Imported ${res.data?.imported || 0} medicines`; this.showCsvUpload = false; this.loadMedicines(); }
        this.isUploading = false;
      },
      error: (err) => { this.uploadResult = err?.message || 'Upload failed'; this.isUploading = false; },
    });
  }

  onSubmitAdd() {
    if (this.addForm.invalid) return;
    this.isSubmitting = true;
    const formVal = this.addForm.value;
    const newMed: Partial<Medicine> = { medicineName: formVal.medicineName, genericName: formVal.genericName, category: formVal.category, manufacturer: formVal.manufacturer, unit: formVal.unit, priceInPaisa: Math.round(formVal.price * 100), isDiscontinued: false };
    this.medicineService.createMedicine(newMed).subscribe({
      next: () => { this.isSubmitting = false; this.toggleAddModal(); this.loadMedicines(); },
      error: () => { this.isSubmitting = false; },
    });
  }
}
