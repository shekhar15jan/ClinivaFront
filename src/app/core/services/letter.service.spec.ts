import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { LetterService } from './letter.service';
import { environment } from '../../../environments/environment';

describe('LetterService', () => {
  let service: LetterService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/hms`;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule], providers: [LetterService] });
    service = TestBed.inject(LetterService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('lists the letters of a consultation', () => {
    service.list('c1').subscribe((res) => expect(res.data?.length).toBe(1));
    const req = httpMock.expectOne(`${base}/consultations/c1/letters`);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: [{ id: 'l1' }] });
  });

  it('issues a letter', () => {
    service.issue('c1', { type: 'REFERRAL', referredTo: 'Dr. Mehta' }).subscribe();
    const req = httpMock.expectOne(`${base}/consultations/c1/letters`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ type: 'REFERRAL', referredTo: 'Dr. Mehta' });
    req.flush({ success: true });
  });

  it('downloads the PDF as a blob', () => {
    service.pdf('l1').subscribe((blob) => expect(blob.size).toBeGreaterThan(0));
    const req = httpMock.expectOne(`${base}/letters/l1/pdf`);
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob(['%PDF-']));
  });
});
