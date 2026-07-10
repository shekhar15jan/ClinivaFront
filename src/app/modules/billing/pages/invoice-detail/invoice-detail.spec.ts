import { TestBed } from '@angular/core/testing';
import { InvoiceDetail } from './invoice-detail';
import { vi } from 'vitest';

describe('InvoiceDetail', () => {
  it('should create with default state', () => {
    TestBed.configureTestingModule({});
    const component = TestBed.runInInjectionContext(() => new InvoiceDetail());
    expect(component).toBeTruthy();
    expect(component.invoiceNumber).toBe('INV-2023-001');
    expect(component.status).toBe('Pending');
    expect(component.taxRate).toBe(0.05);
    expect(component.lineItems.length).toBe(2);
  });

  it('should compute subtotal', () => {
    TestBed.configureTestingModule({});
    const component = TestBed.runInInjectionContext(() => new InvoiceDetail());
    expect(component.subtotal).toBe(850);
  });

  it('should compute tax', () => {
    TestBed.configureTestingModule({});
    const component = TestBed.runInInjectionContext(() => new InvoiceDetail());
    expect(component.tax).toBe(42.5);
  });

  it('should compute total', () => {
    TestBed.configureTestingModule({});
    const component = TestBed.runInInjectionContext(() => new InvoiceDetail());
    expect(component.total).toBe(892.5);
  });

  it('should collect payment and change status to Paid', () => {
    TestBed.configureTestingModule({});
    const component = TestBed.runInInjectionContext(() => new InvoiceDetail());
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    component.collectPayment();
    expect(component.status).toBe('Paid');
    expect(alertSpy).toHaveBeenCalledWith('Payment collected successfully!');
  });

  it('should not collect payment if already Paid', () => {
    TestBed.configureTestingModule({});
    const component = TestBed.runInInjectionContext(() => new InvoiceDetail());
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    component.collectPayment();
    expect(component.status).toBe('Paid');
    component.collectPayment();
    expect(component.status).toBe('Paid');
  });

  it('should not change status if confirm is cancelled', () => {
    TestBed.configureTestingModule({});
    const component = TestBed.runInInjectionContext(() => new InvoiceDetail());
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    component.collectPayment();
    expect(component.status).toBe('Pending');
  });
});
