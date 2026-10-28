import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { Observable, catchError, of, throwError } from 'rxjs';
import { QUEUEABLE, offlineLabel } from './offline.config';
import { OfflineQueue, REPLAY_HEADER, newOfflineId } from './offline-queue.service';

/**
 * Adds an Idempotency-Key to the writes in QUEUEABLE and, when there is no network, keeps the write on this device and answers
 * 202 "queued" so the screen carries on. Replays from the queue pass straight through.
 */
@Injectable()
export class OfflineInterceptor implements HttpInterceptor {
  // The queue itself uses HttpClient, so it is looked up when needed, not injected here.
  constructor(private readonly injector: Injector) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const method = request.method;
    if (!(method === 'POST' || method === 'PUT' || method === 'PATCH') || !QUEUEABLE.some((p) => p.test(request.url.split('?')[0]))) {
      return next.handle(request);
    }
    if (request.headers.has(REPLAY_HEADER)) {
      return next.handle(request.clone({ headers: request.headers.delete(REPLAY_HEADER) }));
    }
    const id = newOfflineId();
    const keyed = request.clone({ setHeaders: { 'Idempotency-Key': id } });
    const queue = (): HttpResponse<unknown> => {
      this.injector.get(OfflineQueue).enqueue({
        id,
        method,
        url: request.url,
        body: request.body,
        label: offlineLabel(request.url),
      });
      return new HttpResponse({
        status: 202,
        body: { success: true, queued: true, message: 'Saved on this device. It will be sent when you are back online.', data: null },
      });
    };
    if (typeof navigator !== 'undefined' && !navigator.onLine) return of(queue());
    return next.handle(keyed).pipe(
      catchError((error: unknown) =>
        error instanceof HttpErrorResponse && error.status === 0 ? of(queue()) : throwError(() => error),
      ),
    );
  }
}
