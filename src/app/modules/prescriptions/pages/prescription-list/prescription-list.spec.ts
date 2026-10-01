import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { PrescriptionList } from './prescription-list';
import { PrescriptionService } from '../../../../core/services/prescription.service';
import { ToastService } from '../../../../shared/components/toast/toast.service';
import { Prescription } from '../../../../core/models/prescription.model';

describe('PrescriptionList', () => {
  const rx = (id: string, patient: string): Prescription => ({
    id, consultationId: 'c', patient: { id: 'p', fullName: patient }, doctor: { id: 'd', fullName: 'Dr. Real' },
    medicines: [], createdAt: '2026-09-29T10:00:00',
  } as unknown as Prescription);
  const page = (items: Prescription[], pageNumber = 0, totalElements = items.length, totalPages = 1) =>
    of({ success: true, message: '', timestamp: '', requestId: '',
      data: { content: items, pageNumber, pageSize: 20, totalElements, totalPages, last: pageNumber >= totalPages - 1 } });

  let service: { getPrescriptions: ReturnType<typeof vi.fn>; downloadPdf: ReturnType<typeof vi.fn> };
  const toast = { error: vi.fn() };

  function create(getPrescriptions = vi.fn().mockReturnValue(page([rx('r1', 'Asha Rao')], 0, 45, 3))): PrescriptionList {
    service = { getPrescriptions, downloadPdf: vi.fn() };
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: PrescriptionService, useValue: service }, { provide: ToastService, useValue: toast }],
    });
    return TestBed.runInInjectionContext(() => new PrescriptionList());
  }

  it('shows the clinic\'s prescriptions from the server (it showed two made-up ones)', () => {
    const component = create();
    expect(component.prescriptions).toEqual([]);
    component.ngOnInit();
    expect(service.getPrescriptions).toHaveBeenCalledWith(0, 20, '');
    expect(component.prescriptions.map((p) => p.patient.fullName)).toEqual(['Asha Rao']);
    expect(component.totalElements).toBe(45);
    expect(component.isLoading).toBe(false);
  });

  it('searches on the server once typing pauses, and pages within range', () => {
    vi.useFakeTimers();
    try {
      const component = create();
      component.ngOnInit();
      component.searchQuery = 'Rao';
      component.onSearchInput();
      vi.advanceTimersByTime(300);
      expect(service.getPrescriptions).toHaveBeenLastCalledWith(0, 20, 'Rao');
      component.goToPage(2);
      expect(service.getPrescriptions).toHaveBeenLastCalledWith(2, 20, 'Rao');
      service.getPrescriptions.mockClear();
      component.goToPage(-1);
      component.goToPage(3);
      expect(service.getPrescriptions).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('says why the list could not load', () => {
    const component = create(vi.fn().mockReturnValue(throwError(() => ({ error: { message: 'Module is not active: PRESCRIPTION' } }))));
    component.ngOnInit();
    expect(component.error).toBe('Module is not active: PRESCRIPTION');
    expect(component.isLoading).toBe(false);
  });

  it('downloads the PDF (the button did nothing), and explains a failure', () => {
    const component = create();
    service.downloadPdf.mockReturnValue(throwError(() => ({ error: { message: 'Prescription not found' } })));
    component.downloadPdf(rx('r1', 'Asha Rao'));
    expect(service.downloadPdf).toHaveBeenCalledWith('r1');
    expect(toast.error).toHaveBeenCalledWith('Prescription not found');
    expect(component.downloadingId).toBeNull();
  });
});
