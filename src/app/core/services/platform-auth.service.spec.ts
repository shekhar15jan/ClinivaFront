import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PlatformAuthService } from './platform-auth.service';
import { ApiResponse } from '../models/common.model';
import { environment } from '../../../environments/environment';

describe('PlatformAuthService', () => {
  let service: PlatformAuthService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/platform/auth`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PlatformAuthService],
    });
    service = TestBed.inject(PlatformAuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => { httpMock.verify(); });

  it('should be created', () => { expect(service).toBeTruthy(); });

  describe('login', () => {
    it('should POST login with email and password', () => {
      const tokenResp = { accessToken: 'access-jwt', refreshToken: 'refresh-jwt' };
      const apiResp: ApiResponse<typeof tokenResp> = { success: true, data: tokenResp, message: '', timestamp: '', requestId: '' };

      service.login('admin@test.com', 'password123').subscribe((res) => {
        expect(res.data?.accessToken).toBe('access-jwt');
        expect(res.data?.refreshToken).toBe('refresh-jwt');
      });

      const req = httpMock.expectOne(`${baseUrl}/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'admin@test.com', password: 'password123' });
      req.flush(apiResp);
    });

    it('should propagate login errors', () => {
      service.login('bad@test.com', 'wrong').subscribe({
        error: (err) => expect(err.status).toBe(401),
      });

      httpMock.expectOne(`${baseUrl}/login`).flush({ success: false }, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('refresh', () => {
    it('should POST refresh with refresh token', () => {
      const tokenResp = { accessToken: 'new-access', refreshToken: 'new-refresh' };
      const apiResp: ApiResponse<typeof tokenResp> = { success: true, data: tokenResp, message: '', timestamp: '', requestId: '' };

      service.refresh('old-refresh-token').subscribe((res) => {
        expect(res.data?.accessToken).toBe('new-access');
      });

      const req = httpMock.expectOne(`${baseUrl}/refresh`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ refreshToken: 'old-refresh-token' });
      req.flush(apiResp);
    });
  });
});
