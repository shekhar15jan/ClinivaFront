import { Injectable, inject } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class TenantInterceptor implements HttpInterceptor {

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const hospitalCode = this.extractHospitalCode();
    if (hospitalCode) {
      request = request.clone({
        setHeaders: {
          'X-Tenant-Code': hospitalCode,
        },
      });
    }
    return next.handle(request);
  }

  private extractHospitalCode(): string | null {
    const match = window.location.pathname.match(/^\/([^/]+)\//);
    if (match && match[1]) {
      const code = match[1];
      if (!['login', 'otp-login', 'forgot-password', 'reset-password', 'onboarding'].includes(code)) {
        return code;
      }
    }
    return null;
  }
}
