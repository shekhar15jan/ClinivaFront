import { Component } from '@angular/core';

import { SharedModule } from '../../../../shared/shared-module';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [SharedModule],
  template: `
    <div class="p-6">
      <h1 class="text-2xl font-semibold text-gray-900 mb-6">Add User</h1>
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-lg">
        <p class="text-sm text-gray-500">User form placeholder — will be implemented in Phase 5.</p>
      </div>
    </div>
  `,
})
export class UserFormComponent {}
