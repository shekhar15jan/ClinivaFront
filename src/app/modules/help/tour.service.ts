import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { EffectiveLicenseService } from '../../core/services/effective-license.service';
import { TourStep, tourStepsFor } from './help-content';

const KEY_PREFIX = 'cliniva.tour.done.';

/**
 * The first-run tour: a few steps on the main menu items for the signed-in role. Dismissing or finishing it is remembered
 * per person in local storage (so a shared device tours each new person once); the Help page can start it again.
 */
@Injectable({ providedIn: 'root' })
export class TourService {
  private auth = inject(AuthService);
  private license = inject(EffectiveLicenseService);
  private router = inject(Router);

  readonly steps = signal<TourStep[]>([]);
  readonly index = signal(0);
  readonly running = computed(() => this.steps().length > 0);
  readonly current = computed(() => this.steps()[this.index()] ?? null);
  readonly isLast = computed(() => this.index() >= this.steps().length - 1);

  private key(): string | null {
    const id = this.auth.currentUserValue?.id;
    return id ? KEY_PREFIX + id : null;
  }

  hasSeen(): boolean {
    const k = this.key();
    if (!k) return true;
    try {
      return localStorage.getItem(k) === '1';
    } catch {
      // Storage blocked: do not nag on every page load.
      return true;
    }
  }

  /** Starts the tour for a person who has not seen it. Called when the app shell opens. */
  startIfFirstRun(): void {
    if (!this.running() && !this.hasSeen()) this.start();
  }

  /** Starts (or restarts) the tour whether or not it was seen. */
  start(): void {
    const user = this.auth.currentUserValue;
    if (!user) return;
    this.steps.set(tourStepsFor(user.role, user.permissions ?? [], this.license.activeModules()));
    this.index.set(0);
  }

  next(): void {
    if (this.isLast()) this.finish();
    else this.index.update((i) => i + 1);
  }

  back(): void {
    this.index.update((i) => Math.max(0, i - 1));
  }

  /** Closes the tour and remembers it for this person. */
  finish(): void {
    this.steps.set([]);
    this.index.set(0);
    const k = this.key();
    if (!k) return;
    try {
      localStorage.setItem(k, '1');
    } catch {
      // Blocked storage: the tour just may show again next time.
    }
  }

  /** Takes the person to the screen the step is about, then goes on. */
  showMe(clinic: string): void {
    const route = this.current()?.route;
    if (route) void this.router.navigate(['/', clinic, ...route.split('/')]);
    this.next();
  }
}
