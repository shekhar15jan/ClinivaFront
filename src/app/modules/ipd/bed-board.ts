import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of, catchError } from 'rxjs';
import { IpdService } from '../../core/services/ipd.service';
import { PatientService } from '../../core/services/patient.service';
import { DoctorService } from '../../core/services/doctor.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { Patient } from '../../core/models/patient.model';
import { Doctor } from '../../core/models/doctor.model';
import {
  ADMISSION_TYPES,
  AdmissionType,
  BedBoard,
  BedView,
  PAYMENT_METHODS,
  PaymentMethod,
  WARD_TYPES,
  WardView,
  labelOf,
  rupees,
} from '../../core/models/ipd.model';
import { CurrencySymbolPipe } from '../../shared/pipes/money.pipe';
import { toMinor } from '../../core/utils/money';

/** Tile colours by bed state; a patient whose discharge is advised stands out in violet. */
const TILE: Record<string, string> = {
  AVAILABLE: 'bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100',
  OCCUPIED: 'bg-blue-50 border-blue-300 text-blue-900 hover:bg-blue-100',
  ADVISED: 'bg-violet-50 border-violet-300 text-violet-900 hover:bg-violet-100',
  CLEANING: 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100',
  MAINTENANCE: 'bg-slate-100 border-slate-300 text-slate-600',
};

/**
 * The bed board: every ward and bed at a glance. A free bed admits a patient; an occupied one opens the stay; a bed
 * waiting for cleaning is marked ready with one tap. Works on a phone for the ward nurse.
 */
