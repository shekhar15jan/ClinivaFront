import { TestBed } from '@angular/core/testing';
import { PrescriptionList } from './prescription-list';

describe('PrescriptionList', () => {
  it('should create with initial empty prescriptions', () => {
    TestBed.configureTestingModule({});
    const component = TestBed.runInInjectionContext(() => new PrescriptionList());
    expect(component).toBeTruthy();
    expect(component.prescriptions).toEqual([]);
  });

  it('should load mock prescriptions on init', () => {
    TestBed.configureTestingModule({});
    const component = TestBed.runInInjectionContext(() => new PrescriptionList());
    component.ngOnInit();
    expect(component.prescriptions.length).toBe(2);
    expect(component.prescriptions[0].patientName).toBe('Rahul Sharma');
    expect(component.prescriptions[1].patientName).toBe('Priya Patel');
    expect(component.prescriptions[0].medicines.length).toBe(1);
    expect(component.prescriptions[1].medicines.length).toBe(2);
  });
});
