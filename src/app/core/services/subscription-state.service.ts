import { Injectable, computed, signal } from '@angular/core';
import { SubscriptionStateInfo } from '../models/auth.model';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Where the clinic stands after its trial or term: TRIAL (days left), READ_ONLY (records can be viewed, not changed,
 * until a date) or LOCKED. It comes from the sign-in answer (and every token renewal), so a renewal shows up at the
 * next renewal of the token; a refused write or read also flips it to LOCKED at once.
 */
@Injectable({ providedIn: 'root' })
export class SubscriptionStateService {
  private readonly info = signal<SubscriptionStateInfo | null>(null);

  readonly state = computed(() => this.info()?.state ?? 'NORMAL');
  readonly until = computed(() => this.info()?.until ?? null);
  readonly isTrial = computed(() => this.state() === 'TRIAL');
  readonly isReadOnly = computed(() => this.state() === 'READ_ONLY');
  readonly isLocked = computed(() => this.state() === 'LOCKED');

  /** Whole days from today to the last day of the state (0 on the last day); null when there is no end date. */
  readonly daysLeft = computed(() => {
    const until = this.until();
    if (!until) return null;
    const end = new Date(until + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.max(0, Math.round((end.getTime() - today.getTime()) / DAY_MS));
  });

  /** The day the clinic locks: the day after the last read-only day. */
  readonly lockDate = computed(() => {
    const until = this.until();
    if (!until || !this.isReadOnly()) return null;
    const date = new Date(until + 'T00:00:00');
    date.setDate(date.getDate() + 1);
    return date;
  });

  set(info: SubscriptionStateInfo | null): void {
    this.info.set(info);
  }

  markLocked(): void {
    this.info.set({ state: 'LOCKED', until: null });
  }

  clear(): void {
    this.info.set(null);
  }
}
