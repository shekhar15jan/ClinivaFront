import { Injectable, inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ToastService } from '../../shared/components/toast/toast.service';
import { EffectiveLicenseService } from '../services/effective-license.service';

@Injectable()
export class GlobalErrorInterceptor implements HttpInterceptor {
  private toastService = inject(ToastService);
  private router = inject(Router);
  private licenseService = inject(EffectiveLicenseService);

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (req.url.includes('/auth/')) {
          return throwError(() => error);
        }

        switch (error.status) {
          case 401:
            break;
          case 403: {
            const errorMsg = error.error?.message || 'Access denied';
            if (errorMsg.toLowerCase().includes('module')) {
              this.toastService.show(
                'This module is not available in your current plan. Please upgrade.',
                'warning',
              );
              this.licenseService.loadLicense().subscribe();
              const hospitalCode = this.extractHospitalCode(req.url);
              if (hospitalCode) {
                this.router.navigate([`/${hospitalCode}/dashboard`]);
              }
            } else {
              this.toastService.show(errorMsg, 'error');
            }
            break;
          }
          case 404:
            break;
          case 409:
            this.toastService.show(
              error.error?.message || 'Conflict: duplicate entry detected.',
              'warning',
            );
            break;
          case 422:
            this.toastService.show(
              error.error?.message || 'Validation failed. Please check your input.',
              'error',
            );
            break;
          case 429:
            this.toastService.show('Too many requests. Please wait a moment.', 'warning');
            break;
          case 500:
          case 502:
          case 503:
            this.toastService.show('Server error. Please try again later.', 'error');
            break;
          case 0:
            this.toastService.show('Network error. Please check your connection.', 'error');
            break;
        }
        return throwError(() => error);
      }),
    );
  }

  private extractHospitalCode(url: string): string | null {
    const match = url.match(/\/api\/v1\//);
    if (match) {
      const pathParts = window.location.pathname.split('/');
      if (pathParts.length > 1) {
        return pathParts[1];
      }
    }
    return null;
  }
}
