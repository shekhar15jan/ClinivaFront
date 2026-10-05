import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LabService } from '../../core/services/lab.service';
import { PatientService } from '../../core/services/patient.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { LAB_CATEGORIES, LabCategory, Priority, TestView } from '../../core/models/lab.model';

/**
 * Ordering tests for a patient (opened from their screen or their stay): tap the tests, mark it urgent if it is,
 * add a note for the lab. An inpatient's tests are charged to the stay.
 */
@Component({
  selector: 'app-lab-new-order',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="p-4 sm:p-6 max-w-4xl">
      <a routerLink=".." class="text-sm text-primary flex items-center gap-1 mb-3"><span class="material-symbols-outlined text-lg">arrow_back</span> Lab</a>
      <h1 class="text-2xl font-semibold text-on-surface">Order tests</h1>
      <p class="text-sm text-slate-700 mt-1 mb-3" id="order-for">For <b>{{ patientName || '…' }}</b>{{ admissionId ? ' (charged to the stay)' : '' }}</p>

      <input [(ngModel)]="q" id="test-search" aria-label="Search tests" placeholder="Search tests" class="w-full sm:w-80 border border-outline-variant rounded-lg p-2.5 text-sm mb-3" />
      @for (c of categories; track c.value) {
        @if (inCategory(c.value).length) {
          <h2 class="text-sm font-semibold text-slate-700 mt-3 mb-1">{{ c.label }}</h2>
          <div class="flex gap-2 flex-wrap">
            @for (t of inCategory(c.value); track t.id) {
              <button type="button" (click)="toggle(t)" class="px-3 min-h-touch rounded-full text-sm border" [attr.data-test]="t.code"
                [class]="chosen.has(t.id) ? 'bg-teal-600 text-white border-teal-600' : 'bg-white border-outline-variant'">{{ t.name }} · {{ money(t.priceInPaisa) }}</button>
            }
          </div>
        }
      }
      @if (tests.length === 0) { <p class="text-sm text-slate-600">No tests in the catalog yet.</p> }

      <div class="sticky bottom-0 bg-surface mt-4 pt-3 space-y-2">
        <div class="flex gap-2 items-center flex-wrap">
          @for (p of priorities; track p) {
            <button type="button" (click)="priority = p" class="px-3 min-h-touch rounded-full text-sm border"
              [class]="priority === p ? (p === 'URGENT' ? 'bg-red-600 text-white border-red-600' : 'bg-primary text-white border-primary') : 'bg-white border-outline-variant'">
              {{ p === 'URGENT' ? 'Urgent' : 'Routine' }}</button>
          }
          <input [(ngModel)]="note" maxlength="500" aria-label="Note for the lab" placeholder="Note for the lab, e.g. fever 4 days"
            class="flex-1 min-w-[200px] border border-outline-variant rounded-lg p-2.5 text-sm" />
        </div>
        <button type="button" id="order-tests" (click)="order()" [disabled]="busy || chosen.size === 0 || !patientId"
          class="w-full min-h-touch rounded-lg bg-primary text-white text-sm font-semibold disabled:opacity-50">
          Order {{ chosen.size }} {{ chosen.size === 1 ? 'test' : 'tests' }} · {{ money(total) }}</button>
      </div>
    </div>
  `,
})
export class LabNewOrderComponent implements OnInit {
  private lab = inject(LabService);
  private patients = inject(PatientService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly categories = LAB_CATEGORIES;
  readonly priorities: Priority[] = ['ROUTINE', 'URGENT'];
  tests: TestView[] = [];
  chosen = new Set<string>();
  q = '';
  priority: Priority = 'ROUTINE';
  note = '';
  patientId = '';
  patientName = '';
  admissionId: string | null = null;
  busy = false;

  get total(): number {
    return this.tests.filter((t) => this.chosen.has(t.id)).reduce((s, t) => s + t.priceInPaisa, 0);
  }

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    this.patientId = params.get('patient') ?? '';
    this.admissionId = params.get('admission');
    if (this.patientId) {
      this.patients.getPatientById(this.patientId).subscribe({ next: (r) => (this.patientName = r.data?.fullName ?? '') });
    }
    this.lab.tests(true).subscribe({ next: (t) => (this.tests = t) });
  }

  inCategory(c: LabCategory): TestView[] {
    const q = this.q.trim().toLowerCase();
    return this.tests.filter((t) => t.category === c && (!q || t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q)));
  }

  toggle(t: TestView): void {
    if (this.chosen.has(t.id)) this.chosen.delete(t.id);
    else this.chosen.add(t.id);
  }

  order(): void {
    if (this.busy || this.chosen.size === 0) return;
    this.busy = true;
    this.lab.order(this.patientId, [...this.chosen], this.priority, this.note.trim() || null, this.admissionId, null).subscribe({
      next: (o) => {
        this.busy = false;
        this.toast.success(`${o.orderNumber} ordered`);
        this.router.navigate(['..', o.id], { relativeTo: this.route });
      },
      error: (err) => {
        this.busy = false;
        this.toast.error(err?.error?.message || 'The tests were not ordered.');
      },
    });
  }

  money(paisa: number): string {
    return '₹' + (paisa / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  }
}