@Component({
  selector: 'app-bed-board',
  standalone: true,
  imports: [CurrencySymbolPipe, FormsModule, RouterLink],
  template: `
    <div class="p-4 sm:p-6">
      <div class="flex items-start justify-between flex-wrap gap-3 mb-4">
        <div>
          <h1 class="text-2xl font-semibold text-on-surface">Beds</h1>
          <p class="text-sm text-slate-600 mt-1">Tap a free bed to admit, an occupied bed to open the stay.</p>
        </div>
        <div class="flex gap-2 flex-wrap">
          <a routerLink="admissions" id="go-admissions"
            class="px-4 min-h-touch text-sm font-semibold rounded-lg border border-outline-variant bg-white flex items-center gap-1">
            <span class="material-symbols-outlined text-lg">list_alt</span> Admissions
          </a>
          @if (canSetUp) {
            <a routerLink="wards" id="go-wards"
              class="px-4 min-h-touch text-sm font-semibold rounded-lg border border-outline-variant bg-white flex items-center gap-1">
              <span class="material-symbols-outlined text-lg">settings</span> Wards & beds
            </a>
          }
        </div>
      </div>

      @if (pickingFor) {
        <div class="mb-4 rounded-xl border border-blue-300 bg-blue-50 p-3 text-sm text-blue-900 flex items-center gap-2" id="picking-for">
          <span class="material-symbols-outlined">person_add</span>
          Choose a free (green) bed for <b>{{ pickingFor.fullName }}</b>.
          <button type="button" class="ml-auto underline" (click)="pickingFor = null">Not now</button>
        </div>
      }

      @if (board) {
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4" id="bed-counts">
          <div class="rounded-xl p-3 bg-emerald-600 text-white"><p class="text-xs opacity-90">Free</p><p class="text-2xl font-bold" id="count-available">{{ board.available }}</p></div>
          <div class="rounded-xl p-3 bg-blue-600 text-white"><p class="text-xs opacity-90">Occupied</p><p class="text-2xl font-bold" id="count-occupied">{{ board.occupied }}</p></div>
          <div class="rounded-xl p-3 bg-amber-500 text-white"><p class="text-xs opacity-90">Cleaning</p><p class="text-2xl font-bold">{{ board.cleaning }}</p></div>
          <div class="rounded-xl p-3 bg-slate-600 text-white"><p class="text-xs opacity-90">Total beds</p><p class="text-2xl font-bold">{{ board.total }}</p></div>
        </div>

        @if (board.wards.length > 1) {
          <div class="flex gap-2 overflow-x-auto pb-2 mb-2" id="ward-filter">
            <button type="button" (click)="wardFilter = ''" class="px-3 min-h-touch rounded-full text-sm border whitespace-nowrap"
              [class]="wardFilter === '' ? 'bg-primary text-white border-primary' : 'bg-white border-outline-variant'">All wards</button>
            @for (w of board.wards; track w.id) {
              <button type="button" (click)="wardFilter = w.id" class="px-3 min-h-touch rounded-full text-sm border whitespace-nowrap"
                [class]="wardFilter === w.id ? 'bg-primary text-white border-primary' : 'bg-white border-outline-variant'">
                {{ w.name }} · {{ w.available }} free
              </button>
            }
          </div>
        }
      }

      @if (loadError) {
        <div class="p-3 rounded-lg bg-red-50 text-sm text-red-700" id="board-error">{{ loadError }}</div>
      } @else if (!board) {
        <p class="text-sm text-slate-600">Loading beds…</p>
      } @else if (board.wards.length === 0) {
        <div class="bg-white rounded-xl border border-dashed border-outline-variant p-8 text-center" id="no-wards">
          <span class="material-symbols-outlined text-4xl text-slate-400">bed</span>
          <p class="text-sm text-slate-600 mt-2">No wards yet.
            @if (canSetUp) { <a routerLink="wards" class="text-primary underline">Add your wards and beds</a> to start admitting. }
            @else { Ask the hospital admin to set up wards and beds. }
          </p>
        </div>
      } @else {
        @for (w of shownWards; track w.id) {
          <section class="mb-5" [attr.data-ward]="w.name">
            <div class="flex items-baseline justify-between flex-wrap gap-2 mb-2">
              <h2 class="text-base font-semibold text-on-surface">{{ w.name }}
                <span class="text-sm font-normal text-slate-600">· {{ wardType(w) }}{{ w.floor ? ' · floor ' + w.floor : '' }}</span>
              </h2>
              <span class="text-sm text-slate-600">{{ money(w.dailyRateInPaisa) }}/day · {{ w.available }} of {{ w.total }} free</span>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              @for (b of w.beds; track b.id) {
                <button type="button" class="text-left rounded-xl border-2 p-3 min-h-[88px] transition-colors"
                  [class]="tile(b)" (click)="tap(w, b)" [attr.data-bed]="b.bedNumber" [attr.data-status]="b.status"
                  [attr.aria-label]="'Bed ' + b.bedNumber + ', ' + stateLabel(b)">
                  <div class="flex items-center justify-between">
                    <span class="font-bold">{{ b.bedNumber }}</span>
                    <span class="material-symbols-outlined text-lg">{{ icon(b) }}</span>
                  </div>
                  @if (b.occupant; as o) {
                    <p class="text-sm font-semibold mt-1 truncate">{{ o.patientName }}</p>
                    <p class="text-xs truncate">Day {{ o.days }} · {{ o.doctorName }}</p>
                    @if (o.status === 'DISCHARGE_ADVISED') { <p class="text-xs font-semibold">Discharge advised</p> }
                  } @else {
                    <p class="text-sm mt-1">{{ stateLabel(b) }}</p>
                    @if (b.notes) { <p class="text-xs truncate">{{ b.notes }}</p> }
                  }
                </button>
              }
              @if (w.beds.length === 0) {
                <p class="text-sm text-slate-600 col-span-full">No beds in this ward yet.</p>
              }
            </div>
          </section>
        }
      }
    </div>

    @if (admitBed) {
      <div class="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center" tabindex="-1"
        (click)="closeAdmit()" (keydown.escape)="closeAdmit()">
        <form class="bg-white w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl p-4 space-y-3"
          id="admit-form" (click)="$event.stopPropagation()" (keydown)="$event.key === 'Escape' ? closeAdmit() : $event.stopPropagation()" (ngSubmit)="admit()">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">Admit to {{ admitWard?.name }}, bed {{ admitBed.bedNumber }}</h2>
            <button type="button" (click)="closeAdmit()" aria-label="Close" class="p-2"><span class="material-symbols-outlined">close</span></button>
          </div>

          <div>
            <label for="admit-patient" class="block text-sm font-medium mb-1">Patient *</label>
            @if (patient) {
              <div class="flex items-center gap-2 p-2.5 rounded-lg bg-blue-50 border border-blue-200" id="admit-chosen-patient">
                <span class="material-symbols-outlined text-blue-700">person</span>
                <span class="text-sm font-semibold">{{ patient.fullName }}</span>
                <span class="text-xs text-slate-600">{{ patient.patientId }}</span>
                <button type="button" class="ml-auto text-sm underline" (click)="patient = null">Change</button>
              </div>
            } @else {
              <input id="admit-patient" name="patientQuery" [ngModel]="patientQuery" (ngModelChange)="searchPatient($event)"
                class="w-full border border-outline-variant rounded-lg p-2.5 text-sm" placeholder="Name, phone or patient number" autocomplete="off" />
              @for (p of patientResults; track p.id) {
                <button type="button" class="w-full text-left p-2.5 border-b border-outline-variant text-sm hover:bg-surface-container-high"
                  (click)="patient = p; patientResults = []" [attr.data-patient]="p.fullName">
                  <b>{{ p.fullName }}</b> <span class="text-slate-600">· {{ p.patientId }} · {{ p.phone }}</span>
                </button>
              }
            }
          </div>

          <div>
            <label for="admit-doctor" class="block text-sm font-medium mb-1">Doctor in charge *</label>
            <select id="admit-doctor" name="doctorId" [(ngModel)]="doctorId" class="w-full border border-outline-variant rounded-lg p-2.5 text-sm">
              <option value="">Choose a doctor</option>
              @for (d of doctors; track d.id) { <option [value]="d.id">{{ d.fullName }} · {{ d.specialization }}</option> }
            </select>
          </div>

          <div>
            <span class="block text-sm font-medium mb-1">Type *</span>
            <div class="flex gap-2 flex-wrap" id="admit-type">
              @for (t of admissionTypes; track t.value) {
                <button type="button" (click)="admissionType = t.value" class="px-3 min-h-touch rounded-full text-sm border"
                  [class]="admissionType === t.value ? 'bg-primary text-white border-primary' : 'bg-white border-outline-variant'">{{ t.label }}</button>
              }
            </div>
          </div>

          <div>
            <label for="admit-reason" class="block text-sm font-medium mb-1">Reason for admission *</label>
            <input id="admit-reason" name="reason" [(ngModel)]="reason" maxlength="500"
              class="w-full border border-outline-variant rounded-lg p-2.5 text-sm" placeholder="e.g. Fever and breathlessness for 3 days" />
          </div>
          @if (clinical) {
            <div>
              <label for="admit-diagnosis" class="block text-sm font-medium mb-1">Provisional diagnosis</label>
              <input id="admit-diagnosis" name="provisionalDiagnosis" [(ngModel)]="provisionalDiagnosis" maxlength="500"
                class="w-full border border-outline-variant rounded-lg p-2.5 text-sm" />
            </div>
          }

          <details class="rounded-lg border border-outline-variant p-2.5">
            <summary class="text-sm font-medium cursor-pointer">Attendant (who is with the patient)</summary>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
              <input name="attendantName" [(ngModel)]="attendantName" maxlength="100" placeholder="Name" aria-label="Attendant name"
                class="border border-outline-variant rounded-lg p-2.5 text-sm" />
              <input name="attendantRelation" [(ngModel)]="attendantRelation" maxlength="40" placeholder="Relation" aria-label="Relation"
                class="border border-outline-variant rounded-lg p-2.5 text-sm" />
              <input name="attendantPhone" [(ngModel)]="attendantPhone" maxlength="20" placeholder="Phone" aria-label="Attendant phone" inputmode="tel"
                class="border border-outline-variant rounded-lg p-2.5 text-sm" />
            </div>
          </details>

          @if (canTakeMoney) {
            <div class="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5">
              <label for="admit-advance" class="block text-sm font-medium mb-1">Advance taken now ({{ 'home' | currencySymbol }})</label>
              <div class="flex gap-2 flex-wrap items-center">
                <input id="admit-advance" name="advance" type="number" min="0" [(ngModel)]="advanceRupees" inputmode="numeric"
                  class="w-36 border border-outline-variant rounded-lg p-2.5 text-sm" placeholder="0" />
                @for (m of methods; track m.value) {
                  <button type="button" (click)="advanceMethod = m.value" class="px-3 min-h-touch rounded-full text-sm border"
                    [class]="advanceMethod === m.value ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-outline-variant'">{{ m.label }}</button>
                }
              </div>
            </div>
          }

          @if (admitError) { <p class="text-sm text-status-red" id="admit-error">{{ admitError }}</p> }
          <div class="sticky bottom-0 bg-white pt-2">
            <button type="submit" id="admit-save" [disabled]="!canAdmit || admitting"
              class="w-full min-h-touch text-sm font-semibold text-white bg-primary rounded-lg disabled:opacity-50">
              {{ admitting ? 'Admitting…' : 'Admit' }}
            </button>
          </div>
        </form>
      </div>
    }
  `,
})
export class BedBoardComponent implements OnInit {
  private ipd = inject(IpdService);
  private patients = inject(PatientService);
  private doctorService = inject(DoctorService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  board: BedBoard | null = null;
  loadError = '';
  wardFilter = '';

  readonly admissionTypes = ADMISSION_TYPES;
  readonly methods = PAYMENT_METHODS;

  /** Set when coming from a patient's screen: the next free bed tapped is for them. */
  pickingFor: Patient | null = null;

  admitBed: BedView | null = null;
  admitWard: WardView | null = null;
  patient: Patient | null = null;
  patientQuery = '';
  patientResults: Patient[] = [];
  private patientSearch = new Subject<string>();
  doctors: Doctor[] = [];
  doctorId = '';
  admissionType: AdmissionType = 'EMERGENCY';
  reason = '';
  provisionalDiagnosis = '';
  attendantName = '';
  attendantRelation = '';
  attendantPhone = '';
  advanceRupees: number | null = null;
  advanceMethod: PaymentMethod = 'CASH';
  admitting = false;
  admitError = '';

  get canSetUp(): boolean {
    return this.auth.can('WARD_MANAGE');
  }

  get canManage(): boolean {
    return this.auth.can('IPD_MANAGE');
  }

  get canTakeMoney(): boolean {
    return this.auth.can('BILLING');
  }

  get clinical(): boolean {
    return this.auth.can('CLINICAL_VIEW');
  }

  get shownWards(): WardView[] {
    return (this.board?.wards ?? []).filter((w) => !this.wardFilter || w.id === this.wardFilter);
  }

  get canAdmit(): boolean {
    return !!this.patient && !!this.doctorId && this.reason.trim().length >= 3;
  }

  ngOnInit(): void {
    this.load();
    this.patientSearch
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((q) =>
          q.trim().length < 2 ? of(null) : this.patients.searchPatients(q, 0, 8).pipe(catchError(() => of(null))),
        ),
      )
      .subscribe((res) => (this.patientResults = res?.data?.content ?? []));
    const patientId = this.route.snapshot.queryParamMap.get('patient');
    if (patientId) {
      this.patients.getPatientById(patientId).subscribe({ next: (r) => (this.pickingFor = r.data) });
    }
  }

