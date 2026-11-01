import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DrugSafetyService } from './drug-safety.service';
import { environment } from '../../../environments/environment';

describe('DrugSafetyService', () => {
  let service: DrugSafetyService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/hms`;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule], providers: [DrugSafetyService] });
    service = TestBed.inject(DrugSafetyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('lists a patient\'s allergies', () => {
    service.allergies('p1').subscribe((res) => expect(res.data?.length).toBe(1));
    const req = httpMock.expectOne(`${base}/patients/p1/allergies`);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: [{ id: 'a1', substance: 'Penicillin', severity: 'SEVERE', recordedAt: '2026-11-01' }] });
  });

  it('records an allergy, dropping an empty reaction', () => {
    service.addAllergy('p1', 'Penicillin', 'SEVERE', '  ').subscribe();
    const req = httpMock.expectOne(`${base}/patients/p1/allergies`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ substance: 'Penicillin', severity: 'SEVERE', reaction: undefined });
    req.flush({ success: true });
  });

  it('removes an allergy', () => {
    service.removeAllergy('p1', 'a1').subscribe();
    const req = httpMock.expectOne(`${base}/patients/p1/allergies/a1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true });
  });

  it('asks the server to check the drugs of a prescription', () => {
    service.check('p1', [{ medicineName: 'Amoxicillin 500' }]).subscribe((res) => expect(res.data?.[0].blocking).toBe(true));
    const req = httpMock.expectOne(`${base}/prescriptions/safety-check`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ patientId: 'p1', medicines: [{ medicineName: 'Amoxicillin 500' }] });
    req.flush({ success: true, data: [{ type: 'ALLERGY', severity: 'SEVERE', medicine: 'Amoxicillin 500', message: 'x', blocking: true }] });
  });
});
