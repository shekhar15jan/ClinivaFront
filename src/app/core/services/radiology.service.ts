import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse, PagedResponse, RawPagedResponse } from '../models/common.model';
import { ImagingOrderSummary, ImagingOrderView, ImagingPriority, StudyRequest, StudyView } from '../models/radiology.model';
import { environment } from '../../../environments/environment';

/** Radiology: catalog, ordering, the worklist, studies done, reports signed, billing and the printed report. */
@Injectable({ providedIn: 'root' })
export class RadiologyService {
  private http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/hms/radiology`;

  studies(activeOnly = true): Observable<StudyView[]> {
    return this.http.get<ApiResponse<StudyView[]>>(`${this.api}/studies`, { params: { active: activeOnly } }).pipe(map((r) => r.data ?? []));
  }

  createStudy(request: StudyRequest): Observable<StudyView> {
    return this.http.post<ApiResponse<StudyView>>(`${this.api}/studies`, request).pipe(map((r) => r.data));
  }

  updateStudy(id: string, request: StudyRequest): Observable<StudyView> {
    return this.http.put<ApiResponse<StudyView>>(`${this.api}/studies/${id}`, request).pipe(map((r) => r.data));
  }

  setActive(id: string, active: boolean): Observable<StudyView> {
    return this.http.put<ApiResponse<StudyView>>(`${this.api}/studies/${id}/active`, {}, { params: { active } }).pipe(map((r) => r.data));
  }

  starter(): Observable<StudyView[]> {
    return this.http.post<ApiResponse<StudyView[]>>(`${this.api}/studies/starter`, {}).pipe(map((r) => r.data ?? []));
  }

  order(patientId: string, studyIds: string[], priority: ImagingPriority, clinicalNote: string | null,
        admissionId: string | null): Observable<ImagingOrderView> {
    return this.http
      .post<ApiResponse<ImagingOrderView>>(`${this.api}/orders`, { patientId, studyIds, priority, clinicalNote, admissionId })
      .pipe(map((r) => r.data));
  }

  worklist(stage: string, q: string, page = 0, size = 20): Observable<PagedResponse<ImagingOrderSummary>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (stage) params = params.set('stage', stage);
    if (q.trim()) params = params.set('q', q.trim());
    return this.http.get<ApiResponse<RawPagedResponse<ImagingOrderSummary>>>(`${this.api}/orders`, { params })
      .pipe(map((r) => PagedResponse.from(r.data)));
  }

  forPatient(patientId: string): Observable<ImagingOrderSummary[]> {
    return this.http.get<ApiResponse<ImagingOrderSummary[]>>(`${this.api}/orders/patient/${patientId}`).pipe(map((r) => r.data ?? []));
  }

  get(id: string): Observable<ImagingOrderView> {
    return this.http.get<ApiResponse<ImagingOrderView>>(`${this.api}/orders/${id}`).pipe(map((r) => r.data));
  }

  schedule(itemId: string, scheduledAt: string | null): Observable<ImagingOrderView> {
    return this.http.put<ApiResponse<ImagingOrderView>>(`${this.api}/items/${itemId}/schedule`, { scheduledAt }).pipe(map((r) => r.data));
  }

  done(itemId: string, imageLink: string | null, note: string | null, formFNumber: string | null): Observable<ImagingOrderView> {
    return this.http.post<ApiResponse<ImagingOrderView>>(`${this.api}/items/${itemId}/done`, { imageLink, note, formFNumber })
      .pipe(map((r) => r.data));
  }

  report(itemId: string, findings: string, impression: string): Observable<ImagingOrderView> {
    return this.http.put<ApiResponse<ImagingOrderView>>(`${this.api}/items/${itemId}/report`, { findings, impression }).pipe(map((r) => r.data));
  }

  addendum(itemId: string, text: string): Observable<ImagingOrderView> {
    return this.http.post<ApiResponse<ImagingOrderView>>(`${this.api}/items/${itemId}/addendum`, { text }).pipe(map((r) => r.data));
  }

  cancel(itemId: string, reason: string): Observable<ImagingOrderView> {
    return this.http.post<ApiResponse<ImagingOrderView>>(`${this.api}/items/${itemId}/cancel`, { reason }).pipe(map((r) => r.data));
  }

  bill(id: string): Observable<ImagingOrderView> {
    return this.http.post<ApiResponse<ImagingOrderView>>(`${this.api}/orders/${id}/bill`, {}).pipe(map((r) => r.data));
  }

  reportPdf(id: string): Observable<Blob> {
    return this.http.get(`${this.api}/orders/${id}/report`, { responseType: 'blob' });
  }
}
