import { TestBed } from '@angular/core/testing';
import { BillList } from './bill-list';

describe('BillList', () => {
  it('should create with initial empty bills', () => {
    TestBed.configureTestingModule({});
    const component = TestBed.runInInjectionContext(() => new BillList());
    expect(component).toBeTruthy();
    expect(component.bills).toEqual([]);
  });

  it('should load mock bills on init', () => {
    TestBed.configureTestingModule({});
    const component = TestBed.runInInjectionContext(() => new BillList());
    component.ngOnInit();
    expect(component.bills.length).toBe(2);
    expect(component.bills[0].patientName).toBe('Rahul Sharma');
    expect(component.bills[1].patientName).toBe('Priya Patel');
  });

  it('should return correct status CSS class', () => {
    TestBed.configureTestingModule({});
    const component = TestBed.runInInjectionContext(() => new BillList());
    expect(component.statusClass('PAID')).toContain('text-[#059669]');
    expect(component.statusClass('UNPAID')).toContain('text-[#DC2626]');
    expect(component.statusClass('PARTIALLY_PAID')).toContain('text-[#CA8A04]');
    expect(component.statusClass('UNKNOWN')).toContain('text-[#64748B]');
  });
});
