import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ReviewService } from './review.service';
import { ReviewResponse, CreateReviewRequest } from '../models/review.model';
import { ApiResponse } from '../models/common.model';
import { environment } from '../../../environments/environment';

describe('ReviewService', () => {
  let service: ReviewService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/hms/reviews`;

  const mockReview: ReviewResponse = {
    id: 'r1', patientId: 'p1', patientName: 'John', doctorId: 'd1', doctorName: 'Dr. Smith',
    rating: 5, reviewText: 'Great service', isApproved: true, createdAt: '2026-01-01T00:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ReviewService],
    });
    service = TestBed.inject(ReviewService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => { httpMock.verify(); });

  it('should be created', () => { expect(service).toBeTruthy(); });

  describe('submit', () => {
    it('should POST a review', () => {
      const request: CreateReviewRequest = { patientId: 'p1', doctorId: 'd1', rating: 5, reviewText: 'Great' };
      const apiResp: ApiResponse<ReviewResponse> = { success: true, data: mockReview, message: '', timestamp: '', requestId: '' };

      service.submit(request).subscribe((res) => {
        expect(res.data?.rating).toBe(5);
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(apiResp);
    });
  });

  describe('getApproved', () => {
    it('should GET approved reviews', () => {
      const apiResp: ApiResponse<ReviewResponse[]> = { success: true, data: [mockReview], message: '', timestamp: '', requestId: '' };

      service.getApproved().subscribe((res) => {
        expect(res.data?.length).toBe(1);
        expect(res.data?.[0].isApproved).toBe(true);
      });

      const req = httpMock.expectOne(`${baseUrl}/approved`);
      expect(req.request.method).toBe('GET');
      req.flush(apiResp);
    });
  });

  describe('getPending', () => {
    it('should GET pending reviews', () => {
      const pendingReview = { ...mockReview, isApproved: false };
      const apiResp: ApiResponse<ReviewResponse[]> = { success: true, data: [pendingReview], message: '', timestamp: '', requestId: '' };

      service.getPending().subscribe((res) => {
        expect(res.data?.[0].isApproved).toBe(false);
      });

      const req = httpMock.expectOne(`${baseUrl}/pending`);
      expect(req.request.method).toBe('GET');
      req.flush(apiResp);
    });
  });

  describe('approveReview', () => {
    it('should PUT approve', () => {
      const apiResp: ApiResponse<ReviewResponse> = { success: true, data: { ...mockReview, isApproved: true }, message: '', timestamp: '', requestId: '' };

      service.approveReview('r1').subscribe((res) => {
        expect(res.data?.isApproved).toBe(true);
      });

      const req = httpMock.expectOne(`${baseUrl}/r1/approve`);
      expect(req.request.method).toBe('PUT');
      req.flush(apiResp);
    });
  });

  describe('rejectReview', () => {
    it('should PUT reject', () => {
      const apiResp: ApiResponse<void> = { success: true, data: undefined, message: '', timestamp: '', requestId: '' };

      service.rejectReview('r1').subscribe((res) => {
        expect(res.success).toBe(true);
      });

      const req = httpMock.expectOne(`${baseUrl}/r1/reject`);
      expect(req.request.method).toBe('PUT');
      req.flush(apiResp);
    });
  });
});
