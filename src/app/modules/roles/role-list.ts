import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RoleService } from '../../core/services/role.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { CustomRole, ManagedRole, PermissionInfo, RolesOverview } from '../../core/models/user-management.model';

/** The colour of each permission group, so a role's reach is visible at a glance. */
const GROUP_COLOURS: Record<string, string> = {
  Patients: 'bg-blue-50 text-blue-800',
  Clinical: 'bg-rose-50 text-rose-800',
  Appointments: 'bg-violet-50 text-violet-800',
  Billing: 'bg-amber-50 text-amber-900',
  Pharmacy: 'bg-emerald-50 text-emerald-800',
  Hospital: 'bg-cyan-50 text-cyan-800',
  Inpatients: 'bg-indigo-50 text-indigo-800',
  Reports: 'bg-indigo-50 text-indigo-800',
  Security: 'bg-slate-100 text-slate-800',
  Owner: 'bg-slate-800 text-white',
};

/**
 * Roles: the built-in ones (templates) and the clinic's own. A custom role works like its base role (a nurse is
 * still a nurse) with the permissions ticked here; owner-only permissions cannot be ticked.
 */
@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [FormsModule, ConfirmDialogComponent],
  template: `
    <div class="p-4 sm:p-6 max-w-5xl">
      <div class="flex items-start justify-between flex-wrap gap-3 mb-5">
        <div>
          <h1 class="text-2xl font-semibold text-on-surface">Roles</h1>
          <p class="text-sm text-slate-600 mt-1">What each role may do. Make your own role from a built-in one, then give it to staff on the Users screen.</p>
        </div>
        @if (!formOpen && overview) {
          <button type="button" id="add-role" (click)="startAdd()"
            class="px-4 min-h-touch text-sm font-semibold text-white bg-primary rounded-lg flex items-center gap-1">
            <span class="material-symbols-outlined text-lg">add</span> New role
          </button>
        }
      </div>

      @if (loadError) {
        <div class="p-3 rounded-lg bg-red-50 text-sm text-red-700" id="roles-error">{{ loadError }}</div>
      }

      @if (formOpen && overview) {
        <form class="mb-6 bg-white rounded-xl border border-outline-variant p-4 space-y-4" id="role-form" (ngSubmit)="save()">
          <h2 class="text-base font-semibold text-on-surface">{{ editing ? 'Edit ' + editing.name : 'New role' }}</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label for="role-name" class="block text-sm font-medium mb-1">Name *</label>
              <input id="role-name" name="name" [(ngModel)]="name" maxlength="60" placeholder="e.g. Senior nurse"
                class="w-full border border-outline-variant rounded-lg p-2.5 text-sm" />
            </div>
            <div>
              <label for="role-base" class="block text-sm font-medium mb-1">Works like *</label>
              <select id="role-base" name="baseRole" [(ngModel)]="baseRole" (ngModelChange)="useTemplate()"
                class="w-full border border-outline-variant rounded-lg p-2.5 text-sm bg-white">
                @for (r of baseRoles; track r.role) {
                  <option [value]="r.role">{{ r.label }}</option>
                }
              </select>
              <p class="text-xs text-slate-600 mt-1">Picking one starts from its permissions.</p>
            </div>
          </div>
          @for (group of groups; track group) {
            <fieldset>
              <legend class="text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">{{ group }}</legend>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                @for (p of permissionsIn(group); track p.code) {
                  <label class="flex items-start gap-2 p-2.5 rounded-lg border min-h-touch"
                    [class]="p.ownerOnly ? 'border-outline-variant bg-surface-container-low opacity-60' : chosen.has(p.code) ? 'border-primary bg-blue-50' : 'border-outline-variant'">
                    <input type="checkbox" class="mt-0.5" [attr.data-permission]="p.code" [disabled]="p.ownerOnly"
                      [checked]="chosen.has(p.code)" (change)="toggle(p.code)" />
                    <span class="text-sm text-on-surface">{{ p.label }}@if (p.ownerOnly) {<span class="block text-xs text-slate-600">Stays with the owner</span>}</span>
                  </label>
                }
              </div>
            </fieldset>
          }
          @if (formError) {
            <p class="text-sm text-status-red" id="role-form-error">{{ formError }}</p>
          }
          <div class="flex gap-2 sticky bottom-0 bg-white py-2">
            <button type="submit" id="save-role" [disabled]="name.trim().length < 2 || saving"
              class="px-5 min-h-touch text-sm font-semibold text-white bg-primary rounded-lg disabled:opacity-50">
              {{ saving ? 'Saving…' : 'Save role' }}
            </button>
            <button type="button" (click)="formOpen = false" class="px-4 min-h-touch text-sm border border-outline-variant rounded-lg">Cancel</button>
          </div>
        </form>
      }

      @if (overview) {
        <h2 class="text-base font-semibold text-on-surface mb-2">Your roles</h2>
        @if (overview.customRoles.length === 0) {
          <p class="text-sm text-slate-600 mb-6" id="no-custom-roles">None yet. The built-in roles below cover most clinics.</p>
        } @else {
          <div class="space-y-3 mb-6" id="custom-roles">
            @for (r of overview.customRoles; track r.id) {
              <div class="bg-white rounded-xl border border-outline-variant p-4" [attr.data-role]="r.name">
                <div class="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <h3 class="text-base font-semibold text-on-surface">{{ r.name }}</h3>
                    <p class="text-xs text-slate-600">Works like {{ r.baseRoleLabel }} · {{ r.staffCount }} staff</p>
                  </div>
                  <div class="flex gap-1">
                    <button type="button" (click)="startEdit(r)" [attr.aria-label]="'Edit ' + r.name"
                      class="p-2 rounded-lg text-slate-600 hover:bg-surface-container-high"><span class="material-symbols-outlined text-lg">edit</span></button>
                    <button type="button" (click)="toDelete = r" [attr.aria-label]="'Delete ' + r.name"
                      class="p-2 rounded-lg text-status-red hover:bg-red-50"><span class="material-symbols-outlined text-lg">delete</span></button>
                  </div>
                </div>
                <div class="flex flex-wrap gap-1.5 mt-3">
                  @for (code of r.permissions; track code) {
                    <span class="px-2 py-0.5 rounded-full text-xs font-medium" [class]="colourOf(code)">{{ labelOf(code) }}</span>
                  }
                </div>
              </div>
            }
          </div>
        }

        <h2 class="text-base font-semibold text-on-surface mb-2">Built-in roles</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3" id="built-in-roles">
          @for (r of overview.builtInRoles; track r.role) {
            <div class="bg-white rounded-xl border border-outline-variant p-4">
              <h3 class="text-sm font-semibold text-on-surface">{{ r.label }}</h3>
              <div class="flex flex-wrap gap-1.5 mt-2">
                @for (code of r.permissions; track code) {
                  <span class="px-2 py-0.5 rounded-full text-xs font-medium" [class]="colourOf(code)">{{ labelOf(code) }}</span>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>

    <app-confirm-dialog
      [open]="!!toDelete"
      title="Delete role"
      [message]="'Delete ' + (toDelete?.name ?? '') + '? Staff who have it must be given another role first.'"
      confirmText="Delete"
      [isDestructive]="true"
      (confirmed)="remove()"
      (cancelled)="toDelete = null"
    />
  `,
})
export class RoleListComponent implements OnInit {
  private service = inject(RoleService);
  private toast = inject(ToastService);

