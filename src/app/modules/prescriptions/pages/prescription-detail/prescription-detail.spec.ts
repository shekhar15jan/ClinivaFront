import { TestBed } from '@angular/core/testing';
import { PrescriptionDetail } from './prescription-detail';
import { ActivatedRoute } from '@angular/router';

describe('PrescriptionDetail', () => {
  it('should create with undefined prescription', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'rx-001' } }, params: {}, parent: { snapshot: { params: {} } } } },
      ],
    });
    const component = TestBed.runInInjectionContext(() => new PrescriptionDetail());
    expect(component).toBeTruthy();
    expect(component.prescription).toBeUndefined();
  });

  it('should load prescription from route param on init', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'rx-001' } }, params: {}, parent: { snapshot: { params: {} } } } },
      ],
    });
    const component = TestBed.runInInjectionContext(() => new PrescriptionDetail());
    component.ngOnInit();
    expect(component.prescription).toBeDefined();
    expect(component.prescription!.patientName).toBe('Rahul Sharma');
  });

  it('should load second prescription by id', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'rx-002' } }, params: {}, parent: { snapshot: { params: {} } } } },
      ],
    });
    const component = TestBed.runInInjectionContext(() => new PrescriptionDetail());
    component.ngOnInit();
    expect(component.prescription).toBeDefined();
    expect(component.prescription!.patientName).toBe('Priya Patel');
  });

  it('should return undefined for unknown id', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'unknown' } }, params: {}, parent: { snapshot: { params: {} } } } },
      ],
    });
    const component = TestBed.runInInjectionContext(() => new PrescriptionDetail());
    component.ngOnInit();
    expect(component.prescription).toBeUndefined();
  });
});
