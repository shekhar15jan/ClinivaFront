import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reports-dashboard',
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-[#1E293B]">Reports & Analytics</h1>
        <select
          class="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0052CC]"
        >
          <option>Last 30 Days</option>
          <option>This Quarter</option>
          <option>This Year</option>
        </select>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <div class="flex items-center justify-between mb-2">
            <p class="text-xs font-semibold text-[#64748B] uppercase">Total Revenue</p>
            <span class="material-symbols-outlined text-[#0052CC]">payments</span>
          </div>
          <p class="text-2xl font-bold text-[#1E293B]">₹{{ revenue }}</p>
          <p class="text-xs text-[#059669] mt-1">+12.5% vs last month</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <div class="flex items-center justify-between mb-2">
            <p class="text-xs font-semibold text-[#64748B] uppercase">Appointments</p>
            <span class="material-symbols-outlined text-[#0052CC]">calendar_month</span>
          </div>
          <p class="text-2xl font-bold text-[#1E293B]">{{ totalAppointments }}</p>
          <p class="text-xs text-[#059669] mt-1">+8.3% vs last month</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <div class="flex items-center justify-between mb-2">
            <p class="text-xs font-semibold text-[#64748B] uppercase">New Patients</p>
            <span class="material-symbols-outlined text-[#0052CC]">person_add</span>
          </div>
          <p class="text-2xl font-bold text-[#1E293B]">{{ newPatients }}</p>
          <p class="text-xs text-[#059669] mt-1">+5.2% vs last month</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <div class="flex items-center justify-between mb-2">
            <p class="text-xs font-semibold text-[#64748B] uppercase">Outstanding Dues</p>
            <span class="material-symbols-outlined text-[#DC2626]">account_balance</span>
          </div>
          <p class="text-2xl font-bold text-[#1E293B]">₹{{ outstandingDues }}</p>
          <p class="text-xs text-[#DC2626] mt-1">-2.1% vs last month</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <h3 class="text-sm font-semibold text-[#1E293B] mb-4">Monthly Appointment Trends</h3>
          <div class="h-48 flex items-end gap-3">
            @for (m of monthlyTrend; track m) {
              <div class="flex-1 flex flex-col items-center gap-1">
                <span class="text-xs font-medium text-[#64748B]">{{ m.count }}</span>
                <div
                  class="w-full rounded-t"
                  [style.height.px]="m.height"
                  [style.background]="m.color"
                ></div>
                <span class="text-xs text-[#94A3B8]">{{ m.label }}</span>
              </div>
            }
          </div>
        </div>

        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <h3 class="text-sm font-semibold text-[#1E293B] mb-4">Doctor Performance</h3>
          <div class="space-y-3">
            @for (doc of doctorPerformance; track doc) {
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div
                    class="w-8 h-8 rounded-full bg-[#EEF2FF] flex items-center justify-center text-[#0052CC] text-xs font-bold"
                  >
                    {{ doc.name.charAt(0) }}
                  </div>
                  <div>
                    <p class="text-sm font-medium text-[#1E293B]">{{ doc.name }}</p>
                    <p class="text-xs text-[#64748B]">{{ doc.consultations }} consultations</p>
                  </div>
                </div>
                <span class="text-sm font-semibold text-[#1E293B]">₹{{ doc.revenue }}</span>
              </div>
            }
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <h3 class="text-sm font-semibold text-[#1E293B] mb-4">Export Reports</h3>
        <div class="flex gap-3">
          <button
            class="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-[#475569] hover:bg-[#F8FAFC]"
          >
            <span class="material-symbols-outlined text-lg">download</span> Export as CSV
          </button>
          <button
            class="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-[#475569] hover:bg-[#F8FAFC]"
          >
            <span class="material-symbols-outlined text-lg">picture_as_pdf</span> Export as PDF
          </button>
        </div>
      </div>
    </div>
  `,
  imports: [FormsModule],
})
export class ReportsDashboard {
  revenue = '1,85,400';
  totalAppointments = 347;
  newPatients = 89;
  outstandingDues = '28,500';

  monthlyTrend = [
    { label: 'Jan', count: 65, height: 80, color: '#0052CC' },
    { label: 'Feb', count: 72, height: 88, color: '#0052CC' },
    { label: 'Mar', count: 58, height: 70, color: '#0052CC' },
    { label: 'Apr', count: 80, height: 98, color: '#0052CC' },
    { label: 'May', count: 95, height: 116, color: '#0052CC' },
    { label: 'Jun', count: 88, height: 108, color: '#0052CC' },
    { label: 'Jul', count: 78, height: 96, color: '#2563EB' },
  ];

  doctorPerformance = [
    { name: 'Dr. Anita Desai', consultations: 145, revenue: 72500 },
    { name: 'Dr. Vivek Kumar', consultations: 198, revenue: 59400 },
    { name: 'Dr. Sneha Patel', consultations: 87, revenue: 34800 },
    { name: 'Dr. Rajesh Gupta', consultations: 62, revenue: 21700 },
  ];

}
