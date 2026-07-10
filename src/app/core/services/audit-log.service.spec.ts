import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuditLogService } from './audit-log.service';
import { AuditLog } from '../models/audit-log.model';
import { ApiResponse, PagedResponse } from '../models/common.model';
import { environment } from '../../../environments/environment';

describe('AuditLogService', () => {
  let service: AuditLogService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/hms/audit-logs`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuditLogService],
    });
    service = TestBed.inject(AuditLogService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAuditLogs', () => {
    it('should GET with all params and unwrap data', () => {
      const pagedData: PagedResponse<AuditLog> = {
        content: [
          { id: 'log1', tenantId: 't1', userId: 'u1', userName: 'Admin', action: 'LOGIN', entity: 'USER', entityId: 'u1', oldValue: null, newValue: null, ipAddress: '127.0.0.1', timestamp: '2024-01-01T00:00:00Z' },
        ],
        pageNumber: 0,
        pageSize: 20,
        totalElements: 1,
        totalPages: 1,
        last: true,
      };
      const mockResponse: ApiResponse<PagedResponse<AuditLog>> = { success: true, data: pagedData, message: '', timestamp: '', requestId: '' };

      const params = { page: 0, size: 20, startDate: '2024-01-01', endDate: '2024-01-31', userId: 'u1', entity: 'USER', action: 'LOGIN' };

      service.getAuditLogs(params).subscribe((result) => {
        expect(result.pageNumber).toBe(0);
        expect(result.content.length).toBe(1);
        expect(result.content[0].action).toBe('LOGIN');
      });

      const expectedUrl = `${apiUrl}?page=0&size=20&startDate=2024-01-01&endDate=2024-01-31&userId=u1&entity=USER&action=LOGIN`;
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle error', () => {
      service.getAuditLogs({}).subscribe({
        error: (err) => {
          expect(err.status).toBe(403);
        },
      });

      const req = httpMock.expectOne((r) => r.url.startsWith(apiUrl));
      req.flush({ success: false }, { status: 403, statusText: 'Forbidden' });
    });
  });
});
