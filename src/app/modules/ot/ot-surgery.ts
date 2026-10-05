import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { OtService } from '../../core/services/ot.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { ANAESTHESIA, SURGERY_STATUS_LABEL, Step, SurgeryView } from '../../core/models/ot.model';

type StepKey = 'consent' | 'sign-in' | 'time-out' | 'sign-out';

/**
 * One surgery on the day, made for a phone in theatre: consent and the WHO checklist as big steps in order (the next
 * one lit), the operation note, then sign out. The desk bills a day case here.
 */
@Component({
  selector: 'app-ot-surgery',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe],
  template: `
    <div class="p-4 sm:p-6 max-w-4xl">
      <a routerLink=".." class="text-sm text-primary flex items-center gap-1 mb-3"><span class="material-symbols-outlined text-lg">arrow_back</span> Operation theatre</a>
      @if (error) {
        <div class="p-3 rounded-lg bg-red-50 text-sm text-red-700" id="ot-error">{{ error }}</div>
      } @else if (!s) {
        <p class="text-sm text-slate-600">Loading…</p>
      } @else {
        <div class="bg-white rounded-xl border border-outline-variant p-4 border-l-4 mb-3" [style.border-left-color]="s.priority === 'EMERGENCY' ? '#dc2626' : '#0d9488'" id="ot-header">
          <div class="flex justify-between gap-2 flex-wrap">
            <h1 class="text-xl font-semibold">{{ s.patientName }} <span class="text-sm font-normal text-slate-600">{{ s.patientCode }}{{ s.patientAge !== null ? ' · ' + s.patientAge + ' y' : '' }}{{ s.patientGender ? ' · ' + s.patientGender.toLowerCase() : '' }}</span></h1>
            <span class="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100" id="ot-status">{{ statusLabel }}</span>
          </div>
          <p class="font-semibold mt-1" id="ot-procedure-line">{{ s.procedureName }}{{ s.side && s.side !== 'NA' ? ' · ' + s.side + ' side' : '' }}</p>
          <p class="text-sm text-slate-700">{{ s.surgeryNumber }} · {{ s.theatreName }} · {{ s.scheduledStart | date: 'd MMM, h:mm a' }} · {{ s.expectedMinutes }} min</p>
          <p class="text-sm text-slate-700">Dr {{ s.surgeonName }}{{ s.anaesthetistName ? ' · anaesthesia Dr ' + s.anaesthetistName : '' }} · {{ anaesthesiaLabel }}
            {{ s.admissionNumber ? ' · inpatient ' + s.admissionNumber : ' · day case' }}</p>
          @if (s.assistants) { <p class="text-sm text-slate-700">Team: {{ s.assistants }}</p> }
          @if (s.cancelReason) { <p class="text-sm text-status-red mt-1">Cancelled: {{ s.cancelReason }}</p> }
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3" id="ot-checklist">
          @for (st of steps; track st.key) {
            <button type="button" [id]="'step-' + st.key" (click)="doStep(st.key)" [disabled]="busy || !canRecord || !isNext(st.key)"
              class="rounded-xl p-3 text-left min-h-[88px] border-2 disabled:cursor-default" [class]="stepClass(st.key)" [attr.data-done]="!!done(st.key)">
              <p class="font-semibold text-sm flex items-center gap-1"><span class="material-symbols-outlined text-lg">{{ done(st.key) ? 'check_circle' : st.icon }}</span>{{ st.label }}</p>
              <p class="text-xs mt-1">{{ done(st.key) ? (done(st.key)!.at | date: 'h:mm a') + (done(st.key)!.by ? ' · ' + done(st.key)!.by : '') : st.hint }}</p>
            </button>
          }
        </div>

        @if (s.notes) {
          <section class="bg-white rounded-xl border border-outline-variant p-3 mb-3" id="ot-note">
            <h2 class="font-semibold mb-2">Operation note</h2>
            @if (editingNote) {
              <div class="space-y-2">
                <textarea [(ngModel)]="findings" maxlength="4000" rows="3" id="note-findings" aria-label="Findings" placeholder="Findings" class="w-full border border-outline-variant rounded-lg p-2 text-sm"></textarea>
                <textarea [(ngModel)]="procedureDone" maxlength="4000" rows="4" id="note-procedure" aria-label="Procedure done" placeholder="Procedure done" class="w-full border border-outline-variant rounded-lg p-2 text-sm"></textarea>
                <input [(ngModel)]="complications" maxlength="1000" aria-label="Complications" placeholder="Complications (none if blank)" class="w-full border border-outline-variant rounded-lg p-2 text-sm" />
                <div class="grid grid-cols-2 gap-2">
                  <input type="number" min="0" [(ngModel)]="bloodLoss" aria-label="Blood loss ml" placeholder="Blood loss (ml)" class="border border-outline-variant rounded-lg p-2 text-sm" />
                  <input [(ngModel)]="implants" maxlength="500" aria-label="Implants" placeholder="Implants (optional)" class="border border-outline-variant rounded-lg p-2 text-sm" />
                </div>
                <textarea [(ngModel)]="postOp" maxlength="2000" rows="2" aria-label="Post-operative orders" placeholder="Post-operative orders" class="w-full border border-outline-variant rounded-lg p-2 text-sm"></textarea>
                <div class="flex gap-2">
                  <button type="button" id="save-note" (click)="saveNote()" [disabled]="busy || !procedureDone.trim()"
                    class="px-4 min-h-touch rounded-lg bg-primary text-white text-sm font-semibold disabled:opacity-50">Save note</button>
                  <button type="button" (click)="editingNote = false" class="px-4 min-h-touch rounded-lg border border-outline-variant text-sm">Cancel</button>
                </div>
              </div>
            } @else if (s.procedureDone) {
              <div class="text-sm space-y-1" id="ot-note-text">
                @if (s.findings) { <p><b>Findings:</b> {{ s.findings }}</p> }
                <p><b>Procedure:</b> {{ s.procedureDone }}</p>
                <p><b>Complications:</b> {{ s.complications || 'None' }}</p>
                @if (s.bloodLossMl !== null) { <p><b>Blood loss:</b> {{ s.bloodLossMl }} ml</p> }
                @if (s.implants) { <p><b>Implants:</b> {{ s.implants }}</p> }
                @if (s.postOpOrders) { <p><b>Post-op:</b> {{ s.postOpOrders }}</p> }
                <p class="text-xs text-slate-600">By {{ s.noteBy }}</p>
              </div>
            } @else {
              <p class="text-sm text-slate-600">Written once the surgery starts.</p>
            }
            @if (canRecord && s.status === 'IN_PROGRESS' && !editingNote) {
              <button type="button" id="write-note" (click)="startNote()" class="mt-2 px-3 min-h-touch rounded-lg border border-outline-variant text-sm">{{ s.procedureDone ? 'Correct note' : 'Write note' }}</button>
            }
          </section>
        } @else {
          <p class="text-xs text-slate-600 mb-3">The operation note is for the clinical team.</p>
        }

        <section class="bg-white rounded-xl border border-outline-variant p-3 mb-3 text-sm" id="ot-fees">
          <h2 class="font-semibold mb-1">Fees</h2>
          <p>Surgeon {{ money(s.surgeonFeeInPaisa) }} · Anaesthesia {{ money(s.anaesthesiaFeeInPaisa) }} · Theatre {{ money(s.theatreFeeInPaisa) }}</p>
          <p class="text-xs text-slate-600">{{ s.chargesPosted ? (s.admissionId ? 'Charged to the stay.' : 'Billed: ' + s.billNumber) : 'Charged when the surgery is signed out.' }}</p>
        </section>

        <div class="flex gap-2 flex-wrap">
          @if (canBill && !s.admissionId && s.status === 'COMPLETED' && !s.billId) {
            <button type="button" id="ot-bill" (click)="run(ot.bill(s.id), 'Bill made')" class="act bg-orange-600"><span class="material-symbols-outlined text-lg">receipt_long</span> Bill {{ money(total) }}</button>
          }
          @if (s.billId && canBill) {
            <a [routerLink]="['../../billing', s.billId]" class="act bg-slate-600"><span class="material-symbols-outlined text-lg">request_quote</span> Bill {{ s.billNumber }}</a>
          }
          @if (canSchedule && s.status === 'SCHEDULED') {
            <button type="button" id="ot-cancel" (click)="cancel()" class="act bg-red-700"><span class="material-symbols-outlined text-lg">event_busy</span> Cancel surgery</button>
          }
        </div>
      }
    </div>
  `,
  styles: [`.act { display: flex; align-items: center; gap: 0.25rem; padding: 0 1rem; min-height: 44px; border-radius: 0.5rem; color: white; font-size: 0.875rem; font-weight: 600; }`],
})
export class OtSurgeryComponent implements OnInit {
  readonly ot = inject(OtService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);

