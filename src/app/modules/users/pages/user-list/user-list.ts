import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PaginatorComponent } from '../../../../shared/components/paginator/paginator.component';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { UserManagementService } from '../../../../core/services/user-management.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ManagedRole, ManagedUser } from '../../../../core/models/user-management.model';

/** A password nobody has to remember: staff sign in with an emailed code, and Reset password issues a new one. */
export function generatePassword(length = 16): string {
  const sets = ['abcdefghijkmnopqrstuvwxyz', 'ABCDEFGHJKLMNPQRSTUVWXYZ', '23456789', '#$%&*?'];
  const all = sets.join('');
  const random = (max: number) => {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] % max;
  };
  // One of each kind first, so the result always satisfies a complexity rule.
  const chars = sets.map((s) => s[random(s.length)]);
  while (chars.length < length) chars.push(all[random(all.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = random(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [ReactiveFormsModule, PaginatorComponent, ConfirmDialogComponent, EmptyStateComponent],
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 class="text-2xl font-semibold text-gray-900">User Management</h1>
          <p class="text-sm text-gray-500 mt-1">Staff accounts for your clinic. Staff sign in with a code sent to their email.</p>
        </div>
        <button
          id="add-user"
          type="button"
          (click)="openForm()"
          class="px-4 py-2 text-sm font-medium text-white bg-[#003d9b] rounded-lg hover:bg-[#002d75] transition-colors"
        >
          + Add User
        </button>
      </div>

      @if (loadError) {
        <div class="mb-4 p-3 rounded-lg bg-red-50 text-sm text-red-700" id="users-error">
          {{ loadError }}
          <button type="button" class="underline ml-2" (click)="load()">Retry</button>
        </div>
      }

      @if (isLoading && users.length === 0) {
        <div class="flex justify-center py-12">
          <div class="w-10 h-10 border-4 border-gray-200 border-t-[#003d9b] rounded-full animate-spin"></div>
        </div>
      } @else if (users.length === 0 && !loadError) {
        <app-empty-state icon="👥" title="No staff yet" description="Add the first staff account to get started."></app-empty-state>
      } @else {
        <div class="bg-white rounded-xl border border-gray-200 overflow-x-auto">
          <table class="w-full text-left" id="users-table">
            <thead>
              <tr class="bg-gray-50 text-xs uppercase text-gray-500">
                <th class="px-4 py-3">Name</th>
                <th class="px-4 py-3">Email</th>
                <th class="px-4 py-3">Role</th>
                <th class="px-4 py-3">Status</th>
                <th class="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (user of users; track user.id) {
                <tr class="border-t border-gray-100" [attr.data-email]="user.email">
                  <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ nameOf(user) }}</td>
                  <td class="px-4 py-3 text-sm text-gray-600">{{ user.email }}</td>
                  <td class="px-4 py-3 text-sm text-gray-600">{{ user.roles }}</td>
                  <td class="px-4 py-3">
                    <span
                      class="px-2.5 py-1 rounded-full text-xs font-medium"
                      [class]="user.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'"
                    >{{ user.isActive ? 'Active' : 'Inactive' }}</span>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-3">
                      @if (isSelf(user)) {
                        <span class="text-xs text-gray-400">This is you</span>
                      } @else {
                        @if (user.isActive) {
                          <button type="button" class="text-xs font-medium text-red-600 hover:underline" (click)="askDeactivate(user)">Deactivate</button>
                        } @else {
                          <button type="button" class="text-xs font-medium text-green-700 hover:underline" (click)="activate(user)">Activate</button>
                        }
                        <button type="button" class="text-xs font-medium text-[#003d9b] hover:underline" (click)="resetPassword(user)">Reset password</button>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <app-paginator
          [totalElements]="totalElements"
          [pageSize]="pageSize"
          [currentPage]="currentPage"
          (pageChange)="onPageChange($event)"
        ></app-paginator>
      }
    </div>

    @if (showForm) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Add user">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 class="text-base font-bold text-gray-900">Add User</h3>
            <button type="button" (click)="closeForm()" class="text-gray-500 hover:text-gray-900" aria-label="Close">✕</button>
          </div>
          <form [formGroup]="form" (ngSubmit)="submit()" class="p-6 space-y-4">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label for="user-first-name" class="block text-sm font-medium text-gray-900 mb-1">First name *</label>
                <input id="user-first-name" type="text" formControlName="firstName" class="w-full border border-gray-300 rounded-lg p-2.5 text-sm" />
              </div>
              <div>
                <label for="user-last-name" class="block text-sm font-medium text-gray-900 mb-1">Last name *</label>
                <input id="user-last-name" type="text" formControlName="lastName" class="w-full border border-gray-300 rounded-lg p-2.5 text-sm" />
              </div>
            </div>
            <div>
              <label for="user-email" class="block text-sm font-medium text-gray-900 mb-1">Email *</label>
              <input id="user-email" type="email" formControlName="email" class="w-full border border-gray-300 rounded-lg p-2.5 text-sm" />
              @if (form.controls.email.touched && form.controls.email.invalid) {
                <p class="text-xs text-red-600 mt-1">Enter a valid email address.</p>
              }
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label for="user-role" class="block text-sm font-medium text-gray-900 mb-1">Role *</label>
                <select id="user-role" formControlName="role" class="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white">
                  @for (role of roles; track role.value) {
                    <option [value]="role.value">{{ role.label }}</option>
                  }
                </select>
              </div>
              <div>
                <label for="user-phone" class="block text-sm font-medium text-gray-900 mb-1">Phone</label>
                <input id="user-phone" type="tel" formControlName="phone" class="w-full border border-gray-300 rounded-lg p-2.5 text-sm" />
              </div>
            </div>
            @if (formError) {
              <p class="text-sm text-red-600" id="user-form-error">{{ formError }}</p>
            }
            <div class="flex justify-end gap-3 pt-2">
              <button type="button" (click)="closeForm()" class="px-4 py-2 text-sm border border-gray-300 rounded-lg">Cancel</button>
              <button
                id="save-user"
                type="submit"
                [disabled]="form.invalid || isSaving"
                class="px-5 py-2 text-sm font-medium text-white bg-[#003d9b] rounded-lg disabled:opacity-50"
              >{{ isSaving ? 'Saving...' : 'Create User' }}</button>
            </div>
          </form>
        </div>
      </div>
    }

    @if (issuedPassword) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="New password">
        <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
          <h3 class="text-base font-bold text-gray-900 mb-2">New temporary password</h3>
          <p class="text-sm text-gray-600 mb-4">
            Give this to {{ issuedFor }}. It is shown once and they will be asked to change it when they use it.
          </p>
          <p class="font-mono text-lg bg-gray-50 border border-gray-200 rounded-lg p-3 text-center select-all" id="issued-password">{{ issuedPassword }}</p>
          <div class="flex justify-end mt-4">
            <button type="button" id="close-password" (click)="issuedPassword = ''" class="px-5 py-2 text-sm font-medium text-white bg-[#003d9b] rounded-lg">Done</button>
          </div>
        </div>
      </div>
    }

    <app-confirm-dialog
      [open]="!!toDeactivate"
      title="Deactivate user"
      [message]="'Deactivate ' + (toDeactivate ? nameOf(toDeactivate) : '') + '? They will no longer be able to sign in.'"
      confirmText="Deactivate"
      [isDestructive]="true"
      (confirmed)="deactivate()"
      (cancelled)="toDeactivate = null"
    />
  `,
})
export class UserListComponent implements OnInit {
  private service = inject(UserManagementService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);

  readonly roles: { value: ManagedRole; label: string }[] = [
    { value: 'RECEPTIONIST', label: 'Receptionist' },
    { value: 'DOCTOR', label: 'Doctor' },
    { value: 'NURSE', label: 'Nurse' },
    { value: 'ADMIN', label: 'Administrator' },
  ];

  users: ManagedUser[] = [];
  totalElements = 0;
  currentPage = 0;
  pageSize = 20;
  isLoading = false;
  loadError = '';

  showForm = false;
  isSaving = false;
  formError = '';
  form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    role: ['RECEPTIONIST' as ManagedRole, Validators.required],
    phone: [''],
  });

  toDeactivate: ManagedUser | null = null;
  issuedPassword = '';
  issuedFor = '';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading = true;
    this.loadError = '';
    this.service.getUsers(this.currentPage, this.pageSize).subscribe({
      next: (page) => {
        this.users = page.content;
        this.totalElements = page.totalElements;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.loadError = err?.error?.message || 'The staff list could not be loaded.';
      },
    });
  }

  onPageChange(event: { page: number; size: number }): void {
    this.currentPage = event.page;
    this.pageSize = event.size;
    this.load();
  }

  nameOf(user: ManagedUser): string {
    const name = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
    return name || '—';
  }

  isSelf(user: ManagedUser): boolean {
    return this.auth.currentUserValue?.id === user.id;
  }

  openForm(): void {
    this.form.reset({ firstName: '', lastName: '', email: '', role: 'RECEPTIONIST', phone: '' });
    this.formError = '';
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
  }

  submit(): void {
    if (this.form.invalid || this.isSaving) return;
    const value = this.form.getRawValue();
    this.isSaving = true;
    this.formError = '';
    this.service
      .createUser({
        firstName: value.firstName.trim(),
        lastName: value.lastName.trim(),
        email: value.email.trim(),
        role: value.role,
        phone: value.phone.trim() || undefined,
        password: generatePassword(),
      })
      .subscribe({
        next: (user) => {
          this.isSaving = false;
          this.showForm = false;
          this.toast.success(`${user.email} added`);
          this.load();
        },
        error: (err) => {
          this.isSaving = false;
          // 409: the email is taken. Other errors carry the server's own reason (plan limit, validation).
          this.formError =
            err?.status === 409
              ? 'A user with this email already exists.'
              : err?.error?.message || 'The user could not be created.';
        },
      });
  }

  askDeactivate(user: ManagedUser): void {
    this.toDeactivate = user;
  }

  deactivate(): void {
    const user = this.toDeactivate;
    this.toDeactivate = null;
    if (!user) return;
    this.service.deactivateUser(user.id).subscribe({
      next: () => {
        this.toast.success(`${user.email} deactivated`);
        this.load();
      },
      error: (err) => this.toast.error(err?.error?.message || 'The user could not be deactivated.'),
    });
  }

  activate(user: ManagedUser): void {
    this.service.activateUser(user.id).subscribe({
      next: () => {
        this.toast.success(`${user.email} activated`);
        this.load();
      },
      error: (err) => this.toast.error(err?.error?.message || 'The user could not be activated.'),
    });
  }

  resetPassword(user: ManagedUser): void {
    this.service.resetPassword(user.id).subscribe({
      next: (res) => {
        this.issuedFor = this.nameOf(user) === '—' ? user.email : this.nameOf(user);
        this.issuedPassword = res.temporaryPassword;
      },
      error: (err) => this.toast.error(err?.error?.message || 'The password could not be reset.'),
    });
  }
}
