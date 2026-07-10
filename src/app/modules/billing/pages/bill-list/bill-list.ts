import { Component, OnInit } from '@angular/core';
import { Bill } from '../../../../core/models/billing.model';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-bill-list',
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-[#1E293B]">Bills & Invoices</h1>
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
              placeholder="Search by patient or invoice #..."
              class="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0052CC]"
            />
          </div>
          <select
            class="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0052CC]"
          >
            <option value="">All Status</option>
            <option value="PAID">Paid</option>
            <option value="UNPAID">Unpaid</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
          </select>
        </div>

        <table class="w-full">
          <thead>
            <tr class="bg-[#F8FAFC] text-left">
              <th class="px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Invoice #</th>
              <th class="px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Patient</th>
              <th class="px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Date</th>
              <th class="px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Total</th>
              <th class="px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Paid</th>
              <th class="px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Due</th>
              <th class="px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Status</th>
              <th class="px-4 py-3 text-xs font-semibold text-[#64748B] uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (bill of bills; track bill) {
              <tr class="border-t border-gray-100 hover:bg-[#F8FAFC]">
                <td class="px-4 py-3 text-sm font-mono text-[#64748B]">
                  INV-{{ bill.id.substring(0, 6) }}
                </td>
                <td class="px-4 py-3 text-sm font-medium text-[#1E293B]">{{ bill.patientName }}</td>
                <td class="px-4 py-3 text-sm text-[#64748B]">
                  {{ bill.createdAt | date: 'mediumDate' }}
                </td>
                <td class="px-4 py-3 text-sm font-medium text-[#1E293B]">
                  ₹{{ bill.totalInPaisa / 100 }}
                </td>
                <td class="px-4 py-3 text-sm font-medium text-[#059669]">
                  ₹{{ bill.paidAmountInPaisa / 100 }}
                </td>
                <td
                  class="px-4 py-3 text-sm font-medium"
                  [class.text-[#DC2626]]="bill.dueAmountInPaisa > 0"
                  [class.text-[#059669]]="bill.dueAmountInPaisa === 0"
                >
                  ₹{{ bill.dueAmountInPaisa / 100 }}
                </td>
                <td class="px-4 py-3">
                  <span
                    [class]="statusClass(bill.status)"
                    class="px-2.5 py-1 rounded-full text-xs font-medium"
                    >{{ bill.status }}</span
                  >
                </td>
                <td class="px-4 py-3">
                  <button
                    [routerLink]="['/billing', bill.id]"
                    class="text-[#0052CC] hover:text-[#003d9b] text-sm font-medium"
                  >
                    View
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  imports: [FormsModule, RouterLink, DatePipe],
})
export class BillList implements OnInit {
  bills: Bill[] = [];

  ngOnInit() {
    this.bills = [
      {
        id: 'b-001',
        appointmentId: 'a1',
        patientId: '1',
        patientName: 'Rahul Sharma',
        consultationFeeInPaisa: 50000,
        lineItems: [
          {
            description: 'Consultation Fee',
            quantity: 1,
            unitPriceInPaisa: 50000,
            totalInPaisa: 50000,
          },
          {
            description: 'Paracetamol 500mg',
            quantity: 10,
            unitPriceInPaisa: 250,
            totalInPaisa: 2500,
          },
        ],
        discountInPaisa: 0,
        taxInPaisa: 0,
        totalInPaisa: 52500,
        paidAmountInPaisa: 52500,
        dueAmountInPaisa: 0,
        status: 'PAID',
        createdAt: '2026-06-25T11:00:00',
      },
      {
        id: 'b-002',
        appointmentId: 'a2',
        patientId: '2',
        patientName: 'Priya Patel',
        consultationFeeInPaisa: 30000,
        lineItems: [
          {
            description: 'Consultation Fee',
            quantity: 1,
            unitPriceInPaisa: 30000,
            totalInPaisa: 30000,
          },
          {
            description: 'Amoxicillin 250mg',
            quantity: 14,
            unitPriceInPaisa: 850,
            totalInPaisa: 11900,
          },
        ],
        discountInPaisa: 0,
        taxInPaisa: 0,
        totalInPaisa: 41900,
        paidAmountInPaisa: 0,
        dueAmountInPaisa: 41900,
        status: 'UNPAID',
        createdAt: '2026-07-01T14:30:00',
      },
    ];
  }

  statusClass(status: string): string {
    switch (status) {
      case 'PAID':
        return 'bg-[#ECFDF5] text-[#059669]';
      case 'UNPAID':
        return 'bg-[#FEF2F2] text-[#DC2626]';
      case 'PARTIALLY_PAID':
        return 'bg-[#FEFCE8] text-[#CA8A04]';
      default:
        return 'bg-[#F1F5F9] text-[#64748B]';
    }
  }
}
