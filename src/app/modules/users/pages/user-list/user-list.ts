import { Component } from '@angular/core';

import { SharedModule } from '../../../../shared/shared-module';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [SharedModule],
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-semibold text-gray-900">User Management</h1>
        <button
          class="px-4 py-2 text-sm font-medium text-white bg-[#003d9b] rounded-lg hover:bg-[#002d75] transition-colors"
        >
          + Add User
        </button>
      </div>
      <app-empty-state
        icon="👥"
        title="User Management"
        description="Manage staff accounts, roles, and access permissions for your clinic."
        actionLabel="+ Add User"
      ></app-empty-state>
    </div>
  `,
})
export class UserListComponent {}
