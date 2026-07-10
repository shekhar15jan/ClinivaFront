import { TestBed } from '@angular/core/testing';
import { ReportsDashboard } from './reports-dashboard';

describe('ReportsDashboard', () => {
  it('should create with default metrics', () => {
    TestBed.configureTestingModule({});
    const component = TestBed.runInInjectionContext(() => new ReportsDashboard());
    expect(component).toBeTruthy();
    expect(component.revenue).toBe('1,85,400');
    expect(component.totalAppointments).toBe(347);
    expect(component.newPatients).toBe(89);
    expect(component.outstandingDues).toBe('28,500');
  });

  it('should have 7 monthly trend entries', () => {
    TestBed.configureTestingModule({});
    const component = TestBed.runInInjectionContext(() => new ReportsDashboard());
    expect(component.monthlyTrend.length).toBe(7);
  });

  it('should have 4 doctor performance entries', () => {
    TestBed.configureTestingModule({});
    const component = TestBed.runInInjectionContext(() => new ReportsDashboard());
    expect(component.doctorPerformance.length).toBe(4);
    expect(component.doctorPerformance[0].name).toBe('Dr. Anita Desai');
  });
});
