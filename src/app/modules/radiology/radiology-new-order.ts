import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RadiologyService } from '../../core/services/radiology.service';
import { PatientService } from '../../core/services/patient.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { ImagingPriority, MODALITIES, Modality, StudyView } from '../../core/models/radiology.model';
import { formatMoney } from '../../core/utils/money';

/** Ordering imaging for a patient (from their screen or their stay): tap the studies, urgent or not, a note for radiology. */
@Component({
  selector: 'app-radiology-new-order',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="p-4 sm:p-6 max-w-4xl">
      <a routerLink=".." class="text-sm text-primary flex items-center gap-1 mb-3"><span class="material-symbols-outlined text-lg">arrow_back</span> Radiology</a>
      <h1 class="text-2xl font-semibold text-on-surface">Order imaging</h1>
      <p class="text-sm text-slate-700 mt-1 mb-3" id="rad-order-for">For <b>{{ patientName || '…' }}</b>{{ admissionId ? ' (charged to the stay)' : '' }}</p>

      <input [(ngModel)]="q" id="study-search" aria-label="Search studies" placeholder="Search studies" class="w-full sm:w-80 border border-outline-variant rounded-lg p-2.5 text-sm mb-3" />
      @for (m of modalities; track m.value) {
        @if (inModality(m.value).length) {
          <h2 class="text-sm font-semibold text-slate-700 mt-3 mb-1 flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full" [class]="m.colour"></span>{{ m.label }}</h2>
          <div class="flex gap-2 flex-wrap">
            @for (s of inModality(m.value); track s.id) {
              <button type="button" (click)="toggle(s)" class="px-3 min-h-touch rounded-full text-sm border" [attr.data-study]="s.code"
                [class]="chosen.has(s.id) ? 'bg-violet-600 text-white border-violet-600' : 'bg-white border-outline-variant'">{{ s.name }} · {{ money(s.priceInPaisa) }}</button>
            }
          </div>
        }
      }
      @if (studies.length === 0) { <p class="text-sm text-slate-600">No studies in the catalog yet.</p> }
      @for (s of chosenStudies; track s.id) {
        @if (s.preparation || s.formFRequired) {
          <p class="text-xs mt-2 p-2 rounded-lg bg-amber-50 text-amber-900"><b>{{ s.name }}:</b> {{ s.preparation }}{{ s.formFRequired ? ' Form F (PCPNDT) is filled before the scan.' : '' }}</p>
        }
      }

      <div class="sticky bottom-0 bg-surface mt-4 pt-3 space-y-2">
        <div class="flex gap-2 items-center flex-wrap">
          @for (p of priorities; track p) {
            <button type="button" (click)="priority = p" class="px-3 min-h-touch rounded-full text-sm border"
              [class]="priority === p ? (p === 'URGENT' ? 'bg-red-600 text-white border-red-600' : 'bg-primary text-white border-primary') : 'bg-white border-outline-variant'">
              {{ p === 'URGENT' ? 'Urgent' : 'Routine' }}</button>
          }
          <input [(ngModel)]="note" maxlength="500" aria-label="Clinical details" placeholder="Clinical details, e.g. cough 2 weeks"
            class="flex-1 min-w-[200px] border border-outline-variant rounded-lg p-2.5 text-sm" />
        </div>
        <button type="button" id="place-imaging-order" (click)="order()" [disabled]="busy || chosen.size === 0 || !patientId"
          class="w-full min-h-touch rounded-lg bg-primary text-white text-sm font-semibold disabled:opacity-50">
          Order {{ chosen.size }} {{ chosen.size === 1 ? 'study' : 'studies' }} · {{ money(total) }}</button>
      </div>
    </div>
  `,
})
export class RadiologyNewOrderComponent implements OnInit {
  private radiology = inject(RadiologyService);
  private patients = inject(PatientService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly modalities = MODALITIES;
  readonly priorities: ImagingPriority[] = ['ROUTINE', 'URGENT'];
  studies: StudyView[] = [];
  chosen = new Set<string>();
  q = '';
  priority: ImagingPriority = 'ROUTINE';
  note = '';
  patientId = '';
  patientName = '';
  admissionId: string | null = null;
  busy = false;

  get chosenStudies(): StudyView[] {
    return this.studies.filter((s) => this.chosen.has(s.id));
  }

  get total(): number {
    return this.chosenStudies.reduce((sum, s) => sum + s.priceInPaisa, 0);
  }

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    this.patientId = params.get('patient') ?? '';
    this.admissionId = params.get('admission');
    if (this.patientId) {
      this.patients.getPatientById(this.patientId).subscribe({ next: (r) => (this.patientName = r.data?.fullName ?? '') });
    }
    this.radiology.studies(true).subscribe({ next: (s) => (this.studies = s) });
  }

  inModality(m: Modality): StudyView[] {
    const q = this.q.trim().toLowerCase();
    return this.studies.filter((s) => s.modality === m && (!q || s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)));
  }

  toggle(s: StudyView): void {
    if (this.chosen.has(s.id)) this.chosen.delete(s.id);
    else this.chosen.add(s.id);
  }

  order(): void {
    if (this.busy || this.chosen.size === 0) return;
    this.busy = true;
    this.radiology.order(this.patientId, [...this.chosen], this.priority, this.note.trim() || null, this.admissionId).subscribe({
      next: (o) => {
        this.busy = false;
        this.toast.success(`${o.orderNumber} ordered`);
        this.router.navigate(['..', o.id], { relativeTo: this.route });
      },
      error: (err) => {
        this.busy = false;
        this.toast.error(err?.error?.message || 'The imaging was not ordered.');
      },
    });
  }

  money(paisa: number): string {
    return formatMoney(paisa);
  }
}