  overview: RolesOverview | null = null;
  loadError = '';

  formOpen = false;
  editing: CustomRole | null = null;
  name = '';
  baseRole: ManagedRole = 'NURSE';
  chosen = new Set<string>();
  saving = false;
  formError = '';
  toDelete: CustomRole | null = null;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loadError = '';
    this.service.getOverview().subscribe({
      next: (o) => (this.overview = o),
      error: (err) => (this.loadError = err?.error?.message || 'The roles could not be loaded.'),
    });
  }

  /** A custom role is based on any staff role except the owner's. */
  get baseRoles() {
    return (this.overview?.builtInRoles ?? []).filter((r) => r.role !== 'ADMIN');
  }

  get groups(): string[] {
    return [...new Set((this.overview?.permissions ?? []).map((p) => p.group))];
  }

  permissionsIn(group: string): PermissionInfo[] {
    return (this.overview?.permissions ?? []).filter((p) => p.group === group);
  }

  labelOf(code: string): string {
    return this.overview?.permissions.find((p) => p.code === code)?.label ?? code;
  }

  colourOf(code: string): string {
    const group = this.overview?.permissions.find((p) => p.code === code)?.group ?? '';
    return GROUP_COLOURS[group] ?? 'bg-slate-100 text-slate-800';
  }

  startAdd(): void {
    this.editing = null;
    this.name = '';
    this.baseRole = 'NURSE';
    this.useTemplate();
    this.formError = '';
    this.formOpen = true;
  }

  startEdit(r: CustomRole): void {
    this.editing = r;
    this.name = r.name;
    this.baseRole = r.baseRole;
    this.chosen = new Set(r.permissions);
    this.formError = '';
    this.formOpen = true;
  }

  /** Starts the ticks from the base role's permissions. */
  useTemplate(): void {
    const template = this.overview?.builtInRoles.find((r) => r.role === this.baseRole);
    this.chosen = new Set(template?.permissions ?? []);
  }

  toggle(code: string): void {
    if (this.chosen.has(code)) this.chosen.delete(code);
    else this.chosen.add(code);
  }

  save(): void {
    if (this.name.trim().length < 2 || this.saving) return;
    this.saving = true;
    this.formError = '';
    const ownerOnly = new Set((this.overview?.permissions ?? []).filter((p) => p.ownerOnly).map((p) => p.code));
    const request = {
      name: this.name.trim(),
      baseRole: this.baseRole,
      permissions: [...this.chosen].filter((c) => !ownerOnly.has(c)),
    };
    const call = this.editing ? this.service.update(this.editing.id, request) : this.service.create(request);
    call.subscribe({
      next: (r) => {
        this.saving = false;
        this.formOpen = false;
        this.toast.success(`${r.name} saved`);
        this.load();
      },
      error: (err) => {
        this.saving = false;
        this.formError = err?.error?.message || 'The role could not be saved.';
      },
    });
  }

  remove(): void {
    const r = this.toDelete;
    this.toDelete = null;
    if (!r) return;
    this.service.delete(r.id).subscribe({
      next: () => {
        this.toast.success(`${r.name} deleted`);
        this.load();
      },
      error: (err) => this.toast.error(err?.error?.message || 'The role could not be deleted.'),
    });
  }
}
