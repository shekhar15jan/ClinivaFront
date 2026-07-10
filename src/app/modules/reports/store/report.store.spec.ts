import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { ReportStore } from './report.store';
import { ReportService } from '../../../core/services/report.service';
import { DashboardStats, AppointmentTrend, RevenueReport, DoctorPerformance } from '../../../core/models/report.model';

describe('ReportStore', () => {
  let store: InstanceType<typeof ReportStore>;
  let mockReportService: Partial<ReportService>;

  const mockDashboardStats: DashboardStats = {
    totalPatients: 100,
    todayAppointments: 15,
    pendingBills: 5,
    totalRevenueInPaisa: 500000,
    activeDoctors: 3,
  };

  const mockAppointmentTrends: AppointmentTrend[] = [
    { month: '2026-01', count: 50 },
    { month: '2026-02', count: 60 },
  ];

  const mockRevenueReport: RevenueReport = {
    totalBilledInPaisa: 500000,
    totalCollectedInPaisa: 400000,
    outstandingInPaisa: 100000,
    monthlyBreakdown: [],
  };

  const mockDoctorPerformance: DoctorPerformance[] = [
    { doctorId: 'd1', doctorName: 'Dr. Smith', consultationCount: 30, revenueInPaisa: 150000 },
  ];

  beforeEach(() => {
    mockReportService = {
      getDashboardStats: vi.fn().mockReturnValue(of({ success: true, data: mockDashboardStats, message: 'ok', timestamp: '', requestId: 'r1' })),
      getAppointmentTrends: vi.fn().mockReturnValue(of({ success: true, data: mockAppointmentTrends, message: 'ok', timestamp: '', requestId: 'r1' })),
      getRevenueReport: vi.fn().mockReturnValue(of({ success: true, data: mockRevenueReport, message: 'ok', timestamp: '', requestId: 'r1' })),
      getDoctorPerformance: vi.fn().mockReturnValue(of({ success: true, data: mockDoctorPerformance, message: 'ok', timestamp: '', requestId: 'r1' })),
    };

    TestBed.configureTestingModule({
      providers: [
        ReportStore,
        { provide: ReportService, useValue: mockReportService },
      ],
    });

    store = TestBed.inject(ReportStore);
  });

  it('should have initial state', () => {
    expect(store.dashboardStats()).toBeNull();
    expect(store.appointmentTrends()).toEqual([]);
    expect(store.revenueReport()).toBeNull();
    expect(store.doctorPerformance()).toEqual([]);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('should load dashboard stats successfully', fakeAsync(() => {
    store.loadDashboardStats();
    tick();
    expect(store.dashboardStats()).toEqual(mockDashboardStats);
    expect(store.loading()).toBe(false);
    expect(mockReportService.getDashboardStats).toHaveBeenCalledOnce();
  }));

  it('should handle load dashboard stats error', fakeAsync(() => {
    mockReportService.getDashboardStats = vi.fn().mockReturnValue(throwError(() => new Error('Dashboard failed')));
    const errorStore = TestBed.inject(ReportStore);
    errorStore.loadDashboardStats();
    tick();
    expect(errorStore.error()).toBe('Dashboard failed');
    expect(errorStore.loading()).toBe(false);
  }));

  it('should load appointment trends successfully', fakeAsync(() => {
    store.loadAppointmentTrends();
    tick();
    expect(store.appointmentTrends()).toEqual(mockAppointmentTrends);
    expect(store.loading()).toBe(false);
    expect(mockReportService.getAppointmentTrends).toHaveBeenCalledOnce();
  }));

  it('should handle load appointment trends error', fakeAsync(() => {
    mockReportService.getAppointmentTrends = vi.fn().mockReturnValue(throwError(() => new Error('Trends failed')));
    const errorStore = TestBed.inject(ReportStore);
    errorStore.loadAppointmentTrends();
    tick();
    expect(errorStore.error()).toBe('Trends failed');
  }));

  it('should load revenue report successfully', fakeAsync(() => {
    store.loadRevenueReport();
    tick();
    expect(store.revenueReport()).toEqual(mockRevenueReport);
    expect(store.loading()).toBe(false);
    expect(mockReportService.getRevenueReport).toHaveBeenCalledOnce();
  }));

  it('should handle load revenue report error', fakeAsync(() => {
    mockReportService.getRevenueReport = vi.fn().mockReturnValue(throwError(() => new Error('Revenue failed')));
    const errorStore = TestBed.inject(ReportStore);
    errorStore.loadRevenueReport();
    tick();
    expect(errorStore.error()).toBe('Revenue failed');
  }));

  it('should load doctor performance successfully', fakeAsync(() => {
    store.loadDoctorPerformance();
    tick();
    expect(store.doctorPerformance()).toEqual(mockDoctorPerformance);
    expect(store.loading()).toBe(false);
    expect(mockReportService.getDoctorPerformance).toHaveBeenCalledOnce();
  }));

  it('should handle load doctor performance error', fakeAsync(() => {
    mockReportService.getDoctorPerformance = vi.fn().mockReturnValue(throwError(() => new Error('Performance failed')));
    const errorStore = TestBed.inject(ReportStore);
    errorStore.loadDoctorPerformance();
    tick();
    expect(errorStore.error()).toBe('Performance failed');
  }));

  it('should clear error', () => {
    store.clearError();
    expect(store.error()).toBeNull();
  });
});
