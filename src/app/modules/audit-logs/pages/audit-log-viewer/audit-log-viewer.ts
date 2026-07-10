import { Component } from '@angular/core';

import { SharedModule } from '../../../../shared/shared-module';

@Component({
  selector: 'app-audit-log-viewer',
  standalone: true,
  imports: [SharedModule],
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-semibold text-gray-900">Audit Logs</h1>
      </div>
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div class="flex gap-4 mb-4">
          <input
            type="date"
            class="px-3 py-2 text-sm border border-gray-300 rounded-lg"
            placeholder="Start Date"
          />
          <input
            type="date"
            class="px-3 py-2 text-sm border border-gray-300 rounded-lg"
            placeholder="End Date"
          />
          <select class="px-3 py-2 text-sm border border-gray-300 rounded-lg">
            <option value="">All Users</option>
          </select>
          <select class="px-3 py-2 text-sm border border-gray-300 rounded-lg">
            <option value="">All Entities</option>
            <option value="PATIENT">Patient</option>
            <option value="DOCTOR">Doctor</option>
            <option value="APPOINTMENT">Appointment</option>
            <option value="PRESCRIPTION">Prescription</option>
            <option value="BILL">Bill</option>
          </select>
        </div>
        <app-empty-state
          icon="📜"
          title="Audit Logs"
          description="View a complete trail of all system actions including creates, updates, deletes, and status changes."
        ></app-empty-state>
      </div>
    </div>
  `,
})
export class AuditLogViewerComponent {}
