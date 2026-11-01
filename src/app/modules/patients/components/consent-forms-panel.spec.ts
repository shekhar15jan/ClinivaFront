import { TestBed } from '@angular/core/testing';
import { ChangeDetectorRef } from '@angular/core';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { ConsentFormsPanel } from './consent-forms-panel';
import { ConsentFormService } from '../../../core/services/consent-form.service';
import { ConsentForm } from '../../../core/models/consent-form.model';

describe('ConsentFormsPanel', () => {
  const service = { list: vi.fn(), create: vi.fn(), sign: vi.fn(), refuse: vi.fn(), pdf: vi.fn() };
  let panel: ConsentFormsPanel;

  const draft: ConsentForm = { id: 'f1', type: 'PROCEDURE', number: 'CF-1', title: 'Consent for procedure', procedure: 'Appendectomy', status: 'DRAFT', createdAt: '2026-11-02T10:00:00' };

  beforeEach(() => {
    service.list.mockReset().mockReturnValue(of({ success: true, data: [draft] }));
    service.create.mockReset().mockReturnValue(of({ success: true, data: draft }));
    service.sign.mockReset().mockReturnValue(of({ success: true, data: { ...draft, status: 'SIGNED' } }));
    service.refuse.mockReset().mockReturnValue(of({ success: true, data: { ...draft, status: 'REFUSED' } }));
    service.pdf.mockReset().mockReturnValue(of(new Blob(['%PDF-'])));
    TestBed.configureTestingModule({
      providers: [
        { provide: ConsentFormService, useValue: service },
        { provide: ChangeDetectorRef, useValue: { markForCheck: vi.fn() } },
      ],
    });
    panel = TestBed.runInInjectionContext(() => new ConsentFormsPanel());
    Object.defineProperty(panel, 'patientId', { value: () => 'p1' });
    Object.defineProperty(panel, 'canEdit', { value: () => true });
    vi.restoreAllMocks();
    vi.spyOn(window, 'open').mockReturnValue(null);
    vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:x');
  });

  it('lists the patient\'s consent forms', () => {
    panel.ngOnInit();

    expect(service.list).toHaveBeenCalledWith('p1');
    expect(panel.forms.map((f) => f.number)).toEqual(['CF-1']);
  });

  it('writes up a procedure form with what was explained', () => {
    panel.type = 'PROCEDURE';
    panel.procedure = ' Appendectomy ';
    panel.risks = ' Bleeding, infection ';

    panel.create();

    expect(service.create).toHaveBeenCalledWith('p1', { type: 'PROCEDURE', procedure: 'Appendectomy', risksExplained: 'Bleeding, infection' });
    expect(panel.procedure).toBe('');
    expect(service.list).toHaveBeenCalled();
  });

  it('does not send a procedure or risks for an admission form', () => {
    panel.type = 'ADMISSION';
    panel.procedure = 'left over';
    panel.risks = 'left over';

    panel.create();

    expect(service.create).toHaveBeenCalledWith('p1', { type: 'ADMISSION', procedure: undefined, risksExplained: undefined });
  });

  it('shows the server reason when the form is refused', () => {
    service.create.mockReturnValue(throwError(() => ({ error: { message: 'Name the procedure the patient is asked to consent to.' } })));

    panel.create();

    expect(panel.error).toBe('Name the procedure the patient is asked to consent to.');
    expect(panel.busy).toBe(false);
  });

  it('records the patient signing for themselves, with no relation', () => {
    panel.signerName = ' Asha Patil ';
    panel.signerIsPatient = true;
    panel.signerRelation = 'left over';
    panel.method = 'IN_PERSON';

    panel.sign(draft);

    expect(service.sign).toHaveBeenCalledWith('f1', { signerName: 'Asha Patil', signerIsPatient: true, signerRelation: undefined, witnessName: undefined, method: 'IN_PERSON' });
    expect(panel.signing).toBe('');
    expect(panel.signerName).toBe('');
  });

  it('records a parent signing, with the relation and a witness', () => {
    panel.signerName = 'Sunita Patil';
    panel.signerIsPatient = false;
    panel.signerRelation = ' Mother ';
    panel.witnessName = ' Nurse Meera ';

    panel.sign(draft);

    expect(service.sign).toHaveBeenCalledWith('f1', { signerName: 'Sunita Patil', signerIsPatient: false, signerRelation: 'Mother', witnessName: 'Nurse Meera', method: 'PAPER' });
  });

  it('shows the server reason when the signature is refused', () => {
    service.sign.mockReturnValue(throwError(() => ({ error: { message: 'The person signing for the patient must say how they are related.' } })));

    panel.sign(draft);

    expect(panel.error).toBe('The person signing for the patient must say how they are related.');
  });

  it('records a refusal', () => {
    panel.refuse(draft);

    expect(service.refuse).toHaveBeenCalledWith('f1');
    expect(service.list).toHaveBeenCalled();
  });

  it('does nothing while another action is in progress', () => {
    panel.busy = true;

    panel.create();
    panel.sign(draft);
    panel.refuse(draft);

    expect(service.create).not.toHaveBeenCalled();
    expect(service.sign).not.toHaveBeenCalled();
    expect(service.refuse).not.toHaveBeenCalled();
  });

  it('opens the PDF, and says so when it cannot', () => {
    panel.open(draft);
    expect(window.open).toHaveBeenCalled();

    service.pdf.mockReturnValue(throwError(() => new Error('x')));
    panel.open(draft);
    expect(panel.error).toBe('The PDF could not be opened.');
  });
});
