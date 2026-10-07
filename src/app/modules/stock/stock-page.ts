import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StockService } from '../../core/services/stock.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { Alerts, MOVEMENT_LABEL, MedicineStock, MovementKind, StockLine, Supplier } from '../../core/models/stock.model';
import { formatMoney, toMinor } from '../../core/utils/money';
import { CurrencySymbolPipe } from '../../shared/pipes/money.pipe';

type Tab = 'stock' | 'alerts' | 'receive';

interface DraftLine {
  medicineId: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number | null;
  cost: number | null;
  mrp: number | null;
}

/**
 * The pharmacy's stock: what is on the shelf (low and expiring first), the alerts, and goods received against a
 * supplier's invoice. A medicine opens to its batches and every movement, with write-off and a count correction.
 */
@Component({
  selector: 'app-stock-page',
  standalone: true,
  imports: [CurrencySymbolPipe, FormsModule, DatePipe],
  template: `
    <div class="p-4 sm:p-6 max-w-6xl">
      <h1 class="text-2xl font-semibold text-on-surface">Pharmacy stock</h1>
      <p class="text-sm text-slate-600 mt-1 mb-3">Batches are used earliest expiry first; expired stock is never issued.</p>

      <div class="grid grid-cols-3 gap-1 mb-3 bg-surface-container-high rounded-xl p-1 max-w-md" role="tablist">
        @for (t of tabs; track t.value) {
          @if (t.value !== 'receive' || canManage) {
            <button type="button" role="tab" [attr.aria-selected]="tab === t.value" (click)="go(t.value)" [id]="'stock-tab-' + t.value"
              class="min-h-touch rounded-lg text-sm font-semibold" [class]="tab === t.value ? 'bg-white shadow text-primary' : 'text-slate-700'">
              {{ t.label }}@if (t.value === 'alerts' && alertCount) { <span class="ml-1 px-1.5 rounded-full bg-red-600 text-white text-xs">{{ alertCount }}</span> }
            </button>
          }
        }
      </div>

      @if (tab === 'stock') {
        <input [(ngModel)]="q" (ngModelChange)="filter()" id="stock-search" aria-label="Search medicines" placeholder="Search medicines"
          class="w-full sm:w-80 border border-outline-variant rounded-lg p-2.5 text-sm mb-3" />
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div class="space-y-2" id="stock-lines">
            @for (l of shown; track l.medicineId) {
              <button type="button" (click)="open(l)" class="w-full text-left bg-white rounded-xl border p-3 border-l-4"
                [class.ring-2]="selected?.line?.medicineId === l.medicineId" [style.border-left-color]="l.low ? '#dc2626' : l.expiredQuantity ? '#d97706' : '#059669'"
                [attr.data-medicine]="l.medicineName">
                <div class="flex justify-between gap-2">
                  <span class="font-semibold">{{ l.medicineName }}</span>
                  <span class="font-bold" [class]="l.low ? 'text-red-700' : 'text-emerald-700'">{{ l.onHand }} {{ l.unit || '' }}</span>
                </div>
                <div class="flex gap-1.5 flex-wrap mt-1 text-xs">
                  @if (l.low) { <span class="px-2 py-0.5 rounded-full bg-red-100 text-red-800">Reorder (level {{ l.reorderLevel }})</span> }
                  @if (l.expiredQuantity) { <span class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">{{ l.expiredQuantity }} expired</span> }
                  @if (l.nearestExpiry) { <span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">Next expiry {{ l.nearestExpiry | date: 'MMM y' }}</span> }
                  @if (l.unbatched) { <span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">{{ l.unbatched }} without batch</span> }
                </div>
              </button>
            }
            @if (shown.length === 0) { <p class="text-sm text-slate-600">No medicines.</p> }
          </div>

          @if (selected; as s) {
            <div class="bg-white rounded-xl border border-outline-variant p-3 space-y-3 self-start" id="stock-detail">
              <div class="flex justify-between items-start gap-2">
                <h2 class="font-semibold">{{ s.line.medicineName }}</h2>
                <button type="button" (click)="selected = null" aria-label="Close" class="p-1"><span class="material-symbols-outlined">close</span></button>
              </div>
              @if (canManage) {
                <div class="flex gap-2 items-center text-sm">
                  <label for="reorder-level">Reorder at</label>
                  <input id="reorder-level" type="number" min="0" [(ngModel)]="reorder" class="w-20 border border-outline-variant rounded-lg p-1.5" />
                  <button type="button" (click)="saveReorder()" class="px-3 py-1.5 rounded-lg border border-outline-variant">Save</button>
                </div>
              }
              <div>
                <h3 class="text-sm font-semibold mb-1">Batches</h3>
                @for (b of s.batches; track b.id) {
                  <div class="flex justify-between items-center text-sm py-1 border-b border-dashed" [attr.data-batch]="b.batchNumber">
                    <span>{{ b.batchNumber }} · exp {{ b.expiryDate | date: 'd MMM y' }} · {{ b.quantityLeft }}/{{ b.quantityReceived }}
                      @if (b.supplierName) { · {{ b.supplierName }} }
                      @if (b.expired && b.quantityLeft) { <b class="text-amber-800">expired</b> }</span>
                    @if (canManage && b.quantityLeft) {
                      <button type="button" (click)="writeOff(b.id)" class="text-xs text-status-red underline" [attr.aria-label]="'Write off batch ' + b.batchNumber">Write off</button>
                    }
                  </div>
                }
                @if (s.batches.length === 0) { <p class="text-sm text-slate-600">No batches yet.</p> }
              </div>
              @if (canManage) {
                <div class="rounded-lg bg-slate-50 p-2 space-y-2" id="count-form">
                  <p class="text-sm font-medium">Count correction</p>
                  <div class="flex gap-2 flex-wrap">
                    <select [(ngModel)]="countBatch" aria-label="Batch" class="border border-outline-variant rounded-lg p-1.5 text-sm">
                      <option value="">Without batch</option>
                      @for (b of s.batches; track b.id) { <option [value]="b.id">{{ b.batchNumber }}</option> }
                    </select>
                    <input type="number" [(ngModel)]="countChange" aria-label="Change (+ or -)" placeholder="+/-" class="w-20 border border-outline-variant rounded-lg p-1.5 text-sm" />
                    <input [(ngModel)]="countReason" aria-label="Reason" placeholder="Reason" maxlength="255" class="flex-1 min-w-[120px] border border-outline-variant rounded-lg p-1.5 text-sm" />
                    <button type="button" (click)="saveCount()" [disabled]="!countChange || countReason.trim().length < 3"
                      class="px-3 py-1.5 rounded-lg bg-primary text-white text-sm disabled:opacity-50">Save</button>
                  </div>
                </div>
              }
              <div>
                <h3 class="text-sm font-semibold mb-1">Movements</h3>
                @for (m of s.movements; track m.id) {
                  <p class="text-sm py-0.5"><span [class]="m.quantity > 0 ? 'text-emerald-700' : 'text-red-700'">{{ m.quantity > 0 ? '+' : '' }}{{ m.quantity }}</span>
                    {{ kindLabel(m.kind) }}{{ m.batchNumber ? ' · ' + m.batchNumber : '' }}{{ m.patientName ? ' · ' + m.patientName : '' }}{{ m.note ? ' · ' + m.note : '' }}
                    <span class="text-xs text-slate-600">{{ m.at | date: 'd MMM, h:mm a' }}{{ m.by ? ' · ' + m.by : '' }}</span></p>
                }
              </div>
            </div>
          }
        </div>
      }

      @if (tab === 'alerts' && alerts; as a) {
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3" id="stock-alerts">
          <section class="bg-white rounded-xl border border-red-200 p-3">
            <h2 class="font-semibold text-red-800 mb-2">Reorder ({{ a.low.length }})</h2>
            @for (l of a.low; track l.medicineId) { <p class="text-sm">{{ l.medicineName }}: {{ l.onHand }} (level {{ l.reorderLevel }})</p> }
          </section>
          <section class="bg-white rounded-xl border border-amber-200 p-3">
            <h2 class="font-semibold text-amber-800 mb-2">Expiring in 60 days ({{ a.expiring.length }})</h2>
            @for (e of a.expiring; track e.batchId) { <p class="text-sm">{{ e.medicineName }} {{ e.batchNumber }}: {{ e.quantityLeft }} · {{ e.expiryDate | date: 'd MMM y' }}</p> }
          </section>
          <section class="bg-white rounded-xl border border-slate-300 p-3">
            <h2 class="font-semibold text-slate-800 mb-2">Expired on the shelf ({{ a.expired.length }})</h2>
            @for (e of a.expired; track e.batchId) {
              <div class="flex justify-between items-center text-sm py-0.5" [attr.data-expired]="e.batchNumber">
                <span>{{ e.medicineName }} {{ e.batchNumber }}: {{ e.quantityLeft }} · {{ money(e.valueInPaisa) }}</span>
                @if (canManage) { <button type="button" (click)="writeOff(e.batchId)" class="text-xs text-status-red underline">Write off</button> }
              </div>
            }
          </section>
        </div>
      }

      @if (tab === 'receive') {
        <div class="bg-white rounded-xl border border-outline-variant p-3 space-y-3" id="receive-form">
          <div class="flex gap-2 flex-wrap items-end">
            <div>
              <label for="receive-supplier" class="block text-sm font-medium mb-1">Supplier</label>
              <select id="receive-supplier" [(ngModel)]="supplierId" class="border border-outline-variant rounded-lg p-2.5 text-sm min-w-[180px]">
                <option value="">Not recorded</option>
                @for (s of suppliers; track s.id) { <option [value]="s.id">{{ s.name }}</option> }
              </select>
            </div>
            <div class="flex gap-1">
              <input [(ngModel)]="newSupplier" aria-label="New supplier" placeholder="New supplier" maxlength="150" class="border border-outline-variant rounded-lg p-2.5 text-sm" />
              <button type="button" (click)="addSupplier()" [disabled]="newSupplier.trim().length < 2" class="px-3 rounded-lg border border-outline-variant text-sm disabled:opacity-50">Add</button>
            </div>
            <div>
              <label for="receive-invoice" class="block text-sm font-medium mb-1">Invoice no.</label>
              <input id="receive-invoice" [(ngModel)]="invoice" maxlength="40" class="border border-outline-variant rounded-lg p-2.5 text-sm" />
            </div>
          </div>
          @for (d of draft; track $index; let i = $index) {
            <div class="grid grid-cols-2 sm:grid-cols-6 gap-2 items-center" [attr.data-line]="i">
              <select [(ngModel)]="d.medicineId" [attr.aria-label]="'Medicine, line ' + (i + 1)" class="col-span-2 border border-outline-variant rounded-lg p-2 text-sm">
                <option value="">Medicine</option>
                @for (l of lines; track l.medicineId) { <option [value]="l.medicineId">{{ l.medicineName }}</option> }
              </select>
              <input [(ngModel)]="d.batchNumber" placeholder="Batch" maxlength="40" [attr.aria-label]="'Batch, line ' + (i + 1)" class="border border-outline-variant rounded-lg p-2 text-sm" />
              <input type="date" [(ngModel)]="d.expiryDate" [attr.aria-label]="'Expiry, line ' + (i + 1)" class="border border-outline-variant rounded-lg p-2 text-sm" />
              <input type="number" min="1" [(ngModel)]="d.quantity" placeholder="Qty" [attr.aria-label]="'Quantity, line ' + (i + 1)" class="border border-outline-variant rounded-lg p-2 text-sm" />
              <input type="number" min="0" step="0.01" [(ngModel)]="d.cost" placeholder="Cost {{ 'home' | currencySymbol }}/unit" [attr.aria-label]="'Cost per unit, line ' + (i + 1)" class="border border-outline-variant rounded-lg p-2 text-sm" />
            </div>
          }
          <div class="flex gap-2">
            <button type="button" (click)="addLine()" class="px-3 min-h-touch rounded-lg border border-outline-variant text-sm">Add line</button>
            <button type="button" id="receive-save" (click)="receive()" [disabled]="busy || !receiptReady"
              class="px-5 min-h-touch rounded-lg bg-primary text-white text-sm font-semibold disabled:opacity-50">Receive stock</button>
          </div>
        </div>
      }
    </div>
  `,
})
export class StockPageComponent implements OnInit {
  private stock = inject(StockService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  readonly tabs: { value: Tab; label: string }[] = [
    { value: 'stock', label: 'Stock' },
    { value: 'alerts', label: 'Alerts' },
    { value: 'receive', label: 'Receive' },
  ];

  tab: Tab = 'stock';
  lines: StockLine[] = [];
  shown: StockLine[] = [];
  q = '';
  selected: MedicineStock | null = null;
  reorder = 0;
  countBatch = '';
  countChange: number | null = null;
  countReason = '';
  alerts: Alerts | null = null;
  suppliers: Supplier[] = [];
  supplierId = '';
  newSupplier = '';
  invoice = '';
  draft: DraftLine[] = [];
  busy = false;

  get canManage(): boolean {
    return this.auth.can('MEDICINE_MANAGE');
  }

  get alertCount(): number {
    return this.alerts ? this.alerts.low.length + this.alerts.expired.length : 0;
  }

  get receiptReady(): boolean {
    const filled = this.draft.filter((d) => d.medicineId);
    return filled.length > 0 && filled.every((d) => d.batchNumber.trim() && d.expiryDate && (d.quantity ?? 0) > 0 && (d.cost ?? -1) >= 0);
  }

  ngOnInit(): void {
    this.load();
    this.stock.alerts().subscribe({ next: (a) => (this.alerts = a), error: () => (this.alerts = null) });
  }

  load(): void {
    this.stock.overview().subscribe({
      next: (lines) => {
        this.lines = lines;
        this.filter();
      },
      error: (err) => this.toast.error(err?.error?.message || 'The stock could not be loaded.'),
    });
  }

  filter(): void {
    const q = this.q.trim().toLowerCase();
    this.shown = this.lines.filter((l) => !q || l.medicineName.toLowerCase().includes(q) || (l.genericName ?? '').toLowerCase().includes(q));
  }

  go(tab: Tab): void {
    this.tab = tab;
    if (tab === 'receive') {
      if (this.draft.length === 0) this.addLine();
      if (this.suppliers.length === 0) this.stock.suppliers().subscribe({ next: (s) => (this.suppliers = s) });
    }
    if (tab === 'alerts') this.stock.alerts().subscribe({ next: (a) => (this.alerts = a) });
  }

  open(l: StockLine): void {
    this.stock.medicine(l.medicineId).subscribe({ next: (s) => this.show(s) });
  }

  private show(s: MedicineStock): void {
    this.selected = s;
    this.reorder = s.line.reorderLevel;
    this.countBatch = '';
    this.countChange = null;
    this.countReason = '';
  }

  saveReorder(): void {
    const s = this.selected;
    if (!s) return;
    this.stock.reorderLevel(s.line.medicineId, this.reorder).subscribe({
      next: () => {
        this.toast.success('Reorder level saved');
        this.load();
        this.open(s.line);
      },
      error: (err) => this.toast.error(err?.error?.message || 'Not saved.'),
    });
  }

  writeOff(batchId: string): void {
    this.stock.writeOff(batchId).subscribe({
      next: (s) => {
        this.toast.success('Batch written off');
        if (this.selected) this.show(s);
        this.load();
        this.stock.alerts().subscribe({ next: (a) => (this.alerts = a) });
      },
      error: (err) => this.toast.error(err?.error?.message || 'Not written off.'),
    });
  }

  saveCount(): void {
    const s = this.selected;
    if (!s || !this.countChange) return;
    this.stock.adjust(s.line.medicineId, this.countBatch || null, this.countChange, this.countReason.trim()).subscribe({
      next: (fresh) => {
        this.toast.success('Count recorded');
        this.show(fresh);
        this.load();
      },
      error: (err) => this.toast.error(err?.error?.message || 'Not recorded.'),
    });
  }

  addSupplier(): void {
    this.stock.addSupplier(this.newSupplier.trim(), null, null).subscribe({
      next: (s) => {
        this.suppliers = [...this.suppliers, s];
        this.supplierId = s.id;
        this.newSupplier = '';
      },
      error: (err) => this.toast.error(err?.error?.message || 'Not added.'),
    });
  }

  addLine(): void {
    this.draft = [...this.draft, { medicineId: '', batchNumber: '', expiryDate: '', quantity: null, cost: null, mrp: null }];
  }

  receive(): void {
    if (!this.receiptReady || this.busy) return;
    this.busy = true;
    const lines = this.draft
      .filter((d) => d.medicineId)
      .map((d) => ({
        medicineId: d.medicineId,
        batchNumber: d.batchNumber.trim(),
        expiryDate: d.expiryDate,
        quantity: d.quantity!,
        costInPaisa: toMinor(d.cost ?? 0),
        mrpInPaisa: d.mrp === null ? null : toMinor(d.mrp),
      }));
    this.stock.receive(this.supplierId || null, this.invoice.trim() || null, lines).subscribe({
      next: () => {
        this.busy = false;
        this.toast.success(`${lines.length} ${lines.length === 1 ? 'batch' : 'batches'} received`);
        this.draft = [];
        this.invoice = '';
        this.load();
        this.tab = 'stock';
      },
      error: (err) => {
        this.busy = false;
        this.toast.error(err?.error?.message || 'The stock was not received.');
      },
    });
  }

  kindLabel(k: MovementKind): string {
    return MOVEMENT_LABEL[k];
  }

  money(paisa: number): string {
    return formatMoney(paisa);
  }
}
