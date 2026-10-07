import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LabService } from '../../core/services/lab.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { LAB_CATEGORIES, LabCategory, SAMPLE_TYPES, SampleType, TestView } from '../../core/models/lab.model';
import { formatMoney, fromMinor, toMinor } from '../../core/utils/money';
import { CurrencySymbolPipe } from '../../shared/pipes/money.pipe';

interface ParamDraft {
  name: string;
  unit: string;
  refLow: number | null;
  refHigh: number | null;
  refText: string;
}

/** The test catalog: start from common tests in one tap, then set prices and the lab's own reference ranges. */
@Component({
  selector: 'app-lab-catalog',
  standalone: true,
  imports: [CurrencySymbolPipe, FormsModule, RouterLink],
  template: `
    <div class="p-4 sm:p-6 max-w-5xl">
      <a routerLink=".." class="text-sm text-primary flex items-center gap-1 mb-3"><span class="material-symbols-outlined text-lg">arrow_back</span> Lab</a>
      @if (!allowed) {
        <p class="p-3 rounded-lg bg-amber-50 text-sm text-amber-900">The test catalog is set up by the hospital admin.</p>
      } @else {
      <div class="flex items-start justify-between flex-wrap gap-3 mb-3">
        <div>
          <h1 class="text-2xl font-semibold text-on-surface">Test catalog</h1>
          <p class="text-sm text-slate-600 mt-1">Ranges should follow your analyser and method. A change applies to new reports.</p>
        </div>
        <div class="flex gap-2">
          <button type="button" id="lab-starter" (click)="starter()" class="px-4 min-h-touch text-sm font-semibold rounded-lg border border-outline-variant bg-white">Add common tests</button>
          <button type="button" id="lab-add-test" (click)="edit(null)" class="px-4 min-h-touch text-sm font-semibold rounded-lg bg-primary text-white">Add test</button>
        </div>
      </div>

      @if (form) {
        <div class="bg-white rounded-xl border-2 border-primary p-3 mb-3 space-y-2" id="lab-test-form">
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <input [(ngModel)]="code" maxlength="20" aria-label="Code" placeholder="Code" class="border border-outline-variant rounded-lg p-2 text-sm" />
            <input [(ngModel)]="name" maxlength="150" aria-label="Name" placeholder="Name" class="col-span-1 sm:col-span-2 border border-outline-variant rounded-lg p-2 text-sm" />
            <input type="number" min="0" [(ngModel)]="price" aria-label="Price" placeholder="Price {{ 'home' | currencySymbol }}" class="border border-outline-variant rounded-lg p-2 text-sm" />
            <select [(ngModel)]="category" aria-label="Category" class="border border-outline-variant rounded-lg p-2 text-sm">
              @for (c of categories; track c.value) { <option [value]="c.value">{{ c.label }}</option> }
            </select>
            <select [(ngModel)]="sampleType" aria-label="Sample" class="border border-outline-variant rounded-lg p-2 text-sm">
              @for (s of samples; track s) { <option [value]="s">{{ s.toLowerCase() }}</option> }
            </select>
            <input type="number" min="1" [(ngModel)]="hours" aria-label="Turnaround hours" placeholder="Hours" class="border border-outline-variant rounded-lg p-2 text-sm" />
          </div>
          <p class="text-sm font-medium">Values reported</p>
          @for (p of params; track $index; let k = $index) {
            <div class="grid grid-cols-12 gap-2">
              <input [(ngModel)]="p.name" [attr.aria-label]="'Value ' + (k + 1)" placeholder="Name" class="col-span-4 border border-outline-variant rounded-lg p-2 text-sm" />
              <input [(ngModel)]="p.unit" placeholder="Unit" aria-label="Unit" class="col-span-2 border border-outline-variant rounded-lg p-2 text-sm" />
              <input type="number" [(ngModel)]="p.refLow" placeholder="Low" aria-label="Normal from" class="col-span-2 border border-outline-variant rounded-lg p-2 text-sm" />
              <input type="number" [(ngModel)]="p.refHigh" placeholder="High" aria-label="Normal to" class="col-span-2 border border-outline-variant rounded-lg p-2 text-sm" />
              <input [(ngModel)]="p.refText" placeholder="or normal text" aria-label="Normal answer" class="col-span-2 border border-outline-variant rounded-lg p-2 text-sm" />
            </div>
          }
          <div class="flex gap-2">
            <button type="button" (click)="params.push({ name: '', unit: '', refLow: null, refHigh: null, refText: '' })" class="px-3 min-h-touch rounded-lg border border-outline-variant text-sm">Add value</button>
            <button type="button" id="lab-save-test" (click)="save()" [disabled]="!ready" class="px-4 min-h-touch rounded-lg bg-primary text-white text-sm font-semibold disabled:opacity-50">Save</button>
            <button type="button" (click)="form = false" class="px-4 min-h-touch rounded-lg border border-outline-variant text-sm">Cancel</button>
          </div>
        </div>
      }

      <div class="space-y-2" id="lab-tests">
        @for (t of tests; track t.id) {
          <div class="bg-white rounded-xl border border-outline-variant p-3 flex justify-between gap-2 flex-wrap items-center" [class.opacity-60]="!t.active" [attr.data-test]="t.code">
            <div>
              <p class="font-semibold">{{ t.name }} <span class="text-sm font-normal text-slate-600">{{ t.code }} · {{ t.category.toLowerCase() }} · {{ money(t.priceInPaisa) }} · {{ t.turnaroundHours }} h</span></p>
              <p class="text-xs text-slate-600">{{ paramLine(t) }}</p>
            </div>
            <div class="flex gap-2">
              <button type="button" (click)="edit(t)" class="text-sm underline">Edit</button>
              <button type="button" (click)="toggle(t)" class="text-sm underline">{{ t.active ? 'Withdraw' : 'Offer' }}</button>
            </div>
          </div>
        }
        @if (tests.length === 0) { <p class="text-sm text-slate-600">No tests yet. "Add common tests" fills in the usual ones.</p> }
      </div>
      }
    </div>
  `,
})
export class LabCatalogComponent implements OnInit {
  private lab = inject(LabService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  readonly allowed = this.auth.can('LAB_MANAGE');
  readonly categories = LAB_CATEGORIES;
  readonly samples = SAMPLE_TYPES;
  tests: TestView[] = [];
  form = false;
  editingId: string | null = null;
  code = '';
  name = '';
  price: number | null = null;
  category: LabCategory = 'BIOCHEMISTRY';
  sampleType: SampleType = 'BLOOD';
  hours = 24;
  params: ParamDraft[] = [];

  get ready(): boolean {
    return this.code.trim().length > 0 && this.name.trim().length > 1 && this.price !== null && this.params.some((p) => p.name.trim());
  }

  ngOnInit(): void {
    if (this.allowed) this.load();
  }

  load(): void {
    this.lab.tests(false).subscribe({ next: (t) => (this.tests = t) });
  }

  starter(): void {
    this.lab.starter().subscribe({
      next: (t) => {
        this.tests = t;
        this.toast.success('Common tests added');
      },
      error: (err) => this.toast.error(err?.error?.message || 'Not added.'),
    });
  }

  edit(t: TestView | null): void {
    this.form = true;
    this.editingId = t?.id ?? null;
    this.code = t?.code ?? '';
    this.name = t?.name ?? '';
    this.price = t ? fromMinor(t.priceInPaisa) : null;
    this.category = t?.category ?? 'BIOCHEMISTRY';
    this.sampleType = t?.sampleType ?? 'BLOOD';
    this.hours = t?.turnaroundHours ?? 24;
    this.params = t
      ? t.parameters.map((p) => ({ name: p.name, unit: p.unit ?? '', refLow: p.refLow, refHigh: p.refHigh, refText: p.refText ?? '' }))
      : [{ name: '', unit: '', refLow: null, refHigh: null, refText: '' }];
  }

  save(): void {
    const request = {
      code: this.code.trim(),
      name: this.name.trim(),
      category: this.category,
      sampleType: this.sampleType,
      priceInPaisa: toMinor(this.price ?? 0),
      turnaroundHours: this.hours,
      parameters: this.params
        .filter((p) => p.name.trim())
        .map((p) => ({ name: p.name.trim(), unit: p.unit.trim() || null, refLow: p.refLow, refHigh: p.refHigh, refText: p.refText.trim() || null })),
    };
    const call = this.editingId ? this.lab.updateTest(this.editingId, request) : this.lab.createTest(request);
    call.subscribe({
      next: (t) => {
        this.form = false;
        this.toast.success(`${t.name} saved`);
        this.load();
      },
      error: (err) => this.toast.error(err?.error?.message || 'Not saved.'),
    });
  }

  toggle(t: TestView): void {
    this.lab.setActive(t.id, !t.active).subscribe({ next: () => this.load() });
  }

  paramLine(t: TestView): string {
    return t.parameters.map((p) => `${p.name}${p.reference ? ' (' + p.reference + ')' : ''}`).join(', ');
  }

  money(paisa: number): string {
    return formatMoney(paisa);
  }
}
