import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '../models/common.model';
import { environment } from '../../../environments/environment';

export interface BookingClinic { name: string; logoUrl: string | null; timezone: string | null; }
export interface BookingDoctor { id: string; name: string; specialization: string | null; feeInPaisa: number | null; }
export interface BookingReceipt { reference: string; message: string; }
export interface BookingSubmit {
  doctorId: string; date: string; time: string; name: string; phone: string;
  email?: string; reason?: string; website?: string;
}
export interface BookingRequestView {
  id: string; reference: string; doctorId: string; doctorName: string; date: string; time: string;
  name: string; phone: string; email: string | null; reason: string | null; status: string; createdAt: string;
}

/** The clinic's public booking page (no sign-in) and the front desk's list of the requests it produced. */
@Injectable({ providedIn: 'root' })
export class BookingService {
  private http = inject(HttpClient);
  private readonly pub = `${environment.apiUrl}/public/booking`;
  private readonly staff = `${environment.apiUrl}/hms/booking-requests`;

  clinic(code: string): Observable<BookingClinic> {
    return this.http.get<ApiResponse<BookingClinic>>(`${this.pub}/${encodeURIComponent(code)}`).pipe(map((r) => r.data));
  }

  doctors(code: string): Observable<BookingDoctor[]> {
    return this.http.get<ApiResponse<BookingDoctor[]>>(`${this.pub}/${encodeURIComponent(code)}/doctors`).pipe(map((r) => r.data ?? []));
  }

  times(code: string, doctorId: string, date: string): Observable<string[]> {
    return this.http
      .get<ApiResponse<string[]>>(`${this.pub}/${encodeURIComponent(code)}/doctors/${doctorId}/times`, { params: new HttpParams().set('date', date) })
      .pipe(map((r) => r.data ?? []));
  }

  submit(code: string, body: BookingSubmit): Observable<BookingReceipt> {
    return this.http.post<ApiResponse<BookingReceipt>>(`${this.pub}/${encodeURIComponent(code)}/requests`, body).pipe(map((r) => r.data));
  }

  open(): Observable<BookingRequestView[]> {
    return this.http.get<ApiResponse<BookingRequestView[]>>(this.staff).pipe(map((r) => r.data ?? []));
  }

  book(id: string, change?: { date?: string; time?: string }): Observable<unknown> {
    return this.http.post(`${this.staff}/${id}/book`, change ?? {});
  }

  decline(id: string): Observable<unknown> {
    return this.http.post(`${this.staff}/${id}/decline`, {});
  }
}
