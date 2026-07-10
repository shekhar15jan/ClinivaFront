import { TestBed } from '@angular/core/testing';
import { DashboardOverview } from './dashboard-overview';

describe('DashboardOverview', () => {
  it('should create', () => {
    TestBed.configureTestingModule({});
    const component = TestBed.runInInjectionContext(() => new DashboardOverview());
    expect(component).toBeTruthy();
  });
});
