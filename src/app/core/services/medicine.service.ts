import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse, PagedResponse, RawPagedResponse } from '../models/common.model';
import { Medicine } from '../models/medicine.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MedicineService {
  private http = inject(HttpClient);

  private baseUrl = `${environment.apiUrl}/hms/medicines`;

  getMedicines(
    page?: number,
    size?: number,
    search?: string,
  ): Observable<ApiResponse<PagedResponse<Medicine>>> {
    let params = new HttpParams();
    if (page !== undefined) params = params.set('page', page);
    if (size !== undefined) params = params.set('size', size);
    if (search) params = params.set('q', search);
    return this.http
      .get<ApiResponse<RawPagedResponse<Medicine>>>(this.baseUrl, { params })
      .pipe(
        map((response) => ({
          ...response,
          data: PagedResponse.from(response.data),
        })),
      );
  }

  getMedicineById(id: string): Observable<ApiResponse<Medicine>> {
    return this.http.get<ApiResponse<Medicine>>(`${this.baseUrl}/${id}`);
  }

  searchMedicines(query: string): Observable<ApiResponse<Medicine[]>> {
    return this.http.get<ApiResponse<Medicine[]>>(`${this.baseUrl}/search`, {
      params: { q: query },
    });
  }

  createMedicine(medicine: Partial<Medicine>): Observable<ApiResponse<Medicine>> {
    return this.http.post<ApiResponse<Medicine>>(this.baseUrl, medicine);
  }

  updateMedicine(id: string, medicine: Partial<Medicine>): Observable<ApiResponse<Medicine>> {
    return this.http.put<ApiResponse<Medicine>>(`${this.baseUrl}/${id}`, medicine);
  }

  deactivate(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}`);
  }

  uploadMedicines(file: File): Observable<ApiResponse<{ imported: number; errors: string[] }>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<{ imported: number; errors: string[] }>>(`${this.baseUrl}/upload`, formData);
  }
}
