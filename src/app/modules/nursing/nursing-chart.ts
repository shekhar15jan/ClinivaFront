import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NursingService } from '../../core/services/nursing.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import {
  Chart,
  FREQUENCIES,
  Frequency,
  NoteKind,
  OrderView,
  Outcome,
  ROUTES,
  Route,
  SLOT_STYLE,
  Shift,
  Slot,
  VitalsRequest,
} from '../../core/models/nursing.model';

type Tab = 'medicines' | 'vitals' | 'notes';

/**
 * One inpatient's nursing chart, made for a phone at the bedside: tap a dose time to give it (or say why not), record
 * a set of vitals, write a note or the shift handover. Doctors order and stop medicines here too.
 */
@Component({
  selector: 'app-nursing-chart',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe],
  template: `
    <div class="p-4 sm:p-6 max-w-4xl">
      <a routerLink=".." class="text-sm text-primary flex items-center gap-1 mb-3"><span class="material-symbols-outlined text-lg">arrow_back</span> Ward round</a>
      @if (error) {
        <div class="p-3 rounded-lg bg-red-50 text-sm text-red-700" id="chart-error">{{ error }}</div>
      } @else if (!c) {
        <p class="text-sm text-slate-600">Loading…</p>
      } @else {
        <div class="bg-white rounded-xl border border-outline-variant p-3 mb-3" id="chart-header">
          <h1 class="text-lg font-semibold">{{ c.patientName }} <span class="text-sm font-normal text-slate-600">{{ c.patientCode }}</span></h1>
          <p class="text-sm text-slate-700">{{ c.wardName }}{{ c.bedNumber ? ', bed ' + c.bedNumber : '' }} · Dr {{ c.doctorName }} · {{ c.admissionNumber }}</p>
          @if (!c.open) { <p class="text-sm text-slate-600 mt-1" id="chart-closed">Discharged: the chart is read-only.</p> }
        </div>

        <div class="grid grid-cols-3 gap-1 mb-3 bg-surface-container-high rounded-xl p-1" role="tablist">
          @for (t of tabs; track t.value) {
            <button type="button" role="tab" [attr.aria-selected]="tab === t.value" (click)="tab = t.value" [id]="'tab-' + t.value"
              class="min-h-touch rounded-lg text-sm font-semibold" [class]="tab === t.value ? 'bg-white shadow text-primary' : 'text-slate-700'">{{ t.label }}</button>
          }
        </div>

        @if (tab === 'medicines') {
          @if (c.open && canOrder) {
            @if (!ordering) {
              <button type="button" id="order-medicine" (click)="startOrder()" class="mb-3 px-4 min-h-touch text-sm font-semibold text-white bg-primary rounded-lg flex items-center gap-1">
                <span class="material-symbols-outlined text-lg">add</span> Order medicine</button>
            } @else {
              <div class="bg-white rounded-xl border-2 border-primary p-3 mb-3 space-y-2" id="order-form">
                <div class="grid grid-cols-2 gap-2">
                  <input id="order-name" [(ngModel)]="orderName" name="orderName" maxlength="150" placeholder="Medicine" aria-label="Medicine"
                    class="col-span-2 sm:col-span-1 border border-outline-variant rounded-lg p-2.5 text-sm" />
                  <input id="order-dose" [(ngModel)]="orderDose" name="orderDose" maxlength="60" placeholder="Dose, e.g. 650 mg" aria-label="Dose"
                    class="col-span-2 sm:col-span-1 border border-outline-variant rounded-lg p-2.5 text-sm" />
                </div>
                <div class="flex gap-1.5 flex-wrap" id="order-routes">
                  @for (r of routes; track r.value) {
                    <button type="button" (click)="orderRoute = r.value" class="px-3 py-1.5 rounded-full text-sm border"
                      [class]="orderRoute === r.value ? 'bg-teal-600 text-white border-teal-600' : 'bg-white border-outline-variant'">{{ r.label }}</button>
                  }
                </div>
                <div class="flex gap-1.5 flex-wrap" id="order-frequencies">
                  @for (f of frequencies; track f.value) {
                    <button type="button" (click)="orderFrequency = f.value" class="px-3 py-1.5 rounded-full text-sm border" [attr.data-frequency]="f.value"
                      [class]="orderFrequency === f.value ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-outline-variant'">{{ f.label }}</button>
                  }
                </div>
                <div class="flex gap-2 flex-wrap items-center">
                  <input id="order-days" type="number" min="1" max="90" [(ngModel)]="orderDays" name="orderDays" placeholder="Days" aria-label="For how many days"
                    class="w-24 border border-outline-variant rounded-lg p-2.5 text-sm" />
                  <input [(ngModel)]="orderInstructions" name="orderInstructions" maxlength="255" placeholder="Instructions, e.g. after food" aria-label="Instructions"
                    class="flex-1 min-w-[180px] border border-outline-variant rounded-lg p-2.5 text-sm" />
                </div>
                <div class="flex gap-2">
                  <button type="button" id="order-save" (click)="saveOrder()" [disabled]="busy || !orderReady"
                    class="px-5 min-h-touch text-sm font-semibold text-white bg-primary rounded-lg disabled:opacity-50">Order</button>
                  <button type="button" (click)="ordering = false" class="px-4 min-h-touch text-sm border border-outline-variant rounded-lg">Cancel</button>
                </div>
              </div>
            }
          }

          @if (pending) {
            <div class="bg-white rounded-xl border-2 border-blue-600 p-3 mb-3 space-y-2" id="dose-sheet">
              <p class="font-semibold">{{ pending.order.medicineName }} {{ pending.order.dose }}
                <span class="text-sm font-normal text-slate-600">{{ pending.slot ? (pending.slot.at | date: 'h:mm a, d MMM') : 'as needed' }}</span></p>
              <button type="button" id="dose-given" (click)="give('GIVEN')" [disabled]="busy"
                class="w-full min-h-touch text-base font-semibold text-white bg-emerald-600 rounded-lg disabled:opacity-50">Given</button>
              <div class="grid grid-cols-3 gap-2">
                @for (o of notGiven; track o) {
                  <button type="button" (click)="outcome = o" class="min-h-touch rounded-lg text-sm border" [attr.data-outcome]="o"
                    [class]="outcome === o ? 'bg-amber-500 text-white border-amber-500' : 'bg-white border-outline-variant'">{{ o.charAt(0) + o.slice(1).toLowerCase() }}</button>
                }
              </div>
              @if (outcome !== 'GIVEN') {
                <input id="dose-reason" [(ngModel)]="doseNote" name="doseNote" maxlength="255" placeholder="Why not given" aria-label="Why not given"
                  class="w-full border border-outline-variant rounded-lg p-2.5 text-sm" />
                <button type="button" id="dose-save" (click)="give(outcome)" [disabled]="busy || doseNote.trim().length < 2"
                  class="w-full min-h-touch text-sm font-semibold text-white bg-amber-600 rounded-lg disabled:opacity-50">Save</button>
              }
              <button type="button" (click)="pending = null" class="w-full min-h-touch text-sm border border-outline-variant rounded-lg">Cancel</button>
            </div>
          }

          <div class="space-y-2" id="orders">
            @for (o of c.orders; track o.id) {
              <div class="bg-white rounded-xl border border-outline-variant p-3" [class.opacity-60]="o.status === 'STOPPED'" [attr.data-order]="o.medicineName">
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <p class="font-semibold">{{ o.medicineName }} {{ o.dose }} <span class="text-sm font-normal text-slate-600">{{ o.route }} · {{ o.frequency }}</span></p>
                    @if (o.instructions) { <p class="text-sm text-slate-700">{{ o.instructions }}</p> }
                    <p class="text-xs text-slate-600">By {{ o.orderedBy }} · {{ o.startAt | date: 'd MMM' }}{{ o.endAt ? ' to ' + (o.endAt | date: 'd MMM') : '' }}
                      @if (o.status === 'STOPPED') { · stopped: {{ o.stopReason }} }</p>
                  </div>
                  @if (c.open && canOrder && o.status === 'ACTIVE') {
                    <button type="button" (click)="stopOrder(o)" class="text-sm text-status-red underline" [attr.aria-label]="'Stop ' + o.medicineName">Stop</button>
                  }
                </div>
                @if (o.frequency === 'SOS') {
                  @if (c.open && canRecord && o.status === 'ACTIVE') {
                    <button type="button" (click)="openDose(o, null)" class="mt-2 px-3 min-h-touch rounded-lg text-sm font-semibold bg-blue-600 text-white">Give now</button>
                  }
                } @else {
                  <div class="flex gap-1.5 flex-wrap mt-2">
                    @for (s of o.slots; track s.at) {
                      <button type="button" (click)="openDose(o, s)" [disabled]="!canGive(s)" class="px-2.5 py-1.5 rounded-lg border text-xs font-semibold"
                        [class]="slotStyle(s)" [attr.data-slot]="s.state" [attr.aria-label]="o.medicineName + ' ' + (s.at | date: 'h:mm a') + ' ' + s.state.toLowerCase()">
                        {{ s.at | date: 'h:mm a' }}{{ s.outcome ? ' ✓' : '' }}
                      </button>
                    }
                    @if (o.slots.length === 0) { <span class="text-xs text-slate-600">No doses in the last 12 hours or later today.</span> }
                  </div>
                }
              </div>
            }
            @if (c.orders.length === 0) { <p class="text-sm text-slate-600">No medicines ordered.</p> }
          </div>
        }

        @if (tab === 'vitals') {
          @if (c.open && canRecord) {
            <div class="bg-white rounded-xl border border-outline-variant p-3 mb-3 space-y-2" id="vitals-form">
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <input id="v-temp" type="number" step="0.1" [(ngModel)]="v.temperatureC" name="temp" placeholder="Temp °C" aria-label="Temperature" inputmode="decimal" class="border border-outline-variant rounded-lg p-2.5 text-sm" />
                <input id="v-pulse" type="number" [(ngModel)]="v.pulse" name="pulse" placeholder="Pulse" aria-label="Pulse" inputmode="numeric" class="border border-outline-variant rounded-lg p-2.5 text-sm" />
                <input id="v-sys" type="number" [(ngModel)]="v.systolic" name="sys" placeholder="BP sys" aria-label="Systolic" inputmode="numeric" class="border border-outline-variant rounded-lg p-2.5 text-sm" />
                <input id="v-dia" type="number" [(ngModel)]="v.diastolic" name="dia" placeholder="BP dia" aria-label="Diastolic" inputmode="numeric" class="border border-outline-variant rounded-lg p-2.5 text-sm" />
                <input id="v-rr" type="number" [(ngModel)]="v.respiratoryRate" name="rr" placeholder="Resp/min" aria-label="Respiratory rate" inputmode="numeric" class="border border-outline-variant rounded-lg p-2.5 text-sm" />
                <input id="v-spo2" type="number" [(ngModel)]="v.spo2" name="spo2" placeholder="SpO₂ %" aria-label="SpO2" inputmode="numeric" class="border border-outline-variant rounded-lg p-2.5 text-sm" />
                <input id="v-sugar" type="number" [(ngModel)]="v.bloodSugar" name="sugar" placeholder="Sugar mg/dL" aria-label="Blood sugar" inputmode="numeric" class="border border-outline-variant rounded-lg p-2.5 text-sm" />
                <input id="v-weight" type="number" step="0.1" [(ngModel)]="v.weightKg" name="weight" placeholder="Weight kg" aria-label="Weight" inputmode="decimal" class="border border-outline-variant rounded-lg p-2.5 text-sm" />
              </div>
              <div class="flex gap-1 flex-wrap items-center" id="v-pain">
                <span class="text-sm mr-1">Pain</span>
                @for (n of painScale; track n) {
                  <button type="button" (click)="v.painScore = v.painScore === n ? null : n" class="w-9 h-9 rounded-full text-sm border"
                    [class]="v.painScore === n ? 'bg-rose-600 text-white border-rose-600' : 'bg-white border-outline-variant'">{{ n }}</button>
                }
              </div>
              <button type="button" id="vitals-save" (click)="saveVitals()" [disabled]="busy || !hasReading"
                class="w-full min-h-touch text-sm font-semibold text-white bg-primary rounded-lg disabled:opacity-50">Save vitals</button>
            </div>
          }
          <div class="space-y-2" id="vitals">
            @for (x of c.vitals; track x.id) {
              <div class="bg-white rounded-xl border p-3 text-sm" [class]="x.flags.length ? 'border-red-300' : 'border-outline-variant'">
                <p class="text-xs text-slate-600">{{ x.recordedAt | date: 'd MMM, h:mm a' }} · {{ x.recordedBy }}</p>
                <p>
                  @if (has(x.temperatureC)) { T {{ x.temperatureC }}°C · }
                  @if (has(x.pulse)) { P {{ x.pulse }} · }
                  @if (has(x.systolic)) { BP {{ x.systolic }}/{{ x.diastolic ?? '–' }} · }
                  @if (has(x.respiratoryRate)) { RR {{ x.respiratoryRate }} · }
                  @if (has(x.spo2)) { SpO₂ {{ x.spo2 }}% · }
                  @if (has(x.painScore)) { Pain {{ x.painScore }}/10 · }
                  @if (has(x.bloodSugar)) { Sugar {{ x.bloodSugar }} · }
                  @if (has(x.weightKg)) { {{ x.weightKg }} kg }
                </p>
                @if (x.flags.length) {
                  <div class="flex gap-1 flex-wrap mt-1">@for (f of x.flags; track f) { <span class="px-2 py-0.5 rounded-full text-xs bg-red-50 text-red-800 border border-red-200">{{ f }}</span> }</div>
                }
              </div>
            }
            @if (c.vitals.length === 0) { <p class="text-sm text-slate-600">No vitals recorded yet.</p> }
          </div>
        }

        @if (tab === 'notes') {
          @if (c.open && canRecord) {
            <div class="bg-white rounded-xl border border-outline-variant p-3 mb-3 space-y-2" id="note-form">
              <div class="flex gap-1.5 flex-wrap">
                @for (k of kinds; track k.value) {
                  <button type="button" (click)="noteKind = k.value" class="px-3 py-1.5 rounded-full text-sm border"
                    [class]="noteKind === k.value ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-outline-variant'">{{ k.label }}</button>
                }
                <span class="mx-1"></span>
                @for (s of shifts; track s.value) {
                  <button type="button" (click)="noteShift = noteShift === s.value ? null : s.value" class="px-3 py-1.5 rounded-full text-sm border"
                    [class]="noteShift === s.value ? 'bg-slate-700 text-white border-slate-700' : 'bg-white border-outline-variant'">{{ s.label }}</button>
                }
              </div>
              <textarea id="note-text" [(ngModel)]="noteText" name="noteText" rows="3" maxlength="4000" placeholder="What happened, what to watch"
                aria-label="Note" class="w-full border border-outline-variant rounded-lg p-2.5 text-sm"></textarea>
              <button type="button" id="note-save" (click)="saveNote()" [disabled]="busy || noteText.trim().length < 3"
                class="w-full min-h-touch text-sm font-semibold text-white bg-primary rounded-lg disabled:opacity-50">Save note</button>
            </div>
          }
          <div class="space-y-2" id="notes">
            @for (n of c.notes; track n.id) {
              <div class="bg-white rounded-xl border border-outline-variant p-3 text-sm border-l-4" [style.border-left-color]="n.kind === 'INCIDENT' ? '#dc2626' : n.kind === 'HANDOVER' ? '#4f46e5' : '#94a3b8'">
                <p class="text-xs text-slate-600">{{ n.kind.toLowerCase() }}{{ n.shift ? ' · ' + n.shift.toLowerCase() + ' shift' : '' }} · {{ n.at | date: 'd MMM, h:mm a' }} · {{ n.by }}</p>
                <p class="whitespace-pre-line">{{ n.text }}</p>
              </div>
            }
            @if (c.notes.length === 0) { <p class="text-sm text-slate-600">No notes yet.</p> }
          </div>
        }
      }
    </div>
  `,
})
export class NursingChartComponent implements OnInit {
  private nursing = inject(NursingService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);

