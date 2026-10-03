import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DepartmentService } from '../../core/services/department.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { Department } from '../../core/models/department.model';

/** Colours for department cards, so a ward list is not a wall of white. */
const ACCENTS = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#db2777', '#0891b2', '#dc2626', '#4f46e5'];

/**
 * The clinic's departments: who belongs to each (doctors and staff are placed from the Doctors and Users screens),
 * and, for the owner, department access: clinicians see the clinical records of their own department's patients.
 */
@Component({
  selector: 'app-department-list',
  standalone: true,
  imports: [FormsModule, ConfirmDialogComponent],
  template: `
    <div class="p-4 sm:p-6 max-w-5xl">
      <div class="flex items-start justify-between flex-wrap gap-3 mb-5">
        <div>
          <h1 class="text-2xl font-semibold text-on-surface">Departments</h1>
          <p class="text-sm text-slate-600 mt-1">Medicine, Surgery, Paediatrics… Doctors are placed from their profile, other staff from Users.</p>
        </div>
        @if (!adding) {
          <button type="button" id="add-department" (click)="startAdd()"
            class="px-4 min-h-touch text-sm font-semibold text-white bg-primary rounded-lg flex items-center gap-1">
            <span class="material-symbols-outlined text-lg">add</span> Add department
          </button>
        }
      </div>

      @if (canSetAccess) {
        <div class="mb-5 rounded-xl border p-4 flex flex-wrap items-center gap-4"
          [class]="scoping ? 'border-blue-300 bg-blue-50' : 'border-outline-variant bg-white'" id="department-access">
          <span class="material-symbols-outlined" [class]="scoping ? 'text-blue-700' : 'text-slate-500'">shield_person</span>
          <div class="flex-1 min-w-[220px]">
            <p class="text-sm font-semibold text-on-surface">Department access is {{ scoping ? 'on' : 'off' }}</p>
            <p class="text-sm text-slate-600">
              @if (scoping) {
                Doctors and nurses in a department see clinical records of their department's patients. Anyone else needs emergency access, which is logged for review. Staff with no department stay clinic-wide.
              } @else {
                Everyone with clinical access sees every patient. Turn this on when the hospital has departments.
              }
            </p>
          </div>
          <button type="button" id="toggle-scoping" (click)="toggleScoping()" [disabled]="savingScoping"
            class="px-4 min-h-touch text-sm font-semibold rounded-lg border disabled:opacity-50"
            [class]="scoping ? 'border-blue-300 bg-white text-blue-800' : 'border-transparent bg-primary text-white'">
            {{ scoping ? 'Turn off' : 'Turn on' }}
          </button>
        </div>
      }

      @if (adding || editing) {
        <form class="mb-5 bg-white rounded-xl border border-outline-variant p-4 space-y-3" id="department-form" (ngSubmit)="save()">
          <h2 class="text-base font-semibold text-on-surface">{{ editing ? 'Edit department' : 'New department' }}</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label for="department-name" class="block text-sm font-medium mb-1">Name *</label>
              <input id="department-name" name="name" [(ngModel)]="name" maxlength="80" required
                class="w-full border border-outline-variant rounded-lg p-2.5 text-sm" placeholder="e.g. Cardiology" />
            </div>
            <div>
              <label for="department-description" class="block text-sm font-medium mb-1">Description</label>
              <input id="department-description" name="description" [(ngModel)]="description" maxlength="255"
                class="w-full border border-outline-variant rounded-lg p-2.5 text-sm" placeholder="Optional" />
            </div>
          </div>
          @if (formError) {
            <p class="text-sm text-status-red" id="department-error">{{ formError }}</p>
          }
          <div class="flex gap-2">
            <button type="submit" id="save-department" [disabled]="name.trim().length < 2 || saving"
              class="px-5 min-h-touch text-sm font-semibold text-white bg-primary rounded-lg disabled:opacity-50">
              {{ saving ? 'Saving…' : 'Save' }}
            </button>
            <button type="button" (click)="cancel()" class="px-4 min-h-touch text-sm border border-outline-variant rounded-lg">Cancel</button>
          </div>
        </form>
      }

      @if (loadError) {
        <div class="p-3 rounded-lg bg-red-50 text-sm text-red-700" id="departments-error">{{ loadError }}</div>
      } @else if (loading) {
        <p class="text-sm text-slate-600">Loading departments…</p>
      } @else if (departments.length === 0) {
        <div class="bg-white rounded-xl border border-dashed border-outline-variant p-8 text-center" id="no-departments">
          <span class="material-symbols-outlined text-4xl text-slate-400">domain</span>
          <p class="text-sm text-slate-600 mt-2">No departments yet. A small clinic does not need any; a hospital adds one per speciality.</p>
        </div>
      } @else {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" id="departments">
          @for (d of departments; track d.id; let i = $index) {
            <div class="bg-white rounded-xl border border-outline-variant p-4 border-l-4" [style.border-left-color]="accent(i)" [attr.data-name]="d.name">
              <div class="flex items-start justify-between gap-2">
                <h3 class="text-base font-semibold text-on-surface">{{ d.name }}</h3>
                <div class="flex gap-1">
                  <button type="button" (click)="startEdit(d)" [attr.aria-label]="'Edit ' + d.name"
                    class="p-2 rounded-lg text-slate-600 hover:bg-surface-container-high">
                    <span class="material-symbols-outlined text-lg">edit</span>
                  </button>
                  <button type="button" (click)="toDelete = d" [attr.aria-label]="'Delete ' + d.name"
                    class="p-2 rounded-lg text-status-red hover:bg-red-50">
                    <span class="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              </div>
              @if (d.description) {
                <p class="text-sm text-slate-600 mt-1">{{ d.description }}</p>
              }
              <div class="flex gap-2 mt-3 text-xs font-medium">
                <span class="px-2.5 py-1 rounded-full bg-blue-50 text-blue-800">{{ d.doctorCount }} {{ d.doctorCount === 1 ? 'doctor' : 'doctors' }}</span>
                <span class="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800">{{ d.staffCount }} staff</span>
              </div>
            </div>
          }
        </div>
      }
    </div>

    <app-confirm-dialog
      [open]="!!toDelete"
      title="Delete department"
      [message]="'Delete ' + (toDelete?.name ?? '') + '? Only an empty department can be deleted.'"
      confirmText="Delete"
      [isDestructive]="true"
      (confirmed)="remove()"
      (cancelled)="toDelete = null"
    />
  `,
})
export class DepartmentListComponent implements OnInit {
  private service = inject(DepartmentService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  departments: Department[] = [];
  loading = false;
  loadError = '';

  adding = false;
  editing: Department | null = null;
  name = '';
  description = '';
  saving = false;
  formError = '';
  toDelete: Department | null = null;

  scoping = false;
  savingScoping = false;

  /** The switch is the owner's (clinic settings). */
  get canSetAccess(): boolean {
    return this.auth.can('CLINIC_SETTINGS');
  }

  ngOnInit(): void {
    this.load();
    if (this.canSetAccess) {
      this.service.getAccessSettings().subscribe({ next: (s) => (this.scoping = s.departmentScoping) });
    }
  }

  load(): void {
    this.loading = true;
    this.loadError = '';
    this.service.getDepartments().subscribe({
      next: (list) => {
        this.departments = list;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.loadError = err?.error?.message || 'The departments could not be loaded.';
      },
    });
  }

  accent(i: number): string {
    return ACCENTS[i % ACCENTS.length];
  }

  startAdd(): void {
    this.editing = null;
    this.adding = true;
    this.name = '';
    this.description = '';
    this.formError = '';
  }

  startEdit(d: Department): void {
    this.adding = false;
    this.editing = d;
    this.name = d.name;
    this.description = d.description ?? '';
    this.formError = '';
  }

  cancel(): void {
    this.adding = false;
    this.editing = null;
  }

  save(): void {
    if (this.name.trim().length < 2 || this.saving) return;
    this.saving = true;
    this.formError = '';
    const request = { name: this.name.trim(), description: this.description.trim() || null };
    const call = this.editing ? this.service.update(this.editing.id, request) : this.service.create(request);
    call.subscribe({
      next: (d) => {
        this.saving = false;
        this.toast.success(`${d.name} saved`);
        this.cancel();
        this.load();
      },
      error: (err) => {
        this.saving = false;
        this.formError = err?.error?.message || 'The department could not be saved.';
      },
    });
  }

  remove(): void {
    const d = this.toDelete;
    this.toDelete = null;
    if (!d) return;
    this.service.delete(d.id).subscribe({
      next: () => {
        this.toast.success(`${d.name} deleted`);
        this.load();
      },
      error: (err) => this.toast.error(err?.error?.message || 'The department could not be deleted.'),
    });
  }

  toggleScoping(): void {
    if (this.savingScoping) return;
    this.savingScoping = true;
    this.service.saveAccessSettings(!this.scoping).subscribe({
      next: (s) => {
        this.savingScoping = false;
        this.scoping = s.departmentScoping;
        this.toast.success(s.departmentScoping ? 'Department access is on' : 'Department access is off');
      },
      error: (err) => {
        this.savingScoping = false;
        this.toast.error(err?.error?.message || 'The setting could not be saved.');
      },
    });
  }
}
