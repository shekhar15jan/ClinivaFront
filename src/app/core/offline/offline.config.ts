/**
 * Writes that may wait on this device while there is no network (PLAT-51). Only calls that are safe to send later:
 * each carries an Idempotency-Key, so the server does a repeated send once. Everything else (sign-in, payments, deletes)
 * is never queued and simply fails while offline.
 */
export const QUEUEABLE: RegExp[] = [
  /\/hms\/consultations$/,
  /\/hms\/nursing\/admissions\/[^\/]+\/vitals$/,
  /\/hms\/nursing\/admissions\/[^\/]+\/notes$/
];

/** What the "waiting to send" list calls an entry. */
export function offlineLabel(url: string): string {
  if (/\/vitals$/.test(url)) return 'Vitals reading';
  if (/\/notes$/.test(url)) return 'Nursing note';
  if (/\/consultations$/.test(url)) return 'Consultation note';
  return 'Saved entry';
}