  readonly tabs: { value: Tab; label: string }[] = [
    { value: 'medicines', label: 'Medicines' },
    { value: 'vitals', label: 'Vitals' },
    { value: 'notes', label: 'Notes' },
  ];
  readonly routes = ROUTES;
  readonly frequencies = FREQUENCIES;
  readonly notGiven: Outcome[] = ['HELD', 'REFUSED', 'MISSED'];
  readonly painScale = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  readonly kinds: { value: NoteKind; label: string }[] = [
    { value: 'NOTE', label: 'Note' },
    { value: 'HANDOVER', label: 'Handover' },
    { value: 'INCIDENT', label: 'Incident' },
  ];
  readonly shifts: { value: Shift; label: string }[] = [
    { value: 'MORNING', label: 'Morning' },
    { value: 'EVENING', label: 'Evening' },
    { value: 'NIGHT', label: 'Night' },
  ];

  c: Chart | null = null;
  error = '';
  tab: Tab = 'medicines';
  busy = false;

  pending: { order: OrderView; slot: Slot | null } | null = null;
  outcome: Outcome = 'GIVEN';
  doseNote = '';

  ordering = false;
  orderName = '';
  orderDose = '';
  orderRoute: Route = 'ORAL';
  orderFrequency: Frequency = 'TDS';
  orderDays: number | null = null;
  orderInstructions = '';