  load(): void {
    this.loadError = '';
    this.ipd.board().subscribe({
      next: (b) => (this.board = b),
      error: (err) => (this.loadError = err?.error?.message || 'The beds could not be loaded.'),
    });
  }

  tap(ward: WardView, bed: BedView): void {
    if (bed.occupant) {
      this.router.navigate(['admissions', bed.occupant.admissionId], { relativeTo: this.route });
    } else if (bed.status === 'AVAILABLE') {
      if (!this.canManage) {
        this.toast.warning('Admitting is done by the front desk or the ward.');
        return;
      }
      this.openAdmit(ward, bed);
    } else if (bed.status === 'CLEANING' && this.canManage) {
      this.ipd.updateBed(bed.id, { status: 'AVAILABLE' }).subscribe({
        next: () => {
          this.toast.success(`Bed ${bed.bedNumber} is ready`);
          this.load();
        },
        error: (err) => this.toast.error(err?.error?.message || 'The bed could not be updated.'),
      });
    }
  }

  openAdmit(ward: WardView, bed: BedView): void {
    this.admitWard = ward;
    this.admitBed = bed;
    this.patient = this.pickingFor;
    this.patientQuery = '';
    this.patientResults = [];
    this.doctorId = '';
    this.admissionType = 'EMERGENCY';
    this.reason = '';
    this.provisionalDiagnosis = '';
    this.attendantName = '';
    this.attendantRelation = '';
    this.attendantPhone = '';
    this.advanceRupees = null;
    this.advanceMethod = 'CASH';
    this.admitError = '';
    if (this.doctors.length === 0) {
      this.doctorService.getDoctors(0, 200, {}).subscribe({
        next: (r) => (this.doctors = (r.data?.content ?? []).filter((d) => d.isActive !== false)),
      });
    }
  }

