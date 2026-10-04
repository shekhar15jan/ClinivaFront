import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IpdService } from '../../core/services/ipd.service';
import { AuthService } from '../../core/services/auth.service';
import { DepartmentService } from '../../core/services/department.service';
import { EffectiveLicenseService } from '../../core/services/effective-license.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { Department } from '../../core/models/department.model';
import { BedView, WARD_TYPES, WardType, WardView, labelOf, rupees } from '../../core/models/ipd.model';

/**
 * Wards and beds, set up once: the ward's type and daily bed charge, and its beds by number ("G-1" to "G-20" in one
 * go). A new charge applies from the next admission or move; patients already in keep theirs.
 */
@Component({
  selector: 'app-ward-setup',
  standalone: true,
  imports: [FormsModule, RouterLink, ConfirmDialogComponent],
  template: `
    <div class="p-4 sm:p-6 max-w-5xl">
      <a routerLink=".." class="text-sm text-primary flex items-center gap-1 mb-3"><span class="material-symbols-outlined text-lg">arrow_back</span> Bed board</a>
      @if (!allowed) {
        <p class="p-3 rounded-lg bg-amber-50 text-sm text-amber-900" id="ward-setup-denied">Setting up wards and beds is for the hospital admin.</p>
      } @else {
      <div class="flex items-start justify-between flex-wrap gap-3 mb-4">
        <div>
          <h1 class="text-2xl font-semibold text-on-surface">Wards & beds</h1>
          <p class="text-sm text-slate-600 mt-1">The daily bed charge is per ward. Patients already in a bed keep the charge they came in at.</p>
        </div>
        @if (!form) {
          <button type="button" id="add-ward" (click)="startWard(null)" class="px-4 min-h-touch text-sm font-semibold text-white bg-primary rounded-lg flex items-center gap-1">
            <span class="material-symbols-outlined text-lg">add</span> Add ward
          </button>
        }
      </div>

      @if (form) {
        <form class="mb-5 bg-white rounded-xl border border-outline-variant p-4 space-y-3" id="ward-form" (ngSubmit)="saveWard()">
          <h2 class="font-semibold">{{ editing ? 'Edit ' + editing.name : 'New ward' }}</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label for="ward-name" class="block text-sm font-medium mb-1">Name *</label>
              <input id="ward-name" name="name" [(ngModel)]="name" maxlength="80" class="w-full border border-outline-variant rounded-lg p-2.5 text-sm" placeholder="e.g. General Ward A" />
            </div>
            <div>
              <label for="ward-rate" class="block text-sm font-medium mb-1">Bed charge per day (₹) *</label>
              <input id="ward-rate" name="rate" type="number" min="0" [(ngModel)]="rateRupees" inputmode="decimal" class="w-full border border-outline-variant rounded-lg p-2.5 text-sm" />
            </div>
            <div>
              <label for="ward-floor" class="block text-sm font-medium mb-1">Floor</label>
              <input id="ward-floor" name="floor" [(ngModel)]="floor" maxlength="40" class="w-full border border-outline-variant rounded-lg p-2.5 text-sm" />
            </div>
            @if (departments.length) {
              <div>
                <label for="ward-department" class="block text-sm font-medium mb-1">Department</label>
                <select id="ward-department" name="departmentId" [(ngModel)]="departmentId" class="w-full border border-outline-variant rounded-lg p-2.5 text-sm">
                  <option value="">None (any department)</option>
                  @for (d of departments; track d.id) { <option [value]="d.id">{{ d.name }}</option> }
                </select>
              </div>
            }
          </div>
          <div class="flex gap-2 flex-wrap" id="ward-types">
            @for (t of wardTypes; track t.value) {
              <button type="button" (click)="wardType = t.value" class="px-3 min-h-touch rounded-full text-sm border"
                [class]="wardType === t.value ? 'bg-primary text-white border-primary' : 'bg-white border-outline-variant'">{{ t.label }}</button>
            }
          </div>
          @if (!editing) {
            <div class="rounded-lg bg-slate-50 border border-outline-variant p-3">
              <p class="text-sm font-medium mb-2">Beds</p>
              <div class="flex gap-2 flex-wrap items-center text-sm">
                <input name="prefix" [(ngModel)]="prefix" maxlength="10" aria-label="Bed number prefix" placeholder="Prefix" class="w-24 border border-outline-variant rounded-lg p-2.5" />
                <span>numbered</span>
                <input name="from" type="number" min="1" [(ngModel)]="from" aria-label="First bed number" class="w-20 border border-outline-variant rounded-lg p-2.5" />
                <span>to</span>
                <input id="ward-bed-to" name="to" type="number" min="1" [(ngModel)]="to" aria-label="Last bed number" class="w-20 border border-outline-variant rounded-lg p-2.5" />
              </div>
              <p class="text-xs text-slate-600 mt-1">{{ preview }}</p>
            </div>
          }
          @if (formError) { <p class="text-sm text-status-red" id="ward-error">{{ formError }}</p> }
          <div class="flex gap-2">
            <button type="submit" id="save-ward" [disabled]="name.trim().length < 2 || rateRupees === null || saving"
              class="px-5 min-h-touch text-sm font-semibold text-white bg-primary rounded-lg disabled:opacity-50">{{ saving ? 'Saving…' : 'Save' }}</button>
            <button type="button" (click)="form = false" class="px-4 min-h-touch text-sm border border-outline-variant rounded-lg">Cancel</button>
          </div>
        </form>
      }

      @if (error) {
        <div class="p-3 rounded-lg bg-red-50 text-sm text-red-700">{{ error }}</div>
      }
      <div class="space-y-3" id="wards">
        @for (w of wards; track w.id) {
          <div class="bg-white rounded-xl border border-outline-variant p-4" [attr.data-ward]="w.name">
            <div class="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <h2 class="font-semibold">{{ w.name }}</h2>
                <p class="text-sm text-slate-600">{{ typeLabel(w.wardType) }} · {{ money(w.dailyRateInPaisa) }}/day{{ w.floor ? ' · floor ' + w.floor : '' }}{{ w.departmentName ? ' · ' + w.departmentName : '' }}</p>
              </div>
              <div class="flex gap-1">
                <button type="button" (click)="startWard(w)" [attr.aria-label]="'Edit ' + w.name" class="p-2 rounded-lg text-slate-600 hover:bg-surface-container-high"><span class="material-symbols-outlined text-lg">edit</span></button>
                <button type="button" (click)="toClose = w" [attr.aria-label]="'Close ' + w.name" class="p-2 rounded-lg text-status-red hover:bg-red-50"><span class="material-symbols-outlined text-lg">delete</span></button>
              </div>
            </div>
            <div class="flex gap-2 flex-wrap mt-3">
              @for (b of w.beds; track b.id) {
                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm border" [class]="b.status === 'OCCUPIED' ? 'bg-blue-50 border-blue-200' : 'bg-white border-outline-variant'">
                  {{ b.bedNumber }}
                  @if (b.status !== 'OCCUPIED') {
                    <button type="button" (click)="removeBed(w, b)" [attr.aria-label]="'Remove bed ' + b.bedNumber" class="text-slate-500 hover:text-status-red">
                      <span class="material-symbols-outlined text-base">close</span></button>
                  }
                </span>
              }
              <span class="inline-flex items-center gap-1">
                <input [(ngModel)]="newBed[w.id]" [name]="'new-bed-' + w.id" maxlength="20" placeholder="New bed no." [attr.aria-label]="'New bed in ' + w.name"
                  class="w-28 border border-outline-variant rounded-lg p-1.5 text-sm" (keydown.enter)="addBed(w); $event.preventDefault()" />
                <button type="button" (click)="addBed(w)" class="p-1.5 rounded-lg bg-primary text-white" [attr.aria-label]="'Add bed to ' + w.name"><span class="material-symbols-outlined text-base">add</span></button>
              </span>
            </div>
          </div>
        }
      </div>
      }
    </div>

    <app-confirm-dialog [open]="!!toClose" title="Close ward" [message]="'Close ' + (toClose?.name ?? '') + '? Only a ward with nobody in it can be closed. Past stays are kept.'"
      confirmText="Close ward" [isDestructive]="true" (confirmed)="closeWard()" (cancelled)="toClose = null" />
  `,
})
export class WardSetupComponent implements OnInit {
  private ipd = inject(IpdService);
  private departmentService = inject(DepartmentService);
  private license = inject(EffectiveLicenseService);
  private toast = inject(ToastService);
  private auth = inject(AuthService);