  v: VitalsRequest = {};
  noteKind: NoteKind = 'NOTE';
  noteShift: Shift | null = null;
  noteText = '';

  get canRecord(): boolean {
    return this.auth.can('NURSING_RECORD');
  }

  get canOrder(): boolean {
    return this.auth.can('MEDICATION_ORDER');
  }

  get orderReady(): boolean {
    return this.orderName.trim().length >= 2 && this.orderDose.trim().length >= 1;
  }

  get hasReading(): boolean {
    return Object.entries(this.v).some(([k, x]) => k !== 'note' && x !== null && x !== undefined && `${x}` !== '');
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('admissionId')!;
    this.nursing.chart(id).subscribe({
      next: (c) => (this.c = c),
      error: (err) => (this.error = err?.error?.message || 'The chart could not be loaded.'),
    });
  }

  has(value: unknown): boolean {
    return value !== null && value !== undefined;
  }

  slotStyle(s: Slot): string {
    return SLOT_STYLE[s.state];
  }

  canGive(s: Slot): boolean {
    return !!this.c?.open && this.canRecord && !s.outcome;
  }

  openDose(order: OrderView, slot: Slot | null): void {
    if (slot && !this.canGive(slot)) return;
    this.pending = { order, slot };
    this.outcome = 'GIVEN';
    this.doseNote = '';
  }

