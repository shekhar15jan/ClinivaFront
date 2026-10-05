import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '../models/common.model';
import { Board, BoardItem, BookRequest, NoteRequest, SurgeryView, TheatreView } from '../models/ot.model';
import { environment } from '../../../environments/environment';

/** The operation theatre: theatres, the day's board, bookings, the safety checklist, the note and billing. */
@Injectable({ providedIn: 'root' })
export class OtService {
  private http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/hms/ot`;

  theatres(): Observable<TheatreView[]> {
    return this.http.get<ApiResponse<TheatreView[]>>(`${this.api}/theatres`).pipe(map((r) => r.data ?? []));
  }

  addTheatre(name: string): Observable<TheatreView> {
    return this.http.post<ApiResponse<TheatreView>>(`${this.api}/theatres`, { name }).pipe(map((r) => r.data));
  }

  setTheatreActive(id: string, active: boolean): Observable<TheatreView> {
    return this.http.put<ApiResponse<TheatreView>>(`${this.api}/theatres/${id}/active`, {}, { params: { active } }).pipe(map((r) => r.data));
  }

  board(day: string): Observable<Board> {
    return this.http.get<ApiResponse<Board>>(`${this.api}/board`, { params: { day } }).pipe(map((r) => r.data));
  }

  forPatient(patientId: string): Observable<BoardItem[]> {
    return this.http.get<ApiResponse<BoardItem[]>>(`${this.api}/surgeries/patient/${patientId}`).pipe(map((r) => r.data ?? []));
  }

  book(request: BookRequest): Observable<SurgeryView> {
    return this.http.post<ApiResponse<SurgeryView>>(`${this.api}/surgeries`, request).pipe(map((r) => r.data));
  }

  get(id: string): Observable<SurgeryView> {
    return this.http.get<ApiResponse<SurgeryView>>(`${this.api}/surgeries/${id}`).pipe(map((r) => r.data));
  }

  move(id: string, theatreId: string, scheduledStart: string, expectedMinutes: number): Observable<SurgeryView> {
    return this.http.put<ApiResponse<SurgeryView>>(`${this.api}/surgeries/${id}/move`, { theatreId, scheduledStart, expectedMinutes })
      .pipe(map((r) => r.data));
  }

  cancel(id: string, reason: string): Observable<SurgeryView> {
    return this.http.post<ApiResponse<SurgeryView>>(`${this.api}/surgeries/${id}/cancel`, { reason }).pipe(map((r) => r.data));
  }

  /** consent, sign-in, time-out or sign-out. */
  step(id: string, step: 'consent' | 'sign-in' | 'time-out' | 'sign-out'): Observable<SurgeryView> {
    return this.http.post<ApiResponse<SurgeryView>>(`${this.api}/surgeries/${id}/${step}`, {}).pipe(map((r) => r.data));
  }

  note(id: string, note: NoteRequest): Observable<SurgeryView> {
    return this.http.put<ApiResponse<SurgeryView>>(`${this.api}/surgeries/${id}/note`, note).pipe(map((r) => r.data));
  }

  bill(id: string): Observable<SurgeryView> {
    return this.http.post<ApiResponse<SurgeryView>>(`${this.api}/surgeries/${id}/bill`, {}).pipe(map((r) => r.data));
  }
}