  readonly steps: { key: StepKey; label: string; icon: string; hint: string }[] = [
    { key: 'consent', label: 'Consent', icon: 'draw', hint: 'Signed consent on file' },
    { key: 'sign-in', label: 'Sign in', icon: 'how_to_reg', hint: 'Before anaesthesia: identity, site, allergies' },
    { key: 'time-out', label: 'Time out', icon: 'pan_tool', hint: 'Before incision: team confirms; surgery starts' },
    { key: 'sign-out', label: 'Sign out', icon: 'task_alt', hint: 'Counts, specimens; after the note' },
  ];

  s: SurgeryView | null = null;
  error = '';
  busy = false;
  editingNote = false;
  findings = '';
  procedureDone = '';
  complications = '';
  bloodLoss: number | null = null;
  implants = '';
  postOp = '';

  get canRecord(): boolean {
    return this.auth.can('OT_RECORD');
  }

  get canSchedule(): boolean {
    return this.auth.can('OT_SCHEDULE');
  }

  get canBill(): boolean {
    return this.auth.can('BILLING');
  }

  get statusLabel(): string {
    return SURGERY_STATUS_LABEL[this.s!.status];
  }

  get anaesthesiaLabel(): string {
    return ANAESTHESIA.find((a) => a.value === this.s?.anaesthesiaType)?.label ?? '';
  }