  give(outcome: Outcome): void {
    const p = this.pending;
    if (!p || this.busy) return;
    this.run(this.nursing.dose(p.order.id, p.slot?.at ?? null, outcome, outcome === 'GIVEN' ? null : this.doseNote.trim()),
      outcome === 'GIVEN' ? `${p.order.medicineName} given` : `${p.order.medicineName}: ${outcome.toLowerCase()}`, () => (this.pending = null));
  }

  startOrder(): void {
    this.ordering = true;
    this.orderName = '';
    this.orderDose = '';
    this.orderRoute = 'ORAL';
    this.orderFrequency = 'TDS';
    this.orderDays = null;
    this.orderInstructions = '';
  }

  saveOrder(): void {
    if (!this.c || !this.orderReady) return;
    this.run(
      this.nursing.order(this.c.admissionId, {
        medicineName: this.orderName.trim(),
        dose: this.orderDose.trim(),
        route: this.orderRoute,
        frequency: this.orderFrequency,
        days: this.orderDays || null,
        instructions: this.orderInstructions.trim() || null,
      }),
      `${this.orderName.trim()} ordered`,
      () => (this.ordering = false),
    );
  }

  stopOrder(o: OrderView): void {
    const reason = window.prompt(`Why stop ${o.medicineName}?`);
    if (!reason || !reason.trim()) return;
    this.run(this.nursing.stop(o.id, reason.trim()), `${o.medicineName} stopped`);
  }

  saveVitals(): void {
    if (!this.c || !this.hasReading) return;
    const clean: VitalsRequest = {};
    for (const [k, x] of Object.entries(this.v)) {
      if (x !== null && x !== undefined && `${x}` !== '') (clean as Record<string, unknown>)[k] = x;
    }
    this.run(this.nursing.vitals(this.c.admissionId, clean), 'Vitals saved', () => (this.v = {}));
  }

  saveNote(): void {
    if (!this.c || this.noteText.trim().length < 3) return;
    this.run(this.nursing.note(this.c.admissionId, this.noteKind, this.noteShift, this.noteText.trim()), 'Note saved', () => (this.noteText = ''));
  }

  private run(call: ReturnType<NursingService['chart']>, done: string, after?: () => void): void {
    this.busy = true;
    call.subscribe({
      next: (c) => {
        this.busy = false;
        this.c = c;
        after?.();
        this.toast.success(done);
      },
      error: (err) => {
        this.busy = false;
        this.toast.error(err?.error?.message || 'That did not save. Try again.');
      },
    });
  }
}
