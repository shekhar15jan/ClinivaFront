import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DepartmentService } from '../../core/services/department.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { PaginatorComponent } from '../../shared/components/paginator/paginator.component';
import { EmergencyAccess } from '../../core/models/department.model';

/**
 * Emergency access ("break the glass"): each time someone opened the record of a patient outside their department,
 * with their reason. Someone else reviews each one, which is what makes the shortcut safe to offer.
 */
@Component({
  selector: 'app-emergency-access-list',
  standalone: true,
  imports: [DatePipe, FormsModule, PaginatorComponent],
  template: `
    <div class="p-4 sm:p-6 max-w-4xl">
      <h1 class="text-2xl font-semibold text-on-surface">Emergency access</h1>
      <p class="text-sm text-slate-600 mt-1 mb-4">Records opened outside a clinician's department, with their reason. Review each one.</p>

      <div class="flex gap-2 mb-4" role="tablist">
        <button type="button" role="tab" id="tab-pending" [attr.aria-selected]="pending" (click)="show(true)"
          class="px-4 min-h-touch text-sm font-semibold rounded-full border"
          [class]="pending ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-700 border-outline-variant'">To review</button>
        <button type="button" role="tab" id="tab-all" [attr.aria-selected]="!pending" (click)="show(false)"
          class="px-4 min-h-touch text-sm font-semibold rounded-full border"
          [class]="!pending ? 'bg-primary text-white border-primary' : 'bg-white text-slate-700 border-outline-variant'">All</button>
      </div>

      @if (loadError) {
        <div class="p-3 rounded-lg bg-red-50 text-sm text-red-700" id="emergency-error">{{ loadError }}</div>
      } @else if (loading && items.length === 0) {
        <p class="text-sm text-slate-600">Loading…</p>
      } @else if (items.length === 0) {
        <div class="bg-white rounded-xl border border-dashed border-outline-variant p-8 text-center" id="no-emergency">
          <span class="material-symbols-outlined text-4xl text-emerald-600">verified_user</span>
          <p class="text-sm text-slate-600 mt-2">{{ pending ? 'Nothing waiting for review.' : 'No emergency access yet.' }}</p>
        </div>
      } @else {
        <div class="space-y-3" id="emergency-list">
          @for (e of items; track e.id) {
            <div class="bg-white rounded-xl border p-4" [class]="e.reviewedAt ? 'border-outline-variant' : 'border-red-200'" [attr.data-id]="e.id">
              <div class="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p class="text-sm font-semibold text-on-surface">{{ e.userName }} opened {{ e.patientName }}
                    @if (e.patientCode) {<span class="font-normal text-slate-600">({{ e.patientCode }})</span>}</p>
                  <p class="text-xs text-slate-600">{{ e.createdAt | date: 'd MMM y, h:mm a' }} · until {{ e.expiresAt | date: 'h:mm a' }}</p>
                </div>
                @if (e.reviewedAt) {
                  <span class="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800">Reviewed by {{ e.reviewedByName }}</span>
                } @else {
                  <span class="px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">To review</span>
                }
              </div>
              <p class="text-sm text-on-surface mt-2 bg-surface-container-low rounded-lg p-2.5">“{{ e.reason }}”</p>
              @if (e.reviewNote) {
                <p class="text-sm text-slate-600 mt-2">Review: {{ e.reviewNote }}</p>
              }
              @if (!e.reviewedAt) {
                @if (reviewing === e.id) {
                  <div class="mt-3 space-y-2">
                    <label [for]="'note-' + e.id" class="block text-sm font-medium">Note (optional)</label>
                    <input [id]="'note-' + e.id" [(ngModel)]="note" maxlength="500" placeholder="e.g. Confirmed with the duty roster"
                      class="w-full border border-outline-variant rounded-lg p-2.5 text-sm" />
                    <div class="flex gap-2">
                      <button type="button" class="px-4 min-h-touch text-sm font-semibold text-white bg-primary rounded-lg" (click)="review(e)">Mark reviewed</button>
                      <button type="button" class="px-4 min-h-touch text-sm border border-outline-variant rounded-lg" (click)="reviewing = null">Cancel</button>
                    </div>
                  </div>
                } @else if (!isMine(e)) {
                  <button type="button" class="mt-3 px-4 min-h-touch text-sm font-semibold text-primary border border-primary rounded-lg"
                    [attr.aria-label]="'Review access by ' + e.userName" (click)="startReview(e)">Review</button>
                } @else {
                  <p class="mt-3 text-xs text-slate-600">Your own access is reviewed by someone else.</p>
                }
              }
            </div>
          }
        </div>
        <app-paginator [totalElements]="total" [pageSize]="size" [currentPage]="page" (pageChange)="onPage($event)"></app-paginator>
      }
    </div>
  `,
})
export class EmergencyAccessListComponent implements OnInit {
  private service = inject(DepartmentService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  items: EmergencyAccess[] = [];
  pending = true;
  page = 0;
  size = 20;
  total = 0;
  loading = false;
  loadError = '';
  reviewing: string | null = null;
  note = '';

  ngOnInit(): void {
    this.load();
  }

  show(pending: boolean): void {
    this.pending = pending;
    this.page = 0;
    this.load();
  }

  onPage(event: { page: number; size: number }): void {
    this.page = event.page;
    this.size = event.size;
    this.load();
  }

  load(): void {
    this.loading = true;
    this.loadError = '';
    this.service.getEmergencyAccess(this.pending, this.page, this.size).subscribe({
      next: (p) => {
        this.items = p.content;
        this.total = p.totalElements;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.loadError = err?.error?.message || 'The list could not be loaded.';
      },
    });
  }

  isMine(e: EmergencyAccess): boolean {
    return e.userId === this.auth.currentUserValue?.id;
  }

  startReview(e: EmergencyAccess): void {
    this.reviewing = e.id;
    this.note = '';
  }

  review(e: EmergencyAccess): void {
    this.service.review(e.id, this.note.trim()).subscribe({
      next: () => {
        this.reviewing = null;
        this.toast.success('Marked as reviewed');
        this.load();
      },
      error: (err) => this.toast.error(err?.error?.message || 'It could not be marked as reviewed.'),
    });
  }
}
