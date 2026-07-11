import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ContactService } from './contact.service';
import { ContactMessageResponse, CreateContactRequest } from '../models/contact.model';
import { ApiResponse } from '../models/common.model';
import { environment } from '../../../environments/environment';

describe('ContactService', () => {
  let service: ContactService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/hms/contacts`;

  const mockResponse: ContactMessageResponse = {
    id: 'c1', tenantId: 't1', name: 'John', email: 'john@example.com',
    phone: '9999999999', subject: 'Query', message: 'Test message',
    status: 'NEW', adminReply: '', createdAt: '2026-01-01T00:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ContactService],
    });
    service = TestBed.inject(ContactService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => { httpMock.verify(); });

  it('should be created', () => { expect(service).toBeTruthy(); });

  describe('submit', () => {
    it('should POST contact request', () => {
      const request: CreateContactRequest = { name: 'John', email: 'john@test.com', message: 'Hello' };
      const apiResp: ApiResponse<ContactMessageResponse> = { success: true, data: mockResponse, message: '', timestamp: '', requestId: '' };

      service.submit(request).subscribe((res) => {
        expect(res.data?.name).toBe('John');
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(apiResp);
    });
  });

  describe('list', () => {
    it('should GET all messages', () => {
      const apiResp: ApiResponse<ContactMessageResponse[]> = { success: true, data: [mockResponse], message: '', timestamp: '', requestId: '' };

      service.list().subscribe((res) => {
        expect(res.data?.length).toBe(1);
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('GET');
      req.flush(apiResp);
    });
  });

  describe('getByStatus', () => {
    it('should GET by status', () => {
      const apiResp: ApiResponse<ContactMessageResponse[]> = { success: true, data: [mockResponse], message: '', timestamp: '', requestId: '' };

      service.getByStatus('NEW').subscribe((res) => {
        expect(res.data?.length).toBe(1);
      });

      const req = httpMock.expectOne(`${baseUrl}/status/NEW`);
      expect(req.request.method).toBe('GET');
      req.flush(apiResp);
    });
  });

  describe('reply', () => {
    it('should PUT reply with text/plain header', () => {
      const apiResp: ApiResponse<ContactMessageResponse> = { success: true, data: { ...mockResponse, adminReply: 'Thanks!' }, message: '', timestamp: '', requestId: '' };

      service.reply('c1', 'Thanks!').subscribe((res) => {
        expect(res.data?.adminReply).toBe('Thanks!');
      });

      const req = httpMock.expectOne(`${baseUrl}/c1/reply`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toBe('Thanks!');
      expect(req.request.headers.get('Content-Type')).toBe('text/plain');
      req.flush(apiResp);
    });
  });

  describe('error handling', () => {
    it('should propagate HTTP errors', () => {
      service.list().subscribe({
        error: (err) => expect(err.status).toBe(500),
      });

      httpMock.expectOne(baseUrl).flush({}, { status: 500, statusText: 'Server Error' });
    });
  });
});
