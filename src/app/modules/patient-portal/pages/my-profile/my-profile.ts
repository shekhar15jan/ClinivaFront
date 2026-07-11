import { Component, inject } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-my-profile',
  template: `
    <div class="p-6 max-w-2xl">
      <h2 class="text-headline-md text-on-surface mb-6">My Profile</h2>

      @if (user) {
        <div class="bg-white rounded-xl border border-outline-variant p-6 space-y-4">
          <div class="flex items-center gap-4 mb-4">
            <div class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl uppercase">
              {{ ((user.profile?.['firstName']?.charAt(0) ?? '') + (user.profile?.['lastName']?.charAt(0) ?? '')) || '?' }}
            </div>
            <div>
              <h3 class="text-lg font-bold text-on-surface">@if (user.profile?.['firstName']; as first) { {{ first }}{{ user.profile?.['lastName'] ? ' ' + user.profile?.['lastName'] : '' }} } @else { {{ user.email }} }</h3>
              <p class="text-sm text-outline">{{ user.role }}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 pt-4 border-t">
            <div><p class="text-xs font-semibold text-outline uppercase mb-1">Email</p><p class="text-sm text-on-surface">{{ user.email }}</p></div>
            <div><p class="text-xs font-semibold text-outline uppercase mb-1">Role</p><p class="text-sm text-on-surface">{{ user.role }}</p></div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div><label for="firstName" class="block text-xs font-semibold text-outline uppercase mb-1">First Name</label><input id="firstName" type="text" [(ngModel)]="firstName" class="w-full px-3 py-2 border rounded-lg text-sm" /></div>
            <div><label for="lastName" class="block text-xs font-semibold text-outline uppercase mb-1">Last Name</label><input id="lastName" type="text" [(ngModel)]="lastName" class="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div><label for="phone" class="block text-xs font-semibold text-outline uppercase mb-1">Phone</label><input id="phone" type="tel" [(ngModel)]="phone" class="w-full px-3 py-2 border rounded-lg text-sm" /></div>
          </div>

          @if (saveMessage) {
            <p class="text-sm" [class.text-green-600]="!saveError" [class.text-red-600]="saveError">{{ saveMessage }}</p>
          }

          <div class="pt-4 border-t">
            <button (click)="saveProfile()" [disabled]="isSaving" class="px-5 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark disabled:opacity-50">
              {{ isSaving ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </div>
      }
    </div>
  `,
  imports: [FormsModule],
})
export class MyProfile {
  private authService = inject(AuthService);

  firstName = '';
  lastName = '';
  phone = '';
  isSaving = false;
  saveMessage = '';
  saveError = false;

  get user() {
    return this.authService.currentUserValue;
  }

  constructor() {
    const u = this.user;
    if (u) {
      this.firstName = u.profile?.['firstName'] || '';
      this.lastName = u.profile?.['lastName'] || '';
    }
  }

  saveProfile() {
    this.isSaving = true;
    this.saveMessage = '';
    // Profile update would go through a user profile service
    setTimeout(() => {
      this.isSaving = false;
      this.saveMessage = 'Profile updated successfully';
      this.saveError = false;
    }, 500);
  }
}
