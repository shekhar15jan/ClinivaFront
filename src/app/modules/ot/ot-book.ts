import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { OtService } from '../../core/services/ot.service';
import { DoctorService } from '../../core/services/doctor.service';
import { PatientService } from '../../core/services/patient.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { Doctor } from '../../core/models/doctor.model';
import { ANAESTHESIA, Anaesthesia, SIDES, Side, SurgeryPriority, TheatreView } from '../../core/models/ot.model';

/**
 * Booking a surgery for a patient (from their page or their stay): theatre, surgeon, procedure and side, anaesthesia,
 * time and length, and the fees. The server refuses a clash with the theatre or the surgeon.
 */
@Component({
  selector: 'app-ot-book',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="p-4 sm:p-6 max-w-3xl">
      <a routerLink=".." class="text-sm text-primary flex items-center gap-1 mb-3"><span class="material-symbols-outlined text-lg">arrow_back</span> Operation theatre</a>
      <h1 class="text-2xl font-semibold text-on-surface">Book a surgery</h1>
      <p class="text-sm text-slate-700 mt-1 mb-3" id="ot-book-for">For <b>{{ patientName || '…' }}</b>{{ admissionId ? ' (fees go to the stay)' : ' (day case, billed at the desk)' }}</p>

      <div class="space-y-3">
        <div>
          <p class="text-sm font-medium mb-1">Theatre</p>
          <div class="flex gap-2 flex-wrap">
            @for (t of theatres; track t.id) {
              <button type="button" (click)="theatreId = t.id" class="px-3 min-h-touch rounded-full text-sm border" [attr.data-theatre]="t.name"
                [class]="theatreId === t.id ? 'bg-teal-600 text-white border-teal-600' : 'bg-white border-outline-variant'">{{ t.name }}</button>
            }
            @if (theatres.length === 0) { <span class="text-sm text-slate-600">No theatres in use.</span> }
          </div>
        </div>
        <div class="grid sm:grid-cols-2 gap-2">
          <label class="text-sm font-medium">Surgeon
            <select [(ngModel)]="surgeonId" id="ot-surgeon" class="block w-full mt-1 border border-outline-variant rounded-lg p-2 text-sm">
              <option value="">Choose</option>
              @for (d of doctors; track d.id) { <option [value]="d.id">Dr {{ d.fullName }}</option> }
            </select></label>
          <label class="text-sm font-medium">Anaesthetist
            <select [(ngModel)]="anaesthetistId" id="ot-anaesthetist" class="block w-full mt-1 border border-outline-variant rounded-lg p-2 text-sm">
              <option value="">None / later</option>
              @for (d of doctors; track d.id) { <option [value]="d.id">Dr {{ d.fullName }}</option> }
            </select></label>
        </div>
        <input [(ngModel)]="procedureName" maxlength="200" id="ot-procedure" aria-label="Procedure" placeholder="Procedure, e.g. Laparoscopic cholecystectomy"
          class="w-full border border-outline-variant rounded-lg p-2.5 text-sm" />
        <div class="flex gap-2 flex-wrap" id="ot-sides">
          @for (s of sides; track s.value) {
            <button type="button" (click)="side = s.value" class="px-3 min-h-touch rounded-full text-sm border"
              [class]="side === s.value ? 'bg-primary text-white border-primary' : 'bg-white border-outline-variant'">{{ s.label }}</button>
          }
        </div>
        <div class="flex gap-2 flex-wrap" id="ot-anaesthesia">
          @for (a of anaesthesia; track a.value) {
            <button type="button" (click)="anaesthesiaType = a.value" class="px-3 min-h-touch rounded-full text-sm border"
              [class]="anaesthesiaType === a.value ? 'bg-violet-600 text-white border-violet-600' : 'bg-white border-outline-variant'">{{ a.label }}</button>
          }
        </div>
        <div class="flex gap-2 flex-wrap items-center">
          <input type="datetime-local" [(ngModel)]="start" id="ot-start" aria-label="Start" class="border border-outline-variant rounded-lg p-2 text-sm" />
          @for (m of lengths; track m) {
            <button type="button" (click)="minutes = m" class="px-3 min-h-touch rounded-full text-sm border"
              [class]="minutes === m ? 'bg-primary text-white border-primary' : 'bg-white border-outline-variant'">{{ m < 60 ? m + ' min' : m / 60 + ' h' }}</button>
          }
        </div>
        <div class="flex gap-2 flex-wrap">
          @for (p of priorities; track p) {
            <button type="button" (click)="priority = p" class="px-3 min-h-touch rounded-full text-sm border"
              [class]="priority === p ? (p === 'EMERGENCY' ? 'bg-red-600 text-white border-red-600' : 'bg-primary text-white border-primary') : 'bg-white border-outline-variant'">
              {{ p === 'EMERGENCY' ? 'Emergency' : 'Planned' }}</button>
          }
        </div>
        <input [(ngModel)]="assistants" maxlength="200" aria-label="Assistants" placeholder="Assistants and scrub nurse (optional)" class="w-full border border-outline-variant rounded-lg p-2.5 text-sm" />
        <div class="grid grid-cols-3 gap-2">
          <label class="text-xs">Surgeon's fee ₹<input type="number" min="0" [(ngModel)]="surgeonFee" id="ot-surgeon-fee" class="block w-full mt-1 border border-outline-variant rounded-lg p-2 text-sm" /></label>
          <label class="text-xs">Anaesthesia ₹<input type="number" min="0" [(ngModel)]="anaesthesiaFee" class="block w-full mt-1 border border-outline-variant rounded-lg p-2 text-sm" /></label>
          <label class="text-xs">Theatre ₹<input type="number" min="0" [(ngModel)]="theatreFee" class="block w-full mt-1 border border-outline-variant rounded-lg p-2 text-sm" /></label>
        </div>
      </div>
      <div class="sticky bottom-0 bg-surface mt-4 pt-3">
        <button type="button" id="ot-book" (click)="book()" [disabled]="busy || !ready"
          class="w-full min-h-touch rounded-lg bg-primary text-white text-sm font-semibold disabled:opacity-50">Book surgery</button>
      </div>
    </div>
  `,
})
export class OtBookComponent implements OnInit {
  private ot = inject(OtService);
  private doctorService = inject(DoctorService);
  private patients = inject(PatientService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly sides = SIDES;
  readonly anaesthesia = ANAESTHESIA;
  readonly priorities: SurgeryPriority[] = ['ELECTIVE', 'EMERGENCY'];
  readonly lengths = [30, 60, 90, 120, 180, 240];
  theatres: TheatreView[] = [];
  doctors: Doctor[] = [];
  patientId = '';
  patientName = '';
  admissionId: string | null = null;
  theatreId = '';
  surgeonId = '';
  anaesthetistId = '';
  procedureName = '';
  side: Side = 'NA';
  anaesthesiaType: Anaesthesia = 'GENERAL';
  priority: SurgeryPriority = 'ELECTIVE';
  start = '';
  minutes = 60;
  assistants = '';
  surgeonFee: number | null = null;
  anaesthesiaFee: number | null = null;
  theatreFee: number | null = null;
  busy = false;

  get ready(): boolean {
    return !!this.patientId && !!this.theatreId && !!this.surgeonId && this.procedureName.trim().length > 2 && !!this.start;
  }

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    this.patientId = params.get('patient') ?? '';
    this.admissionId = params.get('admission');
    if (this.patientId) {
      this.patients.getPatientById(this.patientId).subscribe({ next: (r) => (this.patientName = r.data?.fullName ?? '') });
    }
    this.ot.theatres().subscribe({
      next: (t) => {
        this.theatres = t.filter((x) => x.active);
        if (this.theatres.length === 1) this.theatreId = this.theatres[0].id;
      },
    });
    this.doctorService.getDoctors(0, 200, {}).subscribe({
      next: (r) => (this.doctors = (r.data?.content ?? []).filter((d) => d.isActive !== false)),
    });
  }

  book(): void {
    if (this.busy || !this.ready) return;
    this.busy = true;
    this.ot.book({
      patientId: this.patientId,
      admissionId: this.admissionId,
      theatreId: this.theatreId,
      surgeonId: this.surgeonId,
      anaesthetistId: this.anaesthetistId || null,
      assistants: this.assistants.trim() || null,
      procedureName: this.procedureName.trim(),
      side: this.side,
      anaesthesiaType: this.anaesthesiaType,
      priority: this.priority,
      scheduledStart: this.start.length === 16 ? this.start + ':00' : this.start,
      expectedMinutes: this.minutes,
      surgeonFeeInPaisa: Math.round((this.surgeonFee ?? 0) * 100),
      anaesthesiaFeeInPaisa: Math.round((this.anaesthesiaFee ?? 0) * 100),
      theatreFeeInPaisa: Math.round((this.theatreFee ?? 0) * 100),
    }).subscribe({
      next: (s) => {
        this.busy = false;
        this.toast.success(`${s.surgeryNumber} booked`);
        this.router.navigate(['..', s.id], { relativeTo: this.route });
      },
      error: (err) => {
        this.busy = false;
        this.toast.error(err?.error?.message || 'The surgery was not booked.');
      },
    });
  }
}
