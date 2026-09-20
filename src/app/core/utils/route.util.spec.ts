import { ActivatedRoute } from '@angular/router';
import { homePathFor, hospitalCodeFrom } from './route.util';

const route = (params: (Record<string, string> | null)[]) =>
  ({ snapshot: { pathFromRoot: params.map((p) => ({ paramMap: { get: (k: string) => p?.[k] ?? null } })) } }) as unknown as ActivatedRoute;

describe('hospitalCodeFrom', () => {
  it('finds the clinic code however deep the current route is', () => {
    expect(hospitalCodeFrom(route([{}, { hospitalCode: 'sai-clinic' }, {}, { id: 'p1' }]))).toBe('sai-clinic');
  });

  it('returns an empty string outside a clinic (for example on the generic login)', () => {
    expect(hospitalCodeFrom(route([{}, { id: 'x' }]))).toBe('');
    expect(hospitalCodeFrom(route([]))).toBe('');
  });

  it('uses the nearest-to-root match when several routes carry a code', () => {
    expect(hospitalCodeFrom(route([{ hospitalCode: 'outer' }, { hospitalCode: 'inner' }]))).toBe('outer');
  });

  it('does not throw when there is no route tree at all', () => {
    expect(hospitalCodeFrom({ snapshot: {} } as unknown as ActivatedRoute)).toBe('');
    expect(hospitalCodeFrom({} as unknown as ActivatedRoute)).toBe('');
  });
});

describe('homePathFor', () => {
  it('starts a patient in their own portal', () => {
    expect(homePathFor('PATIENT', 'sai-clinic')).toBe('/sai-clinic/patient/dashboard');
  });

  it('starts every staff role on the clinic dashboard', () => {
    for (const role of ['ADMIN', 'DOCTOR', 'RECEPTIONIST', 'NURSE']) {
      expect(homePathFor(role, 'sai-clinic')).toBe('/sai-clinic/dashboard');
    }
  });

  it('falls back to the clinic dashboard when the role is unknown', () => {
    expect(homePathFor(undefined, 'sai-clinic')).toBe('/sai-clinic/dashboard');
  });
});