  readonly allowed = this.auth.can('WARD_MANAGE');
  readonly wardTypes = WARD_TYPES;
  wards: WardView[] = [];
  departments: Department[] = [];
  error = '';

  form = false;
  editing: WardView | null = null;
  name = '';
  wardType: WardType = 'GENERAL';
  rateRupees: number | null = null;
  floor = '';
  departmentId = '';
  prefix = 'B-';
  from = 1;
  to = 10;
  saving = false;
  formError = '';
  toClose: WardView | null = null;
  newBed: Record<string, string> = {};

  get bedNumbers(): string[] {
    const from = Math.max(1, Math.floor(this.from || 1));
    const to = Math.min(from + 99, Math.floor(this.to || 0));
    const list: string[] = [];
    for (let n = from; n <= to; n++) list.push(`${this.prefix.trim()}${n}`);
    return list;
  }

  get preview(): string {
    const n = this.bedNumbers;
    return n.length === 0 ? 'No beds yet; add them later.' : `${n.length} beds: ${n[0]}${n.length > 1 ? ' … ' + n[n.length - 1] : ''}`;
  }

  ngOnInit(): void {
    if (!this.allowed) return;
    this.load();
    if (this.license.activeModules().includes('DEPARTMENT')) {
      this.departmentService.getDepartments().subscribe({ next: (d) => (this.departments = d), error: () => (this.departments = []) });
    }
  }

