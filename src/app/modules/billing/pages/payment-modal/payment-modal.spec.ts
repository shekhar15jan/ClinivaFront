import { TestBed } from '@angular/core/testing';
import { PaymentModal } from './payment-modal';

describe('PaymentModal', () => {
  it('should create', () => {
    TestBed.configureTestingModule({});
    const component = TestBed.runInInjectionContext(() => new PaymentModal());
    expect(component).toBeTruthy();
  });
});
