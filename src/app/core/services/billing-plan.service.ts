import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '../models/common.model';
import { environment } from '../../../environments/environment';

export interface PlanInvoice {
  id: string;
  invoiceNumber: string;
  kind: 'RENEWAL' | 'PLAN_CHANGE';
  planCode: string | null;
  targetPlanCode: string | null;
  totalPaise: number;
  currency: string;
  status: 'OPEN' | 'PAID' | 'EXPIRED' | 'CANCELLED';
  periodEnd: string | null;
  paidUntil: string | null;
  receiptNumber: string | null;
  paymentLinkUrl: string | null;
  downloadUrl: string | null;
  createdAt: string;
  paidAt: string | null;
}

export interface PlanOverview {
  productCode: string;
  planCode: string | null;
  planName: string | null;
  price: number | null;
  currency: string;
  cycle: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  renewalDate: string | null;
  daysLeft: number | null;
  paymentAvailable: boolean;
  pendingInvoice: PlanInvoice | null;
  invoices: PlanInvoice[];
}

export interface PublishedPlan {
  productCode: string;
  code: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  cycle: string;
  features: string[];
  popular: boolean;
}

export interface Checkout {
  invoice: PlanInvoice;
  paymentLinkUrl: string;
}

/** The clinic's plan, invoices and the renew / change flow (proxied by the API to the platform). */
@Injectable({ providedIn: 'root' })
export class BillingPlanService {
  private http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/hms/billing-plan`;

  overview(): Observable<PlanOverview> {
    return this.http.get<ApiResponse<PlanOverview>>(this.api).pipe(map((r) => r.data));
  }

  plans(): Observable<PublishedPlan[]> {
    return this.http.get<ApiResponse<PublishedPlan[]>>(`${this.api}/plans`).pipe(map((r) => r.data));
  }

  invoice(id: string): Observable<PlanInvoice> {
    return this.http.get<ApiResponse<PlanInvoice>>(`${this.api}/invoices/${id}`).pipe(map((r) => r.data));
  }

  checkout(planCode: string): Observable<Checkout> {
    return this.http.post<ApiResponse<Checkout>>(`${this.api}/checkout`, { planCode }).pipe(map((r) => r.data));
  }
}
