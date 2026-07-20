import { TestBed } from '@angular/core/testing';
import { ReportsDashboard } from './reports-dashboard';
import { ReportService } from '../../../../core/services/report.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { ApiResponse } from '../../../../core/models/common.model';
import { DashboardStats, AppointmentTrend, RevenueReport, DoctorPerformance, BillsStatusReport } from '../../../../core/models/report.model';

describe('ReportsDashboard', () => {
  const mockStats: ApiResponse<DashboardStats> = { success: true, data: { totalPatients: 100, todayAppointments: 15, pendingBills: 5, totalRevenueInPaisa: 2500000, activeDoctors: 4 }, message: 'ok', timestamp: '', requestId: 'r1' };
  const mockTrends: ApiResponse<AppointmentTrend[]> = { success: true, data: [{ month: 'JANUARY', count: 65 }, { month: 'FEBRUARY', count: 72 }], message: 'ok', timestamp: '', requestId: 'r1' };
  const mockRevenue: ApiResponse<RevenueReport> = { success: true, data: { totalBilledInPaisa: 5000000, totalCollectedInPaisa: 3000000, outstandingInPaisa: 2000000, monthlyBreakdown: [{ month: 'JANUARY', billed: 1000000, collected: 600000 }] }, message: 'ok', timestamp: '', requestId: 'r1' };
  const mockDoctors: ApiResponse<DoctorPerformance[]> = { success: true, data: [{ doctorId: 'd1', doctorName: 'Dr. Anita Desai', consultationCount: 145, revenueInPaisa: 7250000 }], message: 'ok', timestamp: '', requestId: 'r1' };
  const mockBills: ApiResponse<BillsStatusReport> = { success: true, data: { totalBills: 50, unpaidCount: 10, partiallyPaidCount: 5, paidCount: 30, voidedCount: 5, totalAmountInPaisa: 10000000, paidAmountInPaisa: 6000000, unpaidAmountInPaisa: 4000000, monthlyBreakdown: [] }, message: 'ok', timestamp: '', requestId: 'r1' };

  function createComponent() {
    TestBed.configureTestingModule({
      providers: [
        { provide: ReportService, useValue: { getDashboardStats: vi.fn().mockReturnValue(of(mockStats)), getAppointmentTrends: vi.fn().mockReturnValue(of(mockTrends)), getRevenueReport: vi.fn().mockReturnValue(of(mockRevenue)), getDoctorPerformance: vi.fn().mockReturnValue(of(mockDoctors)), getBillsStatus: vi.fn().mockReturnValue(of(mockBills)), exportReportPdf: vi.fn().mockReturnValue(of(new Blob())) } },
        { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn(), info: vi.fn() } },
      ],
    });
    return TestBed.runInInjectionContext(() => new ReportsDashboard());
  }

  it('should create', () => {
    const component = createComponent();
    expect(component).toBeTruthy();
  });

  it('should load store data on init', () => {
    const component = createComponent();
    component.ngOnInit();
    expect(component.store.dashboardStats()).toEqual(mockStats.data);
    expect(component.store.appointmentTrends().length).toBe(2);
    expect(component.store.revenueReport()?.totalBilledInPaisa).toBe(5000000);
    expect(component.store.doctorPerformance().length).toBe(1);
    expect(component.store.billsStatus()?.totalBills).toBe(50);
  });

  it('should compute max appointment count', () => {
    const component = createComponent();
    component.ngOnInit();
    expect(component.maxAppointmentCount()).toBe(72);
  });

  it('should compute max doctor revenue', () => {
    const component = createComponent();
    component.ngOnInit();
    expect(component.maxDoctorRevenue()).toBe(7250000);
  });

  it('should format paisa to rupees', () => {
    const component = createComponent();
    expect(component.formatPaisa(2500000)).toContain('25,000');
    expect(component.formatPaisa(0)).toBe('₹0');
    expect(component.formatPaisa(undefined)).toBe('₹0');
  });

  it('should compute donut dash values', () => {
    const component = createComponent();
    const dash = component.donutDash(30, 50);
    expect(dash).toBeTruthy();
  });
});
