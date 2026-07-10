import { Component, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { MedicineService } from '../../../../core/services/medicine.service';
import { Medicine } from '../../../../core/models/medicine.model';

@Component({
  selector: 'app-medicine-catalog',
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-[#1E293B]">Medicine Catalog</h1>
        <button
          (click)="toggleAddModal()"
          class="bg-[#0052CC] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#003d9b] flex items-center gap-2"
        >
          <span class="material-symbols-outlined text-lg">add</span> Add Medicine
        </button>
      </div>

      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="p-4 border-b border-gray-100 flex gap-3 flex-wrap">
          <div class="relative flex-1 min-w-[200px]">
            <span
              class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg"
              >search</span
            >
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (input)="onSearch()"
              placeholder="Search medicines by name or generic..."
              class="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0052CC]"
            />
          </div>
          <select
            [(ngModel)]="selectedCategory"
            (change)="onFilterChange()"
            class="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0052CC]"
          >
            <option value="">All Categories</option>
            <option>Antibiotic</option>
            <option>Analgesic</option>
            <option>Antihistamine</option>
            <option>Antacid</option>
            <option>Vitamin</option>
          </select>
        </div>

        <table class="w-full">
          <thead>
            <tr class="bg-[#F8FAFC] text-left">
              <th class="px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">
                Medicine Name
              </th>
              <th class="px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Generic Name</th>
              <th class="px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Category</th>
              <th class="px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Manufacturer</th>
              <th class="px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Price</th>
              <th class="px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            @if (isLoading) {
              <tr>
                <td colspan="6" class="px-4 py-8 text-center text-sm text-[#64748B]">
                  Loading medicines...
                </td>
              </tr>
            }
            @if (!isLoading && medicines.length === 0) {
              <tr>
                <td colspan="6" class="px-4 py-8 text-center text-sm text-[#64748B]">
                  No medicines found.
                </td>
              </tr>
            }
            @for (med of filteredMedicines; track med) {
              <tr class="border-t border-gray-100 hover:bg-[#F8FAFC]">
                <td class="px-4 py-3 text-sm font-medium text-[#1E293B]">{{ med.name }}</td>
                <td class="px-4 py-3 text-sm text-[#64748B]">{{ med.genericName }}</td>
                <td class="px-4 py-3">
                  <span
                    class="bg-[#EEF2FF] text-[#0052CC] px-2.5 py-0.5 rounded-full text-xs font-medium"
                    >{{ med.category }}</span
                  >
                </td>
                <td class="px-4 py-3 text-sm text-[#475569]">{{ med.manufacturer }}</td>
                <td class="px-4 py-3 text-sm font-medium text-[#1E293B]">
                  ₹{{ med.priceInPaisa / 100 }}
                </td>
                <td class="px-4 py-3">
                  <span
                    [class]="
                      med.isActive ? 'bg-[#ECFDF5] text-[#059669]' : 'bg-[#FEF2F2] text-[#DC2626]'
                    "
                    class="px-2.5 py-1 rounded-full text-xs font-medium"
                  >
                    {{ med.isActive ? 'In Stock' : 'Discontinued' }}
                  </span>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add Medicine Modal -->
    @if (showAddModal) {
      <div
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in"
      >
        <div
          class="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100"
        >
          <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 class="text-base font-bold text-[#1E293B]">Add New Medicine</h3>
            <button (click)="toggleAddModal()" class="text-gray-400 hover:text-gray-600">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
          <form [formGroup]="addForm" (ngSubmit)="onSubmitAdd()" class="p-6 space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="medName" class="block text-sm font-medium text-[#475569] mb-1">Medicine Name *</label>
                <input
                  id="medName"
                  type="text"
                  formControlName="name"
                  placeholder="Paracetamol 500mg"
                  class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0052CC]"
                />
              </div>
              <div>
                <label for="medGenericName" class="block text-sm font-medium text-[#475569] mb-1">Generic Name *</label>
                <input
                  id="medGenericName"
                  type="text"
                  formControlName="genericName"
                  placeholder="Acetaminophen"
                  class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0052CC]"
                />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="medCategory" class="block text-sm font-medium text-[#475569] mb-1">Category *</label>
                <select
                  id="medCategory"
                  formControlName="category"
                  class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0052CC]"
                >
                  <option value="Analgesic">Analgesic</option>
                  <option value="Antibiotic">Antibiotic</option>
                  <option value="Antihistamine">Antihistamine</option>
                  <option value="Antacid">Antacid</option>
                  <option value="Vitamin">Vitamin</option>
                </select>
              </div>
              <div>
                <label for="medManufacturer" class="block text-sm font-medium text-[#475569] mb-1">Manufacturer *</label>
                <input
                  id="medManufacturer"
                  type="text"
                  formControlName="manufacturer"
                  placeholder="Cipla / Sun Pharma"
                  class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0052CC]"
                />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="medUnit" class="block text-sm font-medium text-[#475569] mb-1">Unit *</label>
                <input
                  id="medUnit"
                  type="text"
                  formControlName="unit"
                  placeholder="tablet / capsule / syrup"
                  class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0052CC]"
                />
              </div>
              <div>
                <label for="medPrice" class="block text-sm font-medium text-[#475569] mb-1">Price (₹) *</label>
                <input
                  id="medPrice"
                  type="number"
                  formControlName="price"
                  placeholder="10.00"
                  class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0052CC]"
                />
              </div>
            </div>
            <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                (click)="toggleAddModal()"
                class="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="addForm.invalid || isSubmitting"
                class="bg-[#0052CC] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#003d9b] disabled:opacity-50"
              >
                {{ isSubmitting ? 'Adding...' : 'Add Medicine' }}
              </button>
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
  addForm: FormGroup;
  isSubmitting = false;

  constructor() {
    this.addForm = this.fb.group({
      name: ['', Validators.required],
      genericName: ['', Validators.required],
      category: ['Analgesic', Validators.required],
      manufacturer: ['', Validators.required],
      unit: ['tablet', Validators.required],
      price: ['', [Validators.required, Validators.min(0.01)]],
    });
  }

  ngOnInit() {
    this.loadMedicines();
  }

  loadMedicines() {
    this.isLoading = true;
    this.medicineService.getMedicines().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.medicines = res.data.content || [];
          this.applyFilters();
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  onSearch() {
    if (this.searchQuery.trim().length > 1) {
      this.medicineService.searchMedicines(this.searchQuery).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.medicines = res.data || [];
            this.applyFilters();
          }
        },
      });
    } else if (this.searchQuery.trim().length === 0) {
      this.loadMedicines();
    }
  }

  onFilterChange() {
    this.applyFilters();
  }

  applyFilters() {
    let temp = [...this.medicines];
    if (this.selectedCategory) {
      temp = temp.filter((m) => m.category === this.selectedCategory);
    }
    this.filteredMedicines = temp;
  }

  toggleAddModal() {
    this.showAddModal = !this.showAddModal;
    if (!this.showAddModal) {
      this.addForm.reset({ category: 'Analgesic', unit: 'tablet' });
    }
  }

  onSubmitAdd() {
    if (this.addForm.invalid) return;

    this.isSubmitting = true;
    const formVal = this.addForm.value;

    const newMed: Partial<Medicine> = {
      name: formVal.name,
      genericName: formVal.genericName,
      category: formVal.category,
      manufacturer: formVal.manufacturer,
      unit: formVal.unit,
      priceInPaisa: Math.round(formVal.price * 100),
      isActive: true,
    };

    this.medicineService.createMedicine(newMed).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.toggleAddModal();
        this.loadMedicines();
      },
      error: () => {
        this.isSubmitting = false;
      },
    });
  }
}
