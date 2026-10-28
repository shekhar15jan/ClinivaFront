import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

/** A write saved on this device while offline, waiting to be sent. `id` is also its Idempotency-Key. */
export interface QueuedWrite {
  id: string;
  method: 'POST' | 'PUT' | 'PATCH';
  url: string;
  body: unknown;
  label: string;
  savedAt: string;
  /** Set when the server refused it; it then waits for the person to retry or discard. */
  error?: string;
}

/** The header the interceptor adds to a replayed request so it is not queued a second time. */
export const REPLAY_HEADER = 'X-Offline-Replay';

const KEY = 'cac.offline.queue.v1';
const RETRY_MS = 60_000;

export function newOfflineId(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  } catch {
    // fall through
  }
  return `q${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}

/**
 * Writes made without a network are kept on this device and sent in order when the connection is back: on the browser's
 * "online" event, on app start and every minute. Refused entries (a 4xx) stay in the list for the person to retry or discard;
 * a lost connection or a server error leaves everything queued. The queue is cleared at sign-out.
 */
@Injectable({ providedIn: 'root' })
export class OfflineQueue {
  private readonly http = inject(HttpClient);

  readonly entries = signal<QueuedWrite[]>(this.read());
  readonly online = signal(typeof navigator === 'undefined' ? true : navigator.onLine);
  readonly syncing = signal(false);
  readonly waiting = computed(() => this.entries().filter((e) => !e.error).length);
  readonly failed = computed(() => this.entries().filter((e) => e.error));
  /** Counts completed syncs that sent something, so screens can reload their lists. */
  readonly synced = signal(0);

  private started = false;

  /** Called once by the banner: listens for the connection coming back. */
  start(): void {
    if (this.started || typeof window === 'undefined') return;
    this.started = true;
    window.addEventListener('online', () => {
      this.online.set(true);
      void this.flush();
    });
    window.addEventListener('offline', () => this.online.set(false));
    setInterval(() => void this.flush(), RETRY_MS);
    void this.flush();
  }

  enqueue(entry: Omit<QueuedWrite, 'savedAt'>): void {
    this.entries.update((all) => [...all, { ...entry, savedAt: new Date().toISOString() }]);
    this.save();
  }

  discard(id: string): void {
    this.entries.update((all) => all.filter((e) => e.id !== id));
    this.save();
  }

  retry(id: string): void {
    this.entries.update((all) => all.map((e) => (e.id === id ? { ...e, error: undefined } : e)));
    this.save();
    void this.flush();
  }

  clear(): void {
    this.entries.set([]);
    this.save();
  }

  /** Sends the waiting entries one at a time, oldest first, and stops at the first lost connection. */
  async flush(): Promise<void> {
    if (this.syncing() || (typeof navigator !== 'undefined' && !navigator.onLine)) return;
    this.syncing.set(true);
    let sentAny = false;
    try {
      for (const entry of this.entries().filter((e) => !e.error)) {
        try {
          await firstValueFrom(
            this.http.request(entry.method, entry.url, {
              body: entry.body,
              headers: { 'Idempotency-Key': entry.id, [REPLAY_HEADER]: '1' },
            }),
          );
          this.discard(entry.id);
          sentAny = true;
        } catch (error) {
          const status = error instanceof HttpErrorResponse ? error.status : 0;
          if (status === 0 || status >= 500 || status === 401 || status === 408 || status === 429) break;
          const message = error instanceof HttpErrorResponse ? (error.error?.message as string | undefined) : undefined;
          this.entries.update((all) =>
            all.map((e) => (e.id === entry.id ? { ...e, error: message ?? 'The server did not accept this entry.' } : e)),
          );
          this.save();
        }
      }
    } finally {
      this.syncing.set(false);
      if (sentAny) this.synced.update((n) => n + 1);
    }
  }

  private read(): QueuedWrite[] {
    try {
      const raw = typeof localStorage === 'undefined' ? null : localStorage.getItem(KEY);
      const parsed = raw ? (JSON.parse(raw) as unknown) : [];
      return Array.isArray(parsed) ? (parsed as QueuedWrite[]) : [];
    } catch {
      return [];
    }
  }

  private save(): void {
    try {
      if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, JSON.stringify(this.entries()));
    } catch {
      // Storage full or blocked: the entries stay in memory for this session.
    }
  }
}
