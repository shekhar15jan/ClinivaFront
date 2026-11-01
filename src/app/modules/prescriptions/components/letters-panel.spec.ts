import { TestBed } from '@angular/core/testing';
import { ChangeDetectorRef } from '@angular/core';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { LettersPanel } from './letters-panel';
import { LetterService } from '../../../core/services/letter.service';

describe('LettersPanel', () => {
  const letterService = { list: vi.fn(), issue: vi.fn(), pdf: vi.fn() };
  let panel: LettersPanel;

  beforeEach(() => {
    letterService.list.mockReset().mockReturnValue(of({ success: true, data: [] }));
    letterService.issue.mockReset().mockReturnValue(of({ success: true, data: { id: 'l1', type: 'MEDICAL_CERTIFICATE', number: 'MC-1', issuedAt: '2026-11-02T10:00:00' } }));
    letterService.pdf.mockReset().mockReturnValue(of(new Blob(['%PDF-'], { type: 'application/pdf' })));
    TestBed.configureTestingModule({
      providers: [
        { provide: LetterService, useValue: letterService },
        { provide: ChangeDetectorRef, useValue: { markForCheck: vi.fn() } },
      ],
    });
    panel = TestBed.runInInjectionContext(() => new LettersPanel());
    Object.defineProperty(panel, 'consultationId', { value: () => 'c1' });
    vi.restoreAllMocks();
    vi.spyOn(window, 'open').mockReturnValue(null);
    vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:x');
  });

  it('lists the letters already issued for the consultation', () => {
    letterService.list.mockReturnValue(of({ success: true, data: [{ id: 'l0', type: 'REFERRAL', number: 'RF-1', issuedAt: '2026-11-01T09:00:00' }] }));

    panel.ngOnInit();

    expect(letterService.list).toHaveBeenCalledWith('c1');
    expect(panel.letters.map((l) => l.number)).toEqual(['RF-1']);
  });

  it('sends only the boxes that belong to a medical certificate', () => {
    panel.type = 'MEDICAL_CERTIFICATE';
    panel.fromDate = '2026-11-02';
    panel.toDate = '2026-11-04';
    panel.referredTo = 'left over from before';
    panel.purpose = 'left over from before';
    panel.remarks = '  Avoid travel ';

    expect(panel.request()).toEqual({ type: 'MEDICAL_CERTIFICATE', fromDate: '2026-11-02', toDate: '2026-11-04', remarks: 'Avoid travel' });
  });

  it('sends only the boxes that belong to a fitness certificate', () => {
    panel.type = 'FITNESS_CERTIFICATE';
    panel.fromDate = '2026-11-05';
    panel.toDate = '2026-11-09';
    panel.purpose = ' school ';

    expect(panel.request()).toEqual({ type: 'FITNESS_CERTIFICATE', fromDate: '2026-11-05', purpose: 'school', remarks: undefined });
  });

  it('sends only the boxes that belong to a referral', () => {
    panel.type = 'REFERRAL';
    panel.referredTo = ' Dr. Mehta, Cardiology ';
    panel.purpose = 'an echocardiogram';
    panel.fromDate = '2026-11-02';

    expect(panel.request()).toEqual({ type: 'REFERRAL', referredTo: 'Dr. Mehta, Cardiology', purpose: 'an echocardiogram', remarks: undefined });
  });

  it('issues the letter, refreshes the list and opens the PDF', () => {
    panel.type = 'MEDICAL_CERTIFICATE';
    panel.fromDate = '2026-11-02';
    panel.toDate = '2026-11-03';

    panel.issue();

    expect(letterService.issue).toHaveBeenCalledWith('c1', expect.objectContaining({ type: 'MEDICAL_CERTIFICATE' }));
    expect(letterService.list).toHaveBeenCalled();
    expect(letterService.pdf).toHaveBeenCalledWith('l1');
    expect(window.open).toHaveBeenCalled();
    expect(panel.busy).toBe(false);
  });

  it('shows the server reason when a letter is refused', () => {
    letterService.issue.mockReturnValue(throwError(() => ({ error: { message: 'A medical certificate needs the first and the last day of rest.' } })));

    panel.issue();

    expect(panel.error).toBe('A medical certificate needs the first and the last day of rest.');
    expect(panel.busy).toBe(false);
    expect(window.open).not.toHaveBeenCalled();
  });

  it('does not issue twice while one is in progress', () => {
    panel.busy = true;

    panel.issue();

    expect(letterService.issue).not.toHaveBeenCalled();
  });

  it('says so when the PDF cannot be opened', () => {
    letterService.pdf.mockReturnValue(throwError(() => new Error('x')));

    panel.open({ id: 'l1', type: 'REFERRAL', number: 'RF-1', issuedAt: '2026-11-02T10:00:00' });

    expect(panel.error).toBe('The PDF could not be opened.');
  });
});
