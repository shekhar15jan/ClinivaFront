import { Component, OnInit, inject } from '@angular/core';
import { BillingService } from '../../../../core/services/billing.service';
import { Bill } from '../../../../core/models/billing.model';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-my-bills',
  template: `
    <div class="p-4 sm:p-6">
      <h2 class="text-headline-md text-on-surface mb-6">My Bills</h2>
      @if (isLoading) {
        <div class="flex justify-center py-12"><div class="w-10 h-10 border-4 border-gray-200 border-t-[#003d9b] rounded-full animate-spin"></div></div>
      } @else if (bills.length === 0) {
        <div class="text-center py-12 text-sm text-outline">No bills found.</div>
      } @else {
        <div class="bg-white rounded-xl border border-outline-variant overflow-hidden">
          <div class="hidden md:block">
            <table class="w-full">
              <thead><tr class="bg-surface-container text-left">
                <th class="px-4 py-3 text-xs font-semibold uppercase">Bill #</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase">Date</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase">Total</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase">Paid</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase">Due</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase">Status</th>
              </tr></thead>
              <tbody>
                @for (bill of bills; track bill.id) {
                  <tr class="border-t border-outline-variant">
                    <td class="px-4 py-3 text-sm font-mono text-on-surface">INV-{{ bill.id.substring(0, 6) }}</td>
                    <td class="px-4 py-3 text-sm text-outline">{{ bill.createdAt | date:'mediumDate' }}</td>
                    <td class="px-4 py-3 text-sm font-semibold text-on-surface">₹{{ (bill.totalAmountInPaisa || 0) / 100 }}</td>
                    <td class="px-4 py-3 text-sm text-outline">₹{{ (bill.paymentStatus === 'PAID' ? bill.totalAmountInPaisa : 0) / 100 }}</td>
                    <td class="px-4 py-3 text-sm font-medium text-red-600">₹{{ (bill.paymentStatus !== 'PAID' ? bill.totalAmountInPaisa : 0) / 100 }}</td>
                    <td class="px-4 py-3"><span [class]="statusClass(bill.paymentStatus)" class="px-2 py-0.5 rounded-full text-xs font-medium">{{ bill.paymentStatus }}</span></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <div class="md:hidden divide-y divide-outline-variant">
            @for (bill of bills; track bill.id) {
              <div class="px-4 py-3.5 flex flex-col gap-2">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-mono font-medium text-on-surface">INV-{{ bill.id.substring(0, 6) }}</span>
                  <span [class]="statusClass(bill.paymentStatus)" class="px-2 py-0.5 rounded-full text-xs font-medium">{{ bill.paymentStatus }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-xs text-outline">{{ bill.createdAt | date:'mediumDate' }}</span>
                  <span class="text-sm font-semibold text-on-surface">₹{{ (bill.totalAmountInPaisa || 0) / 100 }}</span>
                </div>
                @if (bill.paymentStatus !== 'PAID') {
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-outline">Due</span>
                    <span class="text-sm font-medium text-red-600">₹{{ (bill.totalAmountInPaisa || 0) / 100 }}</span>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  imports: [DatePipe],
})
export class MyBills implements OnInit {
  private billingService = inject(BillingService);
  bills: Bill[] = [];
  isLoading = false;
  ngOnInit() {
    this.isLoading = true;
    this.billingService.getPatientBills().subscribe({
      next: (res) => { if (res.success) { this.bills = res.data || []; } this.isLoading = false; },
      error: () => { this.isLoading = false; },
    });
  }
  statusClass(status: string): string {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-700';
      case 'UNPAID': return 'bg-red-100 text-red-700';
      case 'PARTIALLY_PAID': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  }
}
