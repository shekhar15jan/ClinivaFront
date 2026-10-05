import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { OtService } from '../../core/services/ot.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { Board, BoardItem, TheatreView } from '../../core/models/ot.model';

/**
 * The theatre board for a day: each theatre with its surgeries in order, where each one is (booked, consent taken,
 * signed in, in surgery, over). Surgeries are booked from the patient's page or their stay.
 */
@Component({
  selector: 'app-ot-board',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe],
  template: `
    <div class="p-4 sm:p-6 max-w-6xl">
      <div class="flex items-start justify-between flex-wrap gap-3 mb-3">
        <div>
          <h1 class="text-2xl font-semibold text-on-surface">Operation theatre</h1>
          <p class="text-sm text-slate-600 mt-1">Book a surgery from the patient's page or their stay.</p>
        </div>
        @if (canManage) {
          <button type="button" id="ot-theatres-toggle" (click)="showTheatres = !showTheatres"
            class="px-4 min-h-touch text-sm font-semibold rounded-lg border border-outline-variant bg-white flex items-center gap-1">
            <span class="material-symbols-outlined text-lg">meeting_room</span> Theatres</button>
        }
      </div>

      @if (showTheatres) {
        <div class="bg-white rounded-xl border-2 border-primary p-3 mb-3" id="ot-theatres">
          <div class="flex gap-2 flex-wrap mb-2">
            <input [(ngModel)]="newTheatre" maxlength="60" id="new-theatre" aria-label="Theatre name" placeholder="e.g. OT 1"
              class="border border-outline-variant rounded-lg p-2 text-sm" />
            <button type="button" id="add-theatre" (click)="addTheatre()" [disabled]="!newTheatre.trim()"
              class="px-4 min-h-touch rounded-lg bg-primary text-white text-sm font-semibold disabled:opacity-50">Add theatre</button>
          </div>
          @for (t of board?.theatres ?? []; track t.id) {
            <div class="flex justify-between items-center py-1 text-sm" [class.opacity-60]="!t.active">
              <span>{{ t.name }}</span>
              <button type="button" (click)="toggle(t)" class="underline">{{ t.active ? 'Take out of use' : 'Put in use' }}</button>
            </div>
          }
        </div>
      }

      <div class="flex gap-2 items-center flex-wrap mb-3" id="ot-days">
        @for (d of quickDays; track d.value) {
          <button type="button" (click)="setDay(d.value)" class="px-3 min-h-touch rounded-full text-sm border"
            [class]="day === d.value ? 'bg-primary text-white border-primary' : 'bg-white border-outline-variant'">{{ d.label }}</button>
        }
        <input type="date" [ngModel]="day" (ngModelChange)="setDay($event)" aria-label="Day" class="border border-outline-variant rounded-lg p-2 text-sm" />
      </div>

      @if (error) {
        <div class="p-3 rounded-lg bg-red-50 text-sm text-red-700">{{ error }}</div>
      } @else if (board) {
        @if (board.theatres.length === 0) {
          <div class="bg-white rounded-xl border border-dashed border-outline-variant p-8 text-center text-sm text-slate-600" id="ot-empty">
            No theatres yet.{{ canManage ? ' Add them under Theatres.' : '' }}</div>
        }
        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3" id="ot-board">
          @for (t of board.theatres; track t.id) {
            <section class="bg-white rounded-xl border border-outline-variant p-3" [attr.data-theatre]="t.name">
              <h2 class="font-semibold mb-2 flex items-center gap-2"><span class="material-symbols-outlined text-lg text-teal-700">meeting_room</span>{{ t.name }}
                @if (!t.active) { <span class="text-xs text-slate-500">out of use</span> }</h2>
              @for (s of inTheatre(t.id); track s.id) {
                <a [routerLink]="[s.id]" class="block rounded-lg border p-2 mb-2 border-l-4" [attr.data-surgery]="s.surgeryNumber"
                  [class.opacity-50]="s.status === 'CANCELLED'" [style.border-left-color]="colour(s)">
                  <p class="text-sm font-semibold">{{ s.scheduledStart | date: 'h:mm a' }} · {{ s.patientName }}
                    @if (s.priority === 'EMERGENCY') { <span class="text-xs px-1.5 rounded bg-red-600 text-white">Emergency</span> }</p>
                  <p class="text-sm">{{ s.procedureName }}{{ s.side && s.side !== 'NA' ? ' (' + s.side.toLowerCase() + ')' : '' }}</p>
                  <p class="text-xs text-slate-600">Dr {{ s.surgeonName }} · {{ s.expectedMinutes }} min · <b>{{ s.step }}</b></p>
                </a>
              } @empty {
                <p class="text-sm text-slate-500">Free all day.</p>
              }
            </section>
          }
        </div>
      }
    </div>
  `,
})
export class OtBoardComponent implements OnInit {
  private ot = inject(OtService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  board: Board | null = null;
  day = OtBoardComponent.iso(new Date());
  error = '';
  showTheatres = false;
  newTheatre = '';
  readonly quickDays = [
    { label: 'Today', value: OtBoardComponent.iso(new Date()) },
    { label: 'Tomorrow', value: OtBoardComponent.iso(new Date(Date.now() + 86_400_000)) },
  ];

  get canManage(): boolean {
    return this.auth.can('OT_MANAGE');
  }

  ngOnInit(): void {
    this.load();
  }

  setDay(day: string): void {
    if (!day) return;
    this.day = day;
    this.load();
  }

  load(): void {
    this.error = '';
    this.ot.board(this.day).subscribe({
      next: (b) => {
        this.board = b;
        if (b.theatres.length === 0 && this.canManage) this.showTheatres = true;
      },
      error: (err) => (this.error = err?.error?.message || 'The board could not be loaded.'),
    });
  }

  inTheatre(theatreId: string): BoardItem[] {
    return (this.board?.surgeries ?? []).filter((s) => s.theatreId === theatreId);
  }

  colour(s: BoardItem): string {
    return { SCHEDULED: '#2563eb', IN_PROGRESS: '#dc2626', COMPLETED: '#059669', CANCELLED: '#94a3b8' }[s.status];
  }

  addTheatre(): void {
    this.ot.addTheatre(this.newTheatre.trim()).subscribe({
      next: (t) => {
        this.newTheatre = '';
        this.toast.success(`${t.name} added`);
        this.load();
      },
      error: (err) => this.toast.error(err?.error?.message || 'Not added.'),
    });
  }

  toggle(t: TheatreView): void {
    this.ot.setTheatreActive(t.id, !t.active).subscribe({ next: () => this.load() });
  }

  static iso(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
