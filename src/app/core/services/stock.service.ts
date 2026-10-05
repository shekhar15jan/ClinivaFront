import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '../models/common.model';
import { Alerts, IssueView, MedicineStock, ReceiptLine, StockLine, Supplier } from '../models/stock.model';
import { environment } from '../../../environments/environment';

/** The pharmacy's stock: what is on the shelf, receiving, counting, and issuing to inpatients. */
@Injectable({ providedIn: 'root' })
export class StockService {
  private http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/hms/stock`;

  overview(q = ''): Observable<StockLine[]> {
    const params = q.trim() ? new HttpParams().set('q', q.trim()) : undefined;
    return this.http.get<ApiResponse<StockLine[]>>(this.api, { params }).pipe(map((r) => r.data ?? []));
  }

  alerts(days = 60): Observable<Alerts> {
    return this.http.get<ApiResponse<Alerts>>(`${this.api}/alerts`, { params: { days } }).pipe(map((r) => r.data));
  }

  medicine(id: string): Observable<MedicineStock> {
    return this.http.get<ApiResponse<MedicineStock>>(`${this.api}/medicines/${id}`).pipe(map((r) => r.data));
  }

  reorderLevel(id: string, reorderLevel: number): Observable<StockLine> {
    return this.http.put<ApiResponse<StockLine>>(`${this.api}/medicines/${id}/reorder-level`, { reorderLevel }).pipe(map((r) => r.data));
  }

  suppliers(): Observable<Supplier[]> {
    return this.http.get<ApiResponse<Supplier[]>>(`${this.api}/suppliers`).pipe(map((r) => r.data ?? []));
  }

  addSupplier(name: string, phone: string | null, gstin: string | null): Observable<Supplier> {
    return this.http.post<ApiResponse<Supplier>>(`${this.api}/suppliers`, { name, phone, gstin }).pipe(map((r) => r.data));
  }

  receive(supplierId: string | null, invoiceNumber: string | null, lines: ReceiptLine[]): Observable<StockLine[]> {
    return this.http
      .post<ApiResponse<StockLine[]>>(`${this.api}/receipts`, { supplierId, invoiceNumber, lines })
      .pipe(map((r) => r.data ?? []));
  }

  writeOff(batchId: string): Observable<MedicineStock> {
    return this.http.post<ApiResponse<MedicineStock>>(`${this.api}/batches/${batchId}/write-off`, {}).pipe(map((r) => r.data));
  }

  adjust(medicineId: string, batchId: string | null, change: number, reason: string): Observable<MedicineStock> {
    return this.http
      .post<ApiResponse<MedicineStock>>(`${this.api}/adjustments`, { medicineId, batchId, change, reason })
      .pipe(map((r) => r.data));
  }

  issues(admissionId: string): Observable<IssueView[]> {
    return this.http.get<ApiResponse<IssueView[]>>(`${this.api}/admissions/${admissionId}/issues`).pipe(map((r) => r.data ?? []));
  }

  issue(admissionId: string, medicineId: string, quantity: number): Observable<IssueView[]> {
    return this.http
      .post<ApiResponse<IssueView[]>>(`${this.api}/issues`, { admissionId, medicineId, quantity })
      .pipe(map((r) => r.data ?? []));
  }

  giveBack(admissionId: string, chargeId: string, quantity: number): Observable<IssueView[]> {
    return this.http
      .post<ApiResponse<IssueView[]>>(`${this.api}/returns`, { admissionId, chargeId, quantity })
      .pipe(map((r) => r.data ?? []));
  }
}