  load(): void {
    this.ipd.board().subscribe({
      next: (b) => (this.wards = b.wards),
      error: (err) => (this.error = err?.error?.message || 'The wards could not be loaded.'),
    });
  }

  startWard(w: WardView | null): void {
    this.editing = w;
    this.form = true;
    this.formError = '';
    this.name = w?.name ?? '';
    this.wardType = w?.wardType ?? 'GENERAL';
    this.rateRupees = w ? w.dailyRateInPaisa / 100 : null;
    this.floor = w?.floor ?? '';
    this.departmentId = w?.departmentId ?? '';
  }

  saveWard(): void {
    if (this.saving || this.rateRupees === null) return;
    this.saving = true;
    this.formError = '';
    const request = {
      name: this.name.trim(),
      wardType: this.wardType,
      floor: this.floor.trim() || null,
      dailyRateInPaisa: Math.round(this.rateRupees * 100),
      departmentId: this.departmentId || null,
    };
    const beds = this.bedNumbers;
    const call = this.editing ? this.ipd.updateWard(this.editing.id, request) : this.ipd.createWard(request);
    call.subscribe({
      next: (w) => {
        const finish = () => {
          this.saving = false;
          this.form = false;
          this.toast.success(`${w.name} saved`);
          this.load();
        };
        if (!this.editing && beds.length) {
          this.ipd.addBeds(w.id, beds).subscribe({ next: finish, error: finish });
        } else {
          finish();
        }
      },
      error: (err) => {
        this.saving = false;
        this.formError = err?.error?.message || 'The ward could not be saved.';
      },
    });
  }

  addBed(w: WardView): void {
    const number = (this.newBed[w.id] ?? '').trim();
    if (!number) return;
    this.ipd.addBeds(w.id, [number]).subscribe({
      next: () => {
        this.newBed[w.id] = '';
        this.load();
      },
      error: (err) => this.toast.error(err?.error?.message || 'The bed could not be added.'),
    });
  }

  removeBed(w: WardView, b: BedView): void {
    this.ipd.removeBed(b.id).subscribe({
      next: () => {
        this.toast.success(`Bed ${b.bedNumber} removed from ${w.name}`);
        this.load();
      },
      error: (err) => this.toast.error(err?.error?.message || 'The bed could not be removed.'),
    });
  }

  closeWard(): void {
    const w = this.toClose;
    this.toClose = null;
    if (!w) return;
    this.ipd.closeWard(w.id).subscribe({
      next: () => {
        this.toast.success(`${w.name} closed`);
        this.load();
      },
      error: (err) => this.toast.error(err?.error?.message || 'The ward could not be closed.'),
    });
  }

  typeLabel(t: WardType): string {
    return labelOf(WARD_TYPES, t);
  }

  money(paisa: number): string {
    return rupees(paisa);
  }
}
