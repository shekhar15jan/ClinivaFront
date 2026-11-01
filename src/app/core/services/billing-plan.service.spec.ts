import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BillingPlanService } from './billing-plan.service';
import { environment } from '../../../environments/environment';

describe('BillingPlanService', () => {
  let service: BillingPlanService;
  let http: HttpTestingController;
  const api = `${environment.apiUrl}/hms/billing-plan`;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule], providers: [BillingPlanService] });
    service = TestBed.inject(BillingPlanService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('reads the overview and unwraps the envelope', () => {
    let planCode = '';
    service.overview().subscribe((o) => (planCode = o.planCode ?? ''));
    const req = http.expectOne(api);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: { planCode: 'PRO', invoices: [] } });
    expect(planCode).toBe('PRO');
  });

  it('reads the published plans', () => {
    let n = 0;
    service.plans().subscribe((p) => (n = p.length));
    http.expectOne(`${api}/plans`).flush({ success: true, data: [{ code: 'A' }, { code: 'B' }] });
    expect(n).toBe(2);
  });

  it('reads one invoice', () => {
    let status = '';
    service.invoice('abc').subscribe((i) => (status = i.status));
    http.expectOne(`${api}/invoices/abc`).flush({ success: true, data: { status: 'PAID' } });
    expect(status).toBe('PAID');
  });

  it('starts a checkout with the plan code', () => {
    let url = '';
    service.checkout('PRO').subscribe((c) => (url = c.paymentLinkUrl));
    const req = http.expectOne(`${api}/checkout`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ planCode: 'PRO' });
    req.flush({ success: true, data: { paymentLinkUrl: 'https://rzp.test/x', invoice: {} } });
    expect(url).toBe('https://rzp.test/x');
  });
});
