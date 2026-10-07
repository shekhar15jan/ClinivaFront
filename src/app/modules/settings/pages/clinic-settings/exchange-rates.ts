import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CurrencyService, RatesView } from '../../../../core/services/currency.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Settings → Currency & exchange rates (module MULTI_CURRENCY): the clinic's own rates for billing patients in other
 * currencies. Each rate is dated and kept; a bill keeps the rate it was shown at.
 */
@Component({
  selector: 'app-exchange-rates',
  standalone: true,
  imports: [FormsModule, DatePipe],
  template: `
    <section id="exchange-rates" class="bg-white rounded-xl border border-gray-200 p-6 mt-6" aria-labelledby="fx-h">
      <h2 id="fx-h" class="text-lg font-semibold text-[#0F172A] mb-1">Currency &amp; exchange rates</h2>
      <p class="text-sm text-[#475569] mb-4">
        For patients billed in another currency. The books and reports stay in {{ view()?.homeCurrency }}; a bill keeps
        the rate it was shown at.
      </p>

      @if (view(); as v) {
        @if (v.current.length) {
          <table class="w-full text-sm mb-4" id="fx-current">
            <caption class="sr-only">Rates in force today</caption>
            <thead>
              <tr class="text-left text-xs text-[#64748B] uppercase">
                <th scope="col" class="py-2">Currency</th>
                <th scope="col" class="py-2">1 unit =</th>
                <th scope="col" class="py-2">From</th>
              </tr>
            </thead>
            <tbody>
              @for (r of v.current; track r.id) {
                <tr class="border-t border-gray-100" [attr.data-rate]="r.currency">
                  <td class="py-2 font-medium">{{ r.currency }}</td>
                  <td class="py-2">{{ r.rate }} {{ v.homeCurrency }}</td>
                  <td class="py-2">{{ r.effectiveFrom | date: 'd MMM y' }}</td>
                </tr>
              }
            </tbody>
          </table>
        } @else {
          <p class="text-sm text-[#64748B] mb-4" id="fx-none">No rates yet.</p>
        }

        <form class="grid gap-3 sm:grid-cols-4 items-end" (ngSubmit)="save()">
          <label class="text-sm">Currency
            <select id="fx-currency" name="currency" [(ngModel)]="currency" class="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg">
              @for (c of v.currencies; track c.code) {
                @if (c.code !== v.homeCurrency) {
                  <option [value]="c.code">{{ c.code }} · {{ c.name }}</option>
                }
              }
            </select>
          </label>
          <label class="text-sm">1 {{ currency }} = how many {{ v.homeCurrency }}
            <input id="fx-rate" name="rate" type="number" min="0.000001" step="0.000001" [(ngModel)]="rate" required
              class="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg" />
          </label>
          <label class="text-sm">From
            <input id="fx-from" name="from" type="date" [(ngModel)]="from" class="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg" />
          </label>
          <button id="fx-save" type="submit" class="px-4 py-2 rounded-lg bg-[#0052CC] text-white text-sm font-semibold" [disabled]="saving()">
            {{ saving() ? 'Saving…' : 'Add rate' }}
          </button>
          <label class="text-sm sm:col-span-4">Note (optional, e.g. where the rate came from)
            <input id="fx-note" name="note" maxlength="200" [(ngModel)]="note" class="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg" />
          </label>
        </form>

        @if (v.history.length) {
          <details class="mt-4">
            <summary class="text-sm font-semibold text-[#475569] cursor-pointer">All rates set ({{ v.history.length }})</summary>
            <ul class="text-xs text-[#475569] mt-2 space-y-1" id="fx-history">
              @for (r of v.history; track r.id) {
                <li>1 {{ r.currency }} = {{ r.rate }} {{ v.homeCurrency }} from {{ r.effectiveFrom | date: 'd MMM y' }}{{ r.note ? ' · ' + r.note : '' }}</li>
              }
            </ul>
          </details>
        }
      }
    </section>
  `,
})
export class ExchangeRatesComponent implements OnInit {
  private currencyService = inject(CurrencyService);
  private toast = inject(ToastService);

  readonly view = signal<RatesView | null>(null);
  readonly saving = signal(false);
  currency = 'USD';
  rate: number | null = null;
  from = today();
  note = '';

  ngOnInit(): void {
    this.currencyService.rates().subscribe({ next: (v) => this.view.set(v), error: () => this.view.set(null) });
  }

  save(): void {
    if (!this.rate || this.rate <= 0) {
      this.toast.error('Enter the rate.');
      return;
    }
    this.saving.set(true);
    this.currencyService.setRate(this.currency, this.rate, this.from, this.note).subscribe({
      next: (v) => {
        this.view.set(v);
        this.saving.set(false);
        this.rate = null;
        this.note = '';
        this.toast.success(`${this.currency} rate saved`);
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.error(err?.error?.message || 'Not saved.');
      },
    });
  }
}
