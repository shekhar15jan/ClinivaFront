import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class TenantInterceptor implements HttpInterceptor {

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Note: In CodeAtCloud SDLC, tenant_id is extracted purely from the JWT claim on the backend.
    // However, if we need to send a tenant identifier for unauthenticated routes (e.g. login branding),
    // we could attach an X-Tenant-ID header. For now, it's a pass-through to follow backend rules.
    return next.handle(request);
  }
}
