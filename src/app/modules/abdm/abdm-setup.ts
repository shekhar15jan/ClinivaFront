import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AbdmService, AbdmStatus } from '../../core/services/abdm.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/components/toast/toast.service';

/**
 * ABDM set-up: the facility's HFR ID, doctors' HPR IDs, and what is still missing. Connecting to the ABDM gateway
 * needs the credentials NHA issues to the clinic; until then records are produced as FHIR documents but not sent.
 */
@Component({
  selector: 'app-abdm-setup',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="p-4 sm:p-6 max-w-4xl">
      <h1 class="text-2xl font-semibold text-on-surface">ABDM</h1>
      <p class="text-sm text-slate-600 mt-1 mb-3">Ayushman Bharat Digital Mission: ABHA for patients, registry IDs, and health records in the national format.</p>
      @if (s) {
        <div class="rounded-xl p-3 mb-3 text-sm" [class]="s.gatewayConfigured ? 'bg-emerald-50 text-emerald-900' : 'bg-amber-50 text-amber-900'" id="abdm-gateway">
          {{ s.gatewayConfigured ? 'Connected to the ABDM gateway (' + s.gateway + ').' : 'Not connected to the ABDM gateway yet: records are prepared but not sent. The clinic needs its credentials from NHA (sandbox first).' }}
        </div>
        @if (s.toDo.length) {
          <ul class="list-disc pl-5 text-sm text-slate-800 mb-3" id="abdm-todo">@for (t of s.toDo; track t) { <li>{{ t }}</li> }</ul>
        }
        <div class="grid grid-cols-2 gap-2 max-w-md mb-4">
          <div class="rounded-xl p-3 bg-indigo-600 text-white"><p class="text-xs opacity-90">Patients with ABHA</p><p class="text-xl font-bold">{{ s.patientsWithAbha }}</p></div>
          <div class="rounded-xl p-3 bg-teal-600 text-white"><p class="text-xs opacity-90">Doctors with HPR ID</p><p class="text-xl font-bold">{{ s.doctorsWithHpr }} / {{ s.doctors }}</p></div>
        </div>
        @if (canSettings) {
          <div class="bg-white rounded-xl border border-outline-variant p-3 mb-3 flex gap-2 items-end flex-wrap">
            <label class="text-sm font-medium">Facility HFR ID
              <input id="hfr-id" [(ngModel)]="hfr" maxlength="30" class="block mt-1 border border-outline-variant rounded-lg p-2 text-sm" /></label>
            <button type="button" id="save-hfr" (click)="saveHfr()" class="px-4 min-h-touch rounded-lg bg-primary text-white text-sm font-semibold">Save</button>
          </div>
        }
        @if (canDoctors) {
          <div class="bg-white rounded-xl border border-outline-variant p-3" id="hpr-ids">
            <h2 class="font-semibold mb-2">Doctors' HPR IDs</h2>
            @for (d of s.doctorIds; track d.id) {
              <div class="flex gap-2 items-center py-1" [attr.data-doctor]="d.name">
                <span class="flex-1 text-sm">{{ d.name }}</span>
                <input [(ngModel)]="hpr[d.id]" maxlength="30" [attr.aria-label]="'HPR ID of ' + d.name" placeholder="HPR ID" class="w-48 border border-outline-variant rounded-lg p-2 text-sm" />
                <button type="button" (click)="saveHpr(d.id)" class="px-3 min-h-touch rounded-lg border border-outline-variant text-sm">Save</button>
              </div>
            }
          </div>
        }
      }
    </div>
  `,
})
export class AbdmSetupComponent implements OnInit {
  private abdm = inject(AbdmService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  s: AbdmStatus | null = null;
  hfr = '';
  hpr: Record<string, string> = {};

  get canSettings(): boolean {
    return this.auth.can('CLINIC_SETTINGS');
  }

  get canDoctors(): boolean {
    return this.auth.can('DOCTOR_MANAGE');
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.abdm.status().subscribe({
      next: (s) => {
        this.s = s;
        this.hfr = s.hfrId ?? '';
        this.hpr = Object.fromEntries(s.doctorIds.map((d) => [d.id, d.hprId ?? '']));
      },
      error: (err) => this.toast.error(err?.error?.message || 'ABDM status could not be loaded.'),
    });
  }

  saveHfr(): void {
    this.abdm.setFacility(this.hfr.trim() || null).subscribe({
      next: (s) => { this.s = s; this.toast.success('HFR ID saved'); },
      error: (err) => this.toast.error(err?.error?.message || 'Not saved.'),
    });
  }

  saveHpr(doctorId: string): void {
    this.abdm.setDoctorHpr(doctorId, (this.hpr[doctorId] ?? '').trim() || null).subscribe({
      next: () => { this.toast.success('HPR ID saved'); this.load(); },
      error: (err) => this.toast.error(err?.error?.message || 'Not saved.'),
    });
  }
}
