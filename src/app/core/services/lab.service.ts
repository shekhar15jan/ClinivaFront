import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse, PagedResponse, RawPagedResponse } from '../models/common.model';
import { OrderSummary, OrderView, Priority, TestRequest, TestView } from '../models/lab.model';
import { environment } from '../../../environments/environment';

/** The lab: catalog, ordering, the worklist, results, verification, billing and the report. */
@Injectable({ providedIn: 'root' })
export class LabService {
  private http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/hms/lab`;

  tests(activeOnly = true): Observable<TestView[]> {
    return this.http.get<ApiResponse<TestView[]>>(`${this.api}/tests`, { params: { active: activeOnly } }).pipe(map((r) => r.data ?? []));
  }

  createTest(request: TestRequest): Observable<TestView> {
    return this.http.post<ApiResponse<TestView>>(`${this.api}/tests`, request).pipe(map((r) => r.data));
  }

  updateTest(id: string, request: TestRequest): Observable<TestView> {
    return this.http.put<ApiResponse<TestView>>(`${this.api}/tests/${id}`, request).pipe(map((r) => r.data));
  }

  setActive(id: string, active: boolean): Observable<TestView> {
    return this.http.put<ApiResponse<TestView>>(`${this.api}/tests/${id}/active`, {}, { params: { active } }).pipe(map((r) => r.data));
  }

  starter(): Observable<TestView[]> {
    return this.http.post<ApiResponse<TestView[]>>(`${this.api}/tests/starter`, {}).pipe(map((r) => r.data ?? []));
  }

  order(patientId: string, testIds: string[], priority: Priority, clinicalNote: string | null, admissionId: string | null,
        doctorId: string | null): Observable<OrderView> {
    return this.http
      .post<ApiResponse<OrderView>>(`${this.api}/orders`, { patientId, testIds, priority, clinicalNote, admissionId, doctorId })
      .pipe(map((r) => r.data));
  }

  worklist(stage: string, q: string, page = 0, size = 20): Observable<PagedResponse<OrderSummary>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (stage) params = params.set('stage', stage);
    if (q.trim()) params = params.set('q', q.trim());
    return this.http.get<ApiResponse<RawPagedResponse<OrderSummary>>>(`${this.api}/orders`, { params }).pipe(map((r) => PagedResponse.from(r.data)));
  }

  forPatient(patientId: string): Observable<OrderSummary[]> {
    return this.http.get<ApiResponse<OrderSummary[]>>(`${this.api}/orders/patient/${patientId}`).pipe(map((r) => r.data ?? []));
  }

  forAdmission(admissionId: string): Observable<OrderSummary[]> {
    return this.http.get<ApiResponse<OrderSummary[]>>(`${this.api}/orders/admission/${admissionId}`).pipe(map((r) => r.data ?? []));
  }

  get(id: string): Observable<OrderView> {
    return this.http.get<ApiResponse<OrderView>>(`${this.api}/orders/${id}`).pipe(map((r) => r.data));
  }

  collect(id: string): Observable<OrderView> {
    return this.http.post<ApiResponse<OrderView>>(`${this.api}/orders/${id}/collect`, {}).pipe(map((r) => r.data));
  }

  results(itemId: string, values: { parameterId: string; value: string }[], comment: string | null): Observable<OrderView> {
    return this.http.put<ApiResponse<OrderView>>(`${this.api}/items/${itemId}/results`, { values, comment }).pipe(map((r) => r.data));
  }

  verify(itemId: string): Observable<OrderView> {
    return this.http.post<ApiResponse<OrderView>>(`${this.api}/items/${itemId}/verify`, {}).pipe(map((r) => r.data));
  }

  cancel(itemId: string, reason: string): Observable<OrderView> {
    return this.http.post<ApiResponse<OrderView>>(`${this.api}/items/${itemId}/cancel`, { reason }).pipe(map((r) => r.data));
  }

  bill(id: string): Observable<OrderView> {
    return this.http.post<ApiResponse<OrderView>>(`${this.api}/orders/${id}/bill`, {}).pipe(map((r) => r.data));
  }

  report(id: string): Observable<Blob> {
    return this.http.get(`${this.api}/orders/${id}/report`, { responseType: 'blob' });
  }
}
