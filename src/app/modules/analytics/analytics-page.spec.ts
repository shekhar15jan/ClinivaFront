import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { Analytics, AnalyticsService } from '../../core/services/analytics.service';
import { AnalyticsPageComponent } from './analytics-page';

const data: Analytics = {
  from: '2026-10-01', to: '2026-10-02', days: 2,
  beds: { beds: 10, occupiedNow: 4, occupancyPercent: 40, admissions: 3, discharges: 1, averageStayDays: 2.5, admissionsByType: { EMERGENCY: 2, PLANNED: 1 } },
  revenue: { billedInPaisa: 100000, bills: 2, bySource: [{ source: 'OPD', amountInPaisa: 25000, bills: 1 }, { source: 'LAB', amountInPaisa: 75000, bills: 1 }] },
  lab: null, radiology: null, theatre: null, insurance: null,
  daily: [
    { date: '2026-10-01', admissions: 1, discharges: 0, surgeries: 0, billedInPaisa: 25000 },
    { date: '2026-10-02', admissions: 2, discharges: 1, surgeries: 0, billedInPaisa: 75000 },
  ],
};

describe('AnalyticsPageComponent', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('loads the last 30 days, shares revenue by source and scales the days', () => {
    const api = { get: vi.fn().mockReturnValue(of(data)) };
    TestBed.configureTestingModule({ providers: [{ provide: AnalyticsService, useValue: api }] });
    const c = TestBed.runInInjectionContext(() => new AnalyticsPageComponent());
    c.ngOnInit();
    const [from, to] = api.get.mock.calls[0];
    expect((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000).toBe(29);
    expect(c.share(75000)).toBe(75);
    expect(c.dayHeight(data.daily[1])).toBe(100);
    expect(c.dayHeight(data.daily[0])).toBe(33);
    expect(c.entries({ CLAIM_SUBMITTED: 2 })).toBe('claim submitted 2');
    c.last(7);
    expect(c.chosen).toBe(7);
  });

  it('without finance access the trend shows admissions', () => {
    const api = { get: vi.fn().mockReturnValue(of({ ...data, revenue: null, daily: data.daily.map((d) => ({ ...d, billedInPaisa: null })) })) };
    TestBed.configureTestingModule({ providers: [{ provide: AnalyticsService, useValue: api }] });
    const c = TestBed.runInInjectionContext(() => new AnalyticsPageComponent());
    c.ngOnInit();
    expect(c.dayHeight(c.a!.daily[1])).toBe(100);
    expect(c.dayHeight(c.a!.daily[0])).toBe(50);
  });
});
