import { Component, inject } from '@angular/core';
import { OfflineQueue } from './offline-queue.service';

/** Shows when the device is offline or entries are waiting to be sent; refused entries can be retried or discarded. */
@Component({
  selector: 'app-offline-banner',
  template: `
    @if (!queue.online() || queue.entries().length > 0) {
      <div id="offline-banner" role="status" aria-live="polite"
        class="pointer-events-none fixed inset-x-3 top-16 sm:left-auto sm:right-4 sm:max-w-sm z-[90] rounded-xl border border-amber-300 bg-amber-100 px-4 py-3 text-sm text-amber-950 shadow-lg">
        @if (!queue.online()) {
          <p class="font-semibold">You are offline.</p>
          <p>Your changes are saved on this device and will be sent when the connection is back.</p>
        } @else if (queue.syncing()) {
          <p class="font-semibold">Sending saved entries…</p>
        }
        @if (queue.waiting() > 0) {
          <p id="offline-waiting" class="mt-1">{{ queue.waiting() }} waiting to send.</p>
        }
        @for (e of queue.failed(); track e.id) {
          <div class="mt-2 rounded-lg bg-white/70 p-2">
            <p class="font-medium">{{ e.label }} was not accepted</p>
            <p class="text-xs">{{ e.error }}</p>
            <div class="mt-1 flex gap-2">
              <button type="button" class="pointer-events-auto min-h-touch rounded-lg bg-amber-700 px-3 text-white" (click)="queue.retry(e.id)">Retry</button>
              <button type="button" class="pointer-events-auto min-h-touch rounded-lg border border-amber-700 px-3 text-amber-900" (click)="queue.discard(e.id)">Discard</button>
            </div>
          </div>
        }
      </div>
    }
  `,
})
export class OfflineBannerComponent {
  protected readonly queue = inject(OfflineQueue);

  constructor() {
    this.queue.start();
  }
}
