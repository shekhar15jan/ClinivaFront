import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AuthService } from '../../core/services/auth.service';
import { DepartmentService } from '../../core/services/department.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { EmergencyAccessListComponent } from './emergency-access-list';

describe('EmergencyAccessListComponent', () => {
  const item = (id: string, userId: string, reviewed = false) => ({
    id, userId, userName: 'Dr Kapoor', patientId: 'p1', patientName: 'Asha', patientCode: 'P-1', reason: 'Chest pain in the ER',
    createdAt: '2026-11-01T10:00:00', expiresAt: '2026-11-01T18:00:00', reviewedAt: reviewed ? '2026-11-01T12:00:00' : null,
    reviewedByName: reviewed ? 'Admin' : null, reviewNote: null,
  });
  const svc = { getEmergencyAccess: vi.fn(), review: vi.fn() };
  const toast = { success: vi.fn(), error: vi.fn() };

  function create(items: unknown[]) {
    svc.getEmergencyAccess.mockReset().mockReturnValue(of({ content: items, totalElements: items.length }));
    svc.review.mockReset().mockReturnValue(of({}));
    toast.success.mockReset();
    toast.error.mockReset();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: DepartmentService, useValue: svc },
        { provide: AuthService, useValue: { currentUserValue: { id: 'me' } } },
        { provide: ToastService, useValue: toast },
      ],
    });
    const f = TestBed.createComponent(EmergencyAccessListComponent);
    f.detectChanges();
    return f;
  }

  it('loads what is waiting for review first and shows the reason', () => {
    const f = create([item('a', 'other')]);
    expect(svc.getEmergencyAccess).toHaveBeenCalledWith(true, 0, 20);
    expect(f.nativeElement.textContent).toContain('Chest pain in the ER');
  });

  it('tells you your own access is reviewed by someone else, with no Review button', () => {
    const f = create([item('a', 'me')]);
    expect(f.nativeElement.textContent).toContain('reviewed by someone else');
    expect(f.nativeElement.querySelector('button[aria-label^="Review access"]')).toBeNull();
  });

  it('reviews another persons access with a trimmed note and reloads', () => {
    const f = create([item('a', 'other')]);
    const c = f.componentInstance;
    c.startReview(c.items[0]);
    c.note = '  Confirmed with roster ';
    c.review(c.items[0]);
    expect(svc.review).toHaveBeenCalledWith('a', 'Confirmed with roster');
    expect(toast.success).toHaveBeenCalled();
    expect(svc.getEmergencyAccess).toHaveBeenCalledTimes(2);
    expect(c.reviewing).toBeNull();
  });

  it('shows the error when review fails or the list cannot load', () => {
    const f = create([item('a', 'other')]);
    const c = f.componentInstance;
    svc.review.mockReturnValue(throwError(() => ({ error: { message: 'Already reviewed' } })));
    c.review(c.items[0]);
    expect(toast.error).toHaveBeenCalledWith('Already reviewed');
    svc.getEmergencyAccess.mockReturnValue(throwError(() => ({})));
    c.load();
    expect(c.loadError).toBe('The list could not be loaded.');
  });

  it('switches to All and goes back to page 0', () => {
    const f = create([item('a', 'other', true)]);
    f.componentInstance.onPage({ page: 2, size: 20 });
    f.componentInstance.show(false);
    expect(svc.getEmergencyAccess).toHaveBeenLastCalledWith(false, 0, 20);
    expect(f.nativeElement.textContent).toContain('Reviewed by Admin');
  });
});
