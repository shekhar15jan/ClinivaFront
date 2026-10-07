import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Bill } from '../models/billing.model';

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  minorDigits: number;
}

export interface ExchangeRate {
  id: string;
  currency: string;
  /** Home currency units per one unit of `currency`. */
  rate: number;
  effectiveFrom: string;
  note: string | null;
  createdAt: string;
}

export interface RatesView {
  homeCurrency: string;
  currencies: CurrencyInfo[];
  current: ExchangeRate[];
  history: ExchangeRate[];
}

/** Currencies the clinic can use, its own exchange rates, and showing a bill in another currency (MULTI_CURRENCY). */
@Injectable({ providedIn: 'root' })
export class CurrencyService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/hms/currency`;

  private list$?: Observable<CurrencyInfo[]>;

  currencies(): Observable<CurrencyInfo[]> {
    this.list$ ??= this.http
      .get<{ data: CurrencyInfo[] }>(`${this.base}/currencies`)
      .pipe(map((r) => r.data), shareReplay(1));
    return this.list$;
  }

  rates(): Observable<RatesView> {
    return this.http.get<{ data: RatesView }>(`${this.base}/rates`).pipe(map((r) => r.data));
  }

  setRate(currency: string, rate: number, effectiveFrom: string, note: string): Observable<RatesView> {
    return this.http
      .post<{ data: RatesView }>(`${this.base}/rates`, { currency, rate, effectiveFrom, note: note || null })
      .pipe(map((r) => r.data));
  }

  /** Shows the bill in `currency` at today's rate for its date, or back in the home currency with ''. */
  setBillCurrency(billId: string, currency: string): Observable<Bill> {
    return this.http
      .put<{ data: Bill }>(`${this.base}/bills/${billId}`, { currency })
      .pipe(map((r) => r.data));
  }
}
