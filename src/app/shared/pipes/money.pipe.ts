import { Pipe, PipeTransform } from '@angular/core';
import { currencySymbol, formatMoney, toMinor } from '../../core/utils/money';

/**
 * {{ bill.totalAmountInPaisa | money }} → "₹8,325" in the clinic's currency; {{ x | money: 'fixed' }} keeps the
 * decimals; {{ x | money: 'USD' }} formats in another currency (a foreign bill). Impure so a clinic's currency
 * loaded after the page still applies.
 */
@Pipe({ name: 'money', standalone: true, pure: false })
export class MoneyPipe implements PipeTransform {
  transform(value: number | null | undefined, ...args: string[]): string {
    const fixed = args.includes('fixed');
    const code = args.find((a) => a && a !== 'fixed' && a !== 'major');
    // 'major': the value is already in whole units (e.g. 1250.5), not minor units.
    const minor = args.includes('major') ? toMinor(value ?? 0, code) : value;
    return formatMoney(minor, code, { fixed });
  }
}

/** {{ 'home' | currencySymbol }} → "₹" (or "$", "AED"...) for labels such as "Price (₹)". */
@Pipe({ name: 'currencySymbol', standalone: true, pure: false })
export class CurrencySymbolPipe implements PipeTransform {
  transform(code?: string | null): string {
    return currencySymbol(!code || code === 'home' ? undefined : code);
  }
}
