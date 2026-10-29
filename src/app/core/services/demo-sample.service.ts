import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

/** The training clinic offered in a demo environment (CLIN-14). */
export interface SampleStatus { available: boolean; empty: boolean; loaded: boolean; }
export interface SampleLoaded { doctors: number; patients: number; appointments: number; exercises: string[]; }

@Injectable({ providedIn: 'root' })
export class DemoSampleService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/hms/demo/sample-data`;

  status(): Observable<SampleStatus> {
    return this.http.get<{ data: SampleStatus }>(this.apiUrl).pipe(map((r) => r.data));
  }

  load(): Observable<SampleLoaded> {
    return this.http.post<{ data: SampleLoaded }>(this.apiUrl, {}).pipe(map((r) => r.data));
  }
}
