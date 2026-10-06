import { Injectable, NgZone, OnDestroy, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { TenantContextService } from './tenant-context.service';

/** Signed out after this long without a key, click, touch or scroll (HIPAA 164.312(a)(2)(iii), automatic logoff). */
export const IDLE_LIMIT_MS = 15 * 60 * 1000;
/** Warned this long before. */
export const IDLE_WARNING_MS = 60 * 1000;
const SHARED_KEY = 'cliniva.lastActivity';
const ACTIVITY = ['mousedown', 'keydown', 'touchstart', 'scroll', 'wheel'];

/**
 * Signs out a session left unattended, so a screen with patient records does not stay open on a shared desk.
 * Activity in any tab of the app counts (shared through local storage), so working in one tab does not sign out
 * another. A minute before, `secondsLeft` counts down for the warning banner.
 */
@Injectable({ providedIn: 'root' })
export class IdleSignOutService implements OnDestroy {
  private auth = inject(AuthService);
  private router = inject(Router);
  private tenant = inject(TenantContextService);
  private zone = inject(NgZone);

  /** Seconds until sign-out while the warning shows; null otherwise. */
  readonly secondsLeft = signal<number | null>(null);

  private lastActivity = Date.now();
  private timer?: ReturnType<typeof setInterval>;
  private readonly onActivity = () => this.touch();

  /** Starts watching; safe to call once from the app's root. */
  start(now: () => number = Date.now): void {
    if (this.timer || typeof document === 'undefined') return;
    this.now = now;
    this.lastActivity = now();
    for (const e of ACTIVITY) document.addEventListener(e, this.onActivity, { passive: true, capture: true });
    this.zone.runOutsideAngular(() => (this.timer = setInterval(() => this.zone.run(() => this.check()), 1000)));
  }

  private now: () => number = Date.now;

  /** The person is here: the clock starts again, in every tab. */
  touch(): void {
    this.lastActivity = this.now();
    this.secondsLeft.set(null);
    try {
      localStorage.setItem(SHARED_KEY, String(this.lastActivity));
    } catch {
      // Storage may be blocked; this tab still keeps its own clock.
    }
  }

  check(): void {
    if (!this.auth.isLoggedIn()) {
      this.secondsLeft.set(null);
      this.lastActivity = this.now();
      return;
    }
    let shared = 0;
    try {
      shared = Number(localStorage.getItem(SHARED_KEY)) || 0;
    } catch {
      shared = 0;
    }
    const idle = this.now() - Math.max(this.lastActivity, shared);
    if (idle >= IDLE_LIMIT_MS) {
      this.signOut();
    } else if (idle >= IDLE_LIMIT_MS - IDLE_WARNING_MS) {
      this.secondsLeft.set(Math.ceil((IDLE_LIMIT_MS - idle) / 1000));
    } else {
      this.secondsLeft.set(null);
    }
  }

  private signOut(): void {
    const code = this.tenant.tenantCode();
    this.secondsLeft.set(null);
    this.auth.logout();
    this.router.navigate(code ? [`/${code}/login`] : ['/login'], { queryParams: { reason: 'idle' } });
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
    if (typeof document !== 'undefined') {
      for (const e of ACTIVITY) document.removeEventListener(e, this.onActivity, { capture: true });
    }
  }
}
