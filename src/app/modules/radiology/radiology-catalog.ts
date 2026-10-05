import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RadiologyService } from '../../core/services/radiology.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { MODALITIES, Modality, StudyView, modalityLabel } from '../../core/models/radiology.model';

/** The imaging catalog: start from common studies in one tap, then set prices and patient preparation. */
@Component({
  selector: 'app-radiology-catalog',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="p-4 sm:p-6 max-w-5xl">
      <a routerLink=".." class="text-sm text-primary flex items-center gap-1 mb-3"><span class="material-symbols-outlined text-lg">arrow_back</span> Radiology</a>
      @if (!allowed) {
        <p class="p-3 rounded-lg bg-amber-50 text-sm text-amber-900">The study catalog is set up by the hospital admin.</p>
      } @else {
      <div class="flex items-start justify-between flex-wrap gap-3 mb-3">
        <div>
          <h1 class="text-2xl font-semibold text-on-surface">Study catalog</h1>
          <p class="text-sm text-slate-600 mt-1">Prices apply to new orders. Mark obstetric scans as needing Form F.</p>
        </div>
        <div class="flex gap-2">
          <button type="button" id="rad-starter" (click)="starter()" class="px-4 min-h-touch text-sm font-semibold rounded-lg border border-outline-variant bg-white">Add common studies</button>
          <button type="button" id="rad-add-study" (click)="edit(null)" class="px-4 min-h-touch text-sm font-semibold rounded-lg bg-primary text-white">Add study</button>
        </div>
      </div>

      @if (form) {
        <div class="bg-white rounded-xl border-2 border-primary p-3 mb-3 space-y-2" id="rad-study-form">
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <input [(ngModel)]="code" maxlength="20" aria-label="Code" placeholder="Code" class="border border-outline-variant rounded-lg p-2 text-sm" />
            <input [(ngModel)]="name" maxlength="150" aria-label="Name" placeholder="Name" class="col-span-1 sm:col-span-2 border border-outline-variant rounded-lg p-2 text-sm" />
            <input type="number" min="0" [(ngModel)]="price" aria-label="Price in rupees" placeholder="Price ₹" class="border border-outline-variant rounded-lg p-2 text-sm" />
            <select [(ngModel)]="modality" aria-label="Modality" class="border border-outline-variant rounded-lg p-2 text-sm">
              @for (m of modalities; track m.value) { <option [value]="m.value">{{ m.label }}</option> }
            </select>
            <input [(ngModel)]="bodyPart" maxlength="60" aria-label="Body part" placeholder="Body part" class="border border-outline-variant rounded-lg p-2 text-sm" />
            <input [(ngModel)]="preparation" maxlength="300" aria-label="Preparation" placeholder="Preparation for the patient" class="col-span-2 border border-outline-variant rounded-lg p-2 text-sm" />
          </div>
          <label class="flex items-center gap-2 text-sm"><input type="checkbox" [(ngModel)]="formF" /> Obstetric scan: Form F (PCPNDT) needed</label>
          <div class="flex gap-2">
            <button type="button" id="rad-save-study" (click)="save()" [disabled]="!ready" class="px-4 min-h-touch rounded-lg bg-primary text-white text-sm font-semibold disabled:opacity-50">Save</button>
            <button type="button" (click)="form = false" class="px-4 min-h-touch rounded-lg border border-outline-variant text-sm">Cancel</button>
          </div>
        </div>
      }

      <div class="space-y-2" id="rad-studies">
        @for (s of studies; track s.id) {
          <div class="bg-white rounded-xl border border-outline-variant p-3 flex justify-between gap-2 flex-wrap items-center" [class.opacity-60]="!s.active" [attr.data-study]="s.code">
            <div>
              <p class="font-semibold">{{ s.name }} <span class="text-sm font-normal text-slate-600">{{ s.code }} · {{ label(s.modality) }} · {{ money(s.priceInPaisa) }}</span></p>
              <p class="text-xs text-slate-600">{{ s.preparation || 'No preparation' }}{{ s.formFRequired ? ' · Form F' : '' }}</p>
            </div>
            <div class="flex gap-2">
              <button type="button" (click)="edit(s)" class="text-sm underline">Edit</button>
              <button type="button" (click)="toggle(s)" class="text-sm underline">{{ s.active ? 'Withdraw' : 'Offer' }}</button>
            </div>
          </div>
        }
        @if (studies.length === 0) { <p class="text-sm text-slate-600">No studies yet. "Add common studies" fills in the usual ones.</p> }
      </div>
      }
    </div>
  `,
})
export class RadiologyCatalogComponent implements OnInit {
  private radiology = inject(RadiologyService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  readonly allowed = this.auth.can('IMAGING_MANAGE');
  readonly modalities = MODALITIES;
  studies: StudyView[] = [];
  form = false;
  editingId: string | null = null;
  code = '';
  name = '';
  price: number | null = null;
  modality: Modality = 'XRAY';
  bodyPart = '';
  preparation = '';
  formF = false;

  get ready(): boolean {
    return this.code.trim().length > 0 && this.name.trim().length > 1 && this.price !== null;
  }

  ngOnInit(): void {
    if (this.allowed) this.load();
  }

  load(): void {
    this.radiology.studies(false).subscribe({ next: (s) => (this.studies = s) });
  }

  starter(): void {
    this.radiology.starter().subscribe({
      next: (s) => {
        this.studies = s;
        this.toast.success('Common studies added');
      },
      error: (err) => this.toast.error(err?.error?.message || 'Not added.'),
    });
  }

  edit(s: StudyView | null): void {
    this.form = true;
    this.editingId = s?.id ?? null;
    this.code = s?.code ?? '';
    this.name = s?.name ?? '';
    this.price = s ? s.priceInPaisa / 100 : null;
    this.modality = s?.modality ?? 'XRAY';
    this.bodyPart = s?.bodyPart ?? '';
    this.preparation = s?.preparation ?? '';
    this.formF = s?.formFRequired ?? false;
  }

  save(): void {
    const request = {
      code: this.code.trim(),
      name: this.name.trim(),
      modality: this.modality,
      bodyPart: this.bodyPart.trim() || null,
      priceInPaisa: Math.round((this.price ?? 0) * 100),
      preparation: this.preparation.trim() || null,
      formFRequired: this.formF,
    };
    const call = this.editingId ? this.radiology.updateStudy(this.editingId, request) : this.radiology.createStudy(request);
    call.subscribe({
      next: (s) => {
        this.form = false;
        this.toast.success(`${s.name} saved`);
        this.load();
      },
      error: (err) => this.toast.error(err?.error?.message || 'Not saved.'),
    });
  }

  toggle(s: StudyView): void {
    this.radiology.setActive(s.id, !s.active).subscribe({ next: () => this.load() });
  }

  label(m: Modality): string {
    return modalityLabel(m);
  }

  money(paisa: number): string {
    return '₹' + (paisa / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  }
}
