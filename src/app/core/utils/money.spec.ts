import { afterEach, describe, expect, it } from 'vitest';
import { CurrencySymbolPipe, MoneyPipe } from '../../shared/pipes/money.pipe';
import { currencySymbol, formatMoney, fromMinor, homeCurrency, minorDigits, toMinor } from './money';

describe('money', () => {
  afterEach(() => homeCurrency.set('INR'));

  it('shows amounts in the clinic currency, Indian grouping for rupees', () => {
    expect(formatMoney(12345600)).toBe('₹1,23,456');
    expect(formatMoney(150050, 'INR', { fixed: true })).toBe('₹1,500.50');
    homeCurrency.set('AED');
    expect(formatMoney(150050).replace(/\s/g, ' ')).toBe('AED 1,500.5');
    expect(currencySymbol()).toBe('AED');
  });

  it('knows each currency’s decimals both ways', () => {
    expect(minorDigits('OMR')).toBe(3);
    expect(minorDigits('JPY')).toBe(0);
    expect(toMinor(4.619, 'OMR')).toBe(4619);
    expect(fromMinor(4619, 'OMR')).toBe(4.619);
    expect(toMinor(1786, 'JPY')).toBe(1786);
    expect(toMinor(1250.505, 'INR')).toBe(125051);
    expect(formatMoney(4619, 'OMR', { fixed: true }).replace(/\s/g, ' ')).toBe('OMR 4.619');
    expect(formatMoney(10000, 'USD', { fixed: true })).toBe('$100.00');
  });

  it('the money pipe takes minor units, another currency, or whole units', () => {
    const pipe = new MoneyPipe();
    expect(pipe.transform(832500)).toBe('₹8,325');
    expect(pipe.transform(10000, 'USD', 'fixed')).toBe('$100.00');
    expect(pipe.transform(8325, 'major', 'fixed')).toBe('₹8,325.00');
    expect(pipe.transform(null)).toBe('₹0');
    expect(new CurrencySymbolPipe().transform('home')).toBe('₹');
    expect(new CurrencySymbolPipe().transform('EUR')).toBe('€');
  });
});
