import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UserManagementService } from './user-management.service';
import { ManagedUser, CreateManagedUserRequest } from '../models/user-management.model';
import { ApiResponse, PagedResponse } from '../models/common.model';
import { environment } from '../../../environments/environment';

describe('UserManagementService', () => {
  let service: UserManagementService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/hms/users`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserManagementService],
    });
    service = TestBed.inject(UserManagementService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getUsers', () => {
    it('should GET paged users and unwrap data', () => {
      const pagedData: PagedResponse<ManagedUser> = {
        content: [{ id: 'u1', email: 'admin@test.com', firstName: 'Admin', lastName: 'User', roles: 'ADMIN', isActive: true, createdAt: '' }],
        pageNumber: 0,
        pageSize: 20,
        totalElements: 1,
        totalPages: 1,
        last: true,
      };
      const mockResponse: ApiResponse<PagedResponse<ManagedUser>> = { success: true, data: pagedData, message: '', timestamp: '', requestId: '' };

      service.getUsers(0, 20).subscribe((result) => {
        expect(result.pageNumber).toBe(0);
        expect(result.content.length).toBe(1);
        expect(result.content[0].email).toBe('admin@test.com');
      });

      const req = httpMock.expectOne(`${apiUrl}?page=0&size=20`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getUserById', () => {
    it('should GET user by id and unwrap data', () => {
      const user: ManagedUser = { id: 'u1', email: 'user@test.com', firstName: 'John', lastName: 'Doe', roles: 'DOCTOR', isActive: true, createdAt: '' };
      const mockResponse: ApiResponse<ManagedUser> = { success: true, data: user, message: '', timestamp: '', requestId: '' };

      service.getUserById('u1').subscribe((result) => {
        expect(result.id).toBe('u1');
        expect(result.roles).toBe('DOCTOR');
      });

      const req = httpMock.expectOne(`${apiUrl}/u1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('createUser', () => {
    it('should POST and unwrap data', () => {
      const request: CreateManagedUserRequest = { email: 'new@test.com', firstName: 'New', lastName: 'User', role: 'RECEPTIONIST', password: 'Str0ng#Pass' };
      const created: ManagedUser = { id: 'u2', email: 'new@test.com', firstName: 'New', lastName: 'User', roles: 'RECEPTIONIST', isActive: true, createdAt: '' };
      const mockResponse: ApiResponse<ManagedUser> = { success: true, data: created, message: '', timestamp: '', requestId: '' };

      service.createUser(request).subscribe((result) => {
        expect(result.email).toBe('new@test.com');
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });
  });

  describe('deactivateUser', () => {
    it('should PATCH deactivate', () => {
      service.deactivateUser('u1').subscribe((result) => {
        expect(result).toBeUndefined();
      });

      const req = httpMock.expectOne(`${apiUrl}/u1/deactivate`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({});
      req.flush({ success: true, data: undefined, message: '', timestamp: '', requestId: '' });
    });
  });

  describe('activateUser', () => {
    it('should PATCH activate', () => {
      service.activateUser('u1').subscribe((result) => {
        expect(result).toBeUndefined();
      });

      const req = httpMock.expectOne(`${apiUrl}/u1/activate`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({});
      req.flush({ success: true, data: undefined, message: '', timestamp: '', requestId: '' });
    });
  });

  describe('resetPassword', () => {
    it('should POST reset-password and unwrap data', () => {
      const mockResponse: ApiResponse<{ temporaryPassword: string }> = {
        success: true,
        data: { temporaryPassword: 'Temp@123' },
        message: '',
        timestamp: '',
        requestId: '',
      };

      service.resetPassword('u1').subscribe((result) => {
        expect(result.temporaryPassword).toBe('Temp@123');
      });

      const req = httpMock.expectOne(`${apiUrl}/u1/reset-password`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });
  });
});
