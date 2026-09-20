import { ActivatedRoute } from '@angular/router';

/**
 * The clinic code from the URL (/:hospitalCode/...). Every screen lives under it, so a link that
 * leaves it out - "/patients" instead of "/sai-clinic/patients" - is read as a clinic called
 * "patients" and sends the user to the login page.
 */
export function hospitalCodeFrom(route: ActivatedRoute): string {
  for (const r of route.snapshot?.pathFromRoot ?? []) {
    const code = r.paramMap.get('hospitalCode');
    if (code) return code;
  }
  return '';
}

/** Where a signed-in user starts: a patient in their own portal, everyone else on the clinic dashboard. */
export function homePathFor(role: string | undefined, hospitalCode: string): string {
  return role === 'PATIENT' ? `/${hospitalCode}/patient/dashboard` : `/${hospitalCode}/dashboard`;
}
