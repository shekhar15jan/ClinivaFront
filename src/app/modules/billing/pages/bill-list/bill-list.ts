import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Bill, amountDueInPaisa } from '../../../../core/models/billing.model';
import { BillingService } from '../../../../core/services/billing.service';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-bill-list',
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-on-surface">Bills & Invoices</h1>
      </div>

      <div class="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden">
        <div class="p-4 border-b border-outline-variant flex gap-3 flex-wrap">
          <div class="relative flex-1 min-w-[200px]">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
            <input id="bill-search" type="search" [(ngModel)]="searchQuery" (input)="onSearch()" aria-label="Search bills" placeholder="Search by patient or invoice #..." class="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-primary-light" />
          </div>
          <select [(ngModel)]="statusFilter" (change)="loadBills(0)" aria-label="Payment status" class="px-3 py-2 border border-outline-variant rounded-lg text-sm bg-surface-container-lowest focus:outline-none focus:border-primary-light">
            <option value="">All Status</option>
            <option value="PAID">Paid</option>
            <option value="UNPAID">Unpaid</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
          </select>
        </div>

        @if (isLoading) {
          <div class="flex justify-center py-12"><div class="w-10 h-10 border-4 border-gray-200 border-t-[#003d9b] rounded-full animate-spin"></div></div>
        }

        @if (!isLoading && bills.length === 0) {
          <div class="text-center py-12 text-sm text-gray-500">No bills found.</div>
        }

        @if (!isLoading) {
          <div class="overflow-x-auto hidden md:block">
            <table class="w-full">
              <thead><tr class="bg-surface-container text-left">
                <th class="px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase">Invoice #</th>
                <th class="px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase">Patient</th>
                <th class="px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase">Date</th>
                <th class="px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase">Total</th>
                <th class="px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase">Paid</th>
                <th class="px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase">Due</th>
                <th class="px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase">Status</th>
                <th class="px-4 py-3 text-xs font-semibold text-on-surface-variant uppercase">Actions</th>
              </tr></thead>
              <tbody>
                @for (bill of bills; track bill.id) {
                  <tr class="border-t border-outline-variant hover:bg-surface-container transition-colors">
                    <td class="px-4 py-3 text-sm font-mono font-medium text-on-surface">{{ bill.billNumber || 'INV-' + bill.id.substring(0, 6) }}</td>
                    <td class="px-4 py-3 text-sm font-medium text-on-surface">{{ bill.patient.fullName }}</td>
                    <td class="px-4 py-3 text-sm text-on-surface-variant">{{ bill.createdAt | date: 'mediumDate' }}</td>
                    <td class="px-4 py-3 text-sm font-semibold text-on-surface">₹{{ (bill.totalAmountInPaisa || 0) / 100 }}</td>
                    <td class="px-4 py-3 text-sm text-on-surface-variant">₹{{ ((bill.totalAmountInPaisa || 0) - due(bill)) / 100 }}</td>
                    <td class="px-4 py-3 text-sm text-red-600 font-medium">₹{{ due(bill) / 100 }}</td>
                    <td class="px-4 py-3"><span [class]="statusClass(bill.paymentStatus)" class="px-2.5 py-0.5 rounded-full text-xs font-medium">{{ bill.paymentStatus }}</span></td>
                    <td class="px-4 py-3">
                      <a [routerLink]="[bill.id]" class="text-primary hover:underline text-sm font-medium">View</a>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div class="md:hidden divide-y divide-outline-variant">
            @for (bill of bills; track bill.id) {
              <a [routerLink]="[bill.id]" class="flex items-center justify-between p-4 hover:bg-surface-container transition-colors cursor-pointer">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-primary-container text-primary-on-container">{{ bill.billNumber || 'INV-' + bill.id.substring(0, 6) }}</span>
                    <span [class]="statusClass(bill.paymentStatus)" class="px-2 py-0.5 rounded-full text-xs font-medium">{{ bill.paymentStatus }}</span>
                  </div>
                  <p class="text-sm font-medium text-on-surface truncate">{{ bill.patient.fullName }}</p>
                  <p class="text-xs text-on-surface-variant mt-0.5">{{ bill.createdAt | date: 'mediumDate' }}</p>
                </div>
                <div class="flex items-center gap-2 ml-3 shrink-0">
                  <span class="text-sm font-semibold text-on-surface whitespace-nowrap">₹{{ (bill.totalAmountInPaisa || 0) / 100 }}</span>
                  <span class="material-symbols-outlined text-on-surface-variant text-lg">chevron_right</span>
                </div>
              </a>
            }
          </div>
          @if (totalPages > 1) {
            <nav class="flex items-center justify-between px-4 py-3 border-t border-outline-variant text-sm" aria-label="Pages">
              <span class="text-on-surface-variant">{{ totalElements }} bills &middot; page {{ page + 1 }} of {{ totalPages }}</span>
              <div class="flex gap-2">
                <button id="bills-prev" type="button" (click)="goToPage(page - 1)" [disabled]="page === 0"
                        class="px-3 py-1.5 border border-outline-variant rounded-lg disabled:opacity-40">Previous</button>
                <button id="bills-next" type="button" (click)="goToPage(page + 1)" [disabled]="page >= totalPages - 1"
                        class="px-3 py-1.5 border border-outline-variant rounded-lg disabled:opacity-40">Next</button>
              </div>
            </nav>
          }
        }
      </div>
    </div>
  `,
  imports: [FormsModule, RouterLink, DatePipe],
})
export class BillList implements OnInit, OnDestroy {
  private billingService = inject(BillingService);

  /** One page; status, search and paging run on the server (it had only the first 50 and ignored both). */
  bills: Bill[] = [];
  page = 0;
  totalPages = 1;
  totalElements = 0;
  isLoading = false;
  searchQuery = '';
  statusFilter = '';
  private searchTimer?: ReturnType<typeof setTimeout>;

  ngOnInit() {
    this.loadBills();
  }

  ngOnDestroy(): void {
    clearTimeout(this.searchTimer);
  }

  due(bill: Bill): number {
    return amountDueInPaisa(bill);
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages || page === this.page) return;
    this.loadBills(page);
  }

  loadBills(page = this.page) {
    this.isLoading = true;
    this.billingService.getBills(page, 20, this.statusFilter || undefined, this.searchQuery).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.bills = res.data.content || [];
          this.page = res.data.pageNumber;
          this.totalPages = Math.max(1, res.data.totalPages);
          this.totalElements = res.data.totalElements;
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  /** Searches once typing pauses, from the first page. */
  onSearch() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.loadBills(0), 300);
  }

  statusClass(status: string): string {
    switch (status) {
      case 'PAID': return 'bg-[#ECFDF5] text-[#059669]';
      case 'UNPAID': return 'bg-[#FEF2F2] text-[#DC2626]';
      case 'PARTIALLY_PAID': return 'bg-[#FEFCE8] text-[#CA8A04]';
      default: return 'bg-[#F1F5F9] text-[#64748B]';
    }
  }
}