  get total(): number {
    return this.s ? this.s.surgeonFeeInPaisa + this.s.anaesthesiaFeeInPaisa + this.s.theatreFeeInPaisa : 0;
  }

  ngOnInit(): void {
    this.ot.get(this.route.snapshot.paramMap.get('id')!).subscribe({
      next: (s) => (this.s = s),
      error: (err) => (this.error = err?.error?.message || 'The surgery could not be loaded.'),
    });
  }

  done(key: StepKey): Step | null {
    if (!this.s) return null;
    return { consent: this.s.consent, 'sign-in': this.s.signIn, 'time-out': this.s.timeOut, 'sign-out': this.s.signOut }[key];
  }

  /** The one step that can be done now. */
  isNext(key: StepKey): boolean {
    const s = this.s;
    if (!s || s.status === 'CANCELLED' || s.status === 'COMPLETED') return false;
    const next = !s.consent ? 'consent' : !s.signIn ? 'sign-in' : !s.timeOut ? 'time-out' : s.procedureDone ? 'sign-out' : null;
    return next === key;
  }

  stepClass(key: StepKey): string {
    if (this.done(key)) return 'bg-emerald-50 border-emerald-500 text-emerald-900';
    if (this.isNext(key) && this.canRecord) return 'bg-teal-600 border-teal-600 text-white';
    return 'bg-white border-outline-variant text-slate-600';
  }

  doStep(key: StepKey): void {
    const label = this.steps.find((x) => x.key === key)!.label;
    this.run(this.ot.step(this.s!.id, key), `${label} done`);
  }

  startNote(): void {
    const s = this.s!;
    this.editingNote = true;
    this.findings = s.findings ?? '';
    this.procedureDone = s.procedureDone ?? '';
    this.complications = s.complications ?? '';
    this.bloodLoss = s.bloodLossMl;
    this.implants = s.implants ?? '';
    this.postOp = s.postOpOrders ?? '';
  }

  saveNote(): void {
    this.run(this.ot.note(this.s!.id, {
      findings: this.findings.trim() || null,
      procedureDone: this.procedureDone.trim(),
      complications: this.complications.trim() || null,
      bloodLossMl: this.bloodLoss,
      implants: this.implants.trim() || null,
      postOpOrders: this.postOp.trim() || null,
    }), 'Operation note saved', () => (this.editingNote = false));
  }

  cancel(): void {
    const reason = window.prompt('Why cancel this surgery?');
    if (!reason || !reason.trim()) return;
    this.run(this.ot.cancel(this.s!.id, reason.trim()), 'Surgery cancelled');
  }

  run(call: Observable<SurgeryView>, done: string, after?: () => void): void {
    if (this.busy) return;
    this.busy = true;
    call.subscribe({
      next: (s) => {
        this.busy = false;
        this.s = s;
        after?.();
        this.toast.success(done);
      },
      error: (err) => {
        this.busy = false;
        this.toast.error(err?.error?.message || 'That did not work.');
      },
    });
  }

  money(paisa: number): string {
    return '₹' + (paisa / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  }
}
