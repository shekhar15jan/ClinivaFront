import { Injectable, inject } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LayoutStore } from '../store/layout.store';

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  private layoutStore = inject(LayoutStore);

  private activeRequests = 0;

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (req.url.includes('/internal/license') || req.url.includes('/auth/')) {
      return next.handle(req);
    }

    this.activeRequests++;
    this.layoutStore.setLoading(true);

    return next.handle(req).pipe(
      finalize(() => {
        this.activeRequests--;
        if (this.activeRequests === 0) {
          this.layoutStore.setLoading(false);
        }
      }),
    );
  }
}