  closeAdmit(): void {
    this.admitBed = null;
    this.admitWard = null;
  }

  searchPatient(q: string): void {
    this.patientQuery = q;
    this.patientSearch.next(q);
  }

  admit(): void {
    if (!this.canAdmit || this.admitting || !this.admitBed || !this.patient) return;
    this.admitting = true;
    this.admitError = '';
    const advance = toMinor(this.advanceRupees ?? 0);
    this.ipd
      .admit({
        patientId: this.patient.id,
        doctorId: this.doctorId,
        bedId: this.admitBed.id,
        admissionType: this.admissionType,
        reason: this.reason.trim(),
        provisionalDiagnosis: this.provisionalDiagnosis.trim() || null,
        attendantName: this.attendantName.trim() || null,
        attendantRelation: this.attendantRelation.trim() || null,
        attendantPhone: this.attendantPhone.trim() || null,
        deposit: this.canTakeMoney && advance > 0 ? { amountInPaisa: advance, paymentMethod: this.advanceMethod } : null,
      })
      .subscribe({
        next: (a) => {
          this.admitting = false;
          this.toast.success(`${a.patientName} admitted (${a.admissionNumber})`);
          this.router.navigate(['admissions', a.id], { relativeTo: this.route });
        },
        error: (err) => {
          this.admitting = false;
          this.admitError = err?.error?.message || 'The patient could not be admitted.';
        },
      });
  }

  tile(b: BedView): string {
    const key = b.occupant?.status === 'DISCHARGE_ADVISED' ? 'ADVISED' : b.status;
    return TILE[key] ?? TILE['MAINTENANCE'];
  }

  icon(b: BedView): string {
    return { AVAILABLE: 'bed', OCCUPIED: 'hotel', CLEANING: 'cleaning_services', MAINTENANCE: 'build' }[b.status];
  }

  stateLabel(b: BedView): string {
    if (b.occupant) return b.occupant.patientName;
    return { AVAILABLE: 'Free', OCCUPIED: 'Occupied', CLEANING: this.canManage ? 'Cleaning · tap when ready' : 'Cleaning', MAINTENANCE: 'Maintenance' }[b.status];
  }

  wardType(w: WardView): string {
    return labelOf(WARD_TYPES, w.wardType);
  }

  money(paisa: number): string {
    return rupees(paisa);
  }
}
