import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ReportService } from './report.service';
import { DashboardStats, AppointmentTrend, RevenueReport, DoctorPerformance } from '../models/report.model';
import { ApiResponse } from '../models/common.model';
import { environment } from '../../../environments/environment';

describe('ReportService', () => {
  let service: ReportService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/hms/reports`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ReportService],
    });
    service = TestBed.inject(ReportService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getDashboardStats', () => {
    it('should GET dashboard stats', () => {
      const mockResponse: ApiResponse<DashboardStats> = {
        success: true,
        data: { totalPatients: 100, todayAppointments: 15, pendingBills: 5, totalRevenueInPaisa: 500000, activeDoctors: 10 },
        message: '',
        timestamp: '',
        requestId: '',
      };

      service.getDashboardStats().subscribe((res) => {
        expect(res.data.totalPatients).toBe(100);
      });

      const req = httpMock.expectOne(`${baseUrl}/dashboard`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getAppointmentTrends', () => {
    it('should GET appointment trends', () => {
      const mockResponse: ApiResponse<AppointmentTrend[]> = {
        success: true,
        data: [{ month: '2024-01', count: 50 }],
        message: '',
        timestamp: '',
        requestId: '',
      };

      service.getAppointmentTrends().subscribe((res) => {
        expect(res.data.length).toBe(1);
      });

      const req = httpMock.expectOne(`${baseUrl}/appointment-trends`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getRevenueReport', () => {
    it('should GET revenue report', () => {
      const mockResponse: ApiResponse<RevenueReport> = {
        success: true,
        data: { totalBilledInPaisa: 1000000, totalCollectedInPaisa: 800000, outstandingInPaisa: 200000, monthlyBreakdown: [] },
        message: '',
        timestamp: '',
        requestId: '',
      };

      service.getRevenueReport().subscribe((res) => {
        expect(res.data.totalBilledInPaisa).toBe(1000000);
      });

      const req = httpMock.expectOne(`${baseUrl}/revenue`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getDoctorPerformance', () => {
    it('should GET doctor performance', () => {
      const mockResponse: ApiResponse<DoctorPerformance[]> = {
        success: true,
        data: [{ doctorId: 'd1', doctorName: 'Dr. A', consultationCount: 30, revenueInPaisa: 150000 }],
        message: '',
        timestamp: '',
        requestId: '',
      };

      service.getDoctorPerformance().subscribe((res) => {
        expect(res.data[0].doctorName).toBe('Dr. A');
      });

      const req = httpMock.expectOne(`${baseUrl}/doctor-performance`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle error', () => {
      service.getDoctorPerformance().subscribe({
        error: (err) => {
          expect(err.status).toBe(500);
        },
      });

      const req = httpMock.expectOne(`${baseUrl}/doctor-performance`);
      req.flush({ success: false }, { status: 500, statusText: 'Server Error' });
    });
  });

  describe('getAppointmentsPerMonth', () => {
    it('should GET appointments per month', () => {
      const mockResponse: ApiResponse<AppointmentTrend[]> = {
        success: true,
        data: [{ month: '2024-06', count: 120 }],
        message: '',
        timestamp: '',
        requestId: '',
      };

      service.getAppointmentsPerMonth().subscribe((res) => {
        expect(res.data[0].count).toBe(120);
      });

      const req = httpMock.expectOne(`${baseUrl}/appointments-per-month`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getBillsStatus', () => {
    it('should GET bills status', () => {
      const mockResponse: ApiResponse<DashboardStats> = {
        success: true,
        data: { totalPatients: 0, todayAppointments: 0, pendingBills: 3, totalRevenueInPaisa: 0, activeDoctors: 0 },
        message: '',
        timestamp: '',
        requestId: '',
      };

      service.getBillsStatus().subscribe((res) => {
        expect(res.data.pendingBills).toBe(3);
      });

      const req = httpMock.expectOne(`${baseUrl}/bills-status`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });
});
