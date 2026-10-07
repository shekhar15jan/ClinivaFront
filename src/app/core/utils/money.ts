import { signal } from '@angular/core';

/**
 * Money on screen. Every amount from the API is in the clinic's home-currency minor units (the "InPaisa" fields:
 * paise, cents, fils...). The home currency comes with the clinic at sign-in; a bill shown in another currency
 * passes that currency explicitly.
 */
export const homeCurrency = signal('INR');

/** Decimals per currency (ISO 4217), as the server's Currencies list. */
const DIGITS: Record<string, number> = { OMR: 3, KWD: 3, BHD: 3, JPY: 0 };

export function minorDigits(code: string): number {
  return DIGITS[code] ?? 2;
}

/** "₹", "$", "€", "£", or the code ("AED") where there is no single sign. */
export function currencySymbol(code: string = homeCurrency()): string {
  const signs: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£', JPY: '¥' };
  return signs[code] ?? code;
}

export interface MoneyOptions {
  /** Always show the decimals ("₹500.00"); by default whole amounts drop them ("₹500"). */
  fixed?: boolean;
}

/** Minor units to text in a currency: "₹8,325", "$100.00", "AED 1,250.50", "OMR 4.619". */
export function formatMoney(minor: number | null | undefined, code: string = homeCurrency(), options: MoneyOptions = {}): string {
  const digits = minorDigits(code);
  const major = (minor ?? 0) / Math.pow(10, digits);
  const locale = code === 'INR' ? 'en-IN' : 'en-US';
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      currencyDisplay: currencySymbol(code) === code ? 'code' : 'narrowSymbol',
      minimumFractionDigits: options.fixed ? digits : 0,
      maximumFractionDigits: digits,
    }).format(major);
  } catch {
    // An unknown code still shows the amount.
    return `${code} ${major.toFixed(digits)}`;
  }
}

/** A typed amount (major units, e.g. 1250.5) to minor units, rounded to the currency's decimals. */
export function toMinor(major: number, code: string = homeCurrency()): number {
  return Math.round(major * Math.pow(10, minorDigits(code)));
}

/** Minor units to a number a form field can show (e.g. 125050 paise → 1250.5; 4619 baisa → 4.619). */
export function fromMinor(minor: number, code: string = homeCurrency()): number {
  return minor / Math.pow(10, minorDigits(code));
}
