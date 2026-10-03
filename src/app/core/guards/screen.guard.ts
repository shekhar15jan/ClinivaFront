import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateChildFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { EffectiveLicenseService } from '../services/effective-license.service';
import { ToastService } from '../../shared/components/toast/toast.service';
import { STAFF_NAV, canSee } from '../../layout/nav-items';
import { homePathFor } from '../utils/route.util';

function hospitalCodeOf(route: ActivatedRouteSnapshot): string {
  for (let r: ActivatedRouteSnapshot | null = route; r; r = r.parent) {
    if (r.params['hospitalCode']) return r.params['hospitalCode'];
  }
  return '';
}

/**
 * Every screen inside a clinic: a screen is reachable by its address only if the menu would offer it, using the
 * same table (STAFF_NAV) and rule (permissions + the clinic's plan). Patients have their own portal and staff do not
 * use it. Without this, typing an address opened screens whose every call the API then refused.
 */
export const screenGuard: CanActivateChildFn = (child) => {
  const section = child.routeConfig?.path ?? '';
  // Only the top-level screen (e.g. "patients"); deeper routes (":id", "new") are covered by it.
  if (child.parent?.routeConfig?.path !== '' || !section) return true;

  const user = inject(AuthService).currentUserValue;
  const router = inject(Router);
  const code = hospitalCodeOf(child);
  if (!user) return router.createUrlTree(['/login']);

  if (section === 'patient' || user.role === 'PATIENT') {
    return section === 'patient' && user.role === 'PATIENT' ? true : router.parseUrl(homePathFor(user.role, code));
  }

  const item = STAFF_NAV.find((i) => i.route === section);
  if (!item) return true;
  const permissions = user.permissions ?? [];
  if (canSee(item, permissions, inject(EffectiveLicenseService).activeModules())) return true;

  const planHasIt = canSee({ ...item, perms: undefined }, permissions, inject(EffectiveLicenseService).activeModules());
  inject(ToastService).warning(
    planHasIt ? 'Your role does not have access to this screen.' : 'This module is not available in your current plan.',
  );
  return router.parseUrl(`/${code}/dashboard`);
};
