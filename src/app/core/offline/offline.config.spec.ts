import { QUEUEABLE, offlineLabel } from './offline.config';

const queueable = (url: string) => QUEUEABLE.some((p) => p.test(url.split('?')[0]));

describe('what may wait offline (CLIN-23)', () => {
  const base = 'http://x.test/api/v1/hms';

  it('queues consultation notes, vitals readings and nursing notes', () => {
    expect(queueable(`${base}/consultations`)).toBe(true);
    expect(queueable(`${base}/nursing/admissions/a1/vitals`)).toBe(true);
    expect(queueable(`${base}/nursing/admissions/a1/notes`)).toBe(true);
  });

  it('never queues medication doses, orders, payments or sign-in: those are confirmed live', () => {
    expect(queueable(`${base}/nursing/orders/o1/doses`)).toBe(false);
    expect(queueable(`${base}/nursing/admissions/a1/orders`)).toBe(false);
    expect(queueable(`${base}/payments`)).toBe(false);
    expect(queueable('http://x.test/api/v1/auth/login')).toBe(false);
  });

  it('names each kind of waiting entry for the person', () => {
    expect(offlineLabel(`${base}/consultations`)).toBe('Consultation note');
    expect(offlineLabel(`${base}/nursing/admissions/a1/vitals`)).toBe('Vitals reading');
    expect(offlineLabel(`${base}/nursing/admissions/a1/notes`)).toBe('Nursing note');
    expect(offlineLabel(`${base}/other`)).toBe('Saved entry');
  });
});
