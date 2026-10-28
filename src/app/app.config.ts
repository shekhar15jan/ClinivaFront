import { ApplicationConfig, isDevMode, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, APP_INITIALIZER } from '@angular/core';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideServiceWorker } from '@angular/service-worker';
import { provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';

import { routes } from './app-routes';
import { OfflineInterceptor } from './core/offline/offline.interceptor';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { GlobalErrorInterceptor } from './core/interceptors/global-error.interceptor';
import { LoadingInterceptor } from './core/interceptors/loading.interceptor';
import { TenantInterceptor } from './core/interceptors/tenant.interceptor';
import { MOCK_BACKEND_PROVIDERS } from './core/interceptors/mock-providers';
import { AuthService } from './core/services/auth.service';
import { initializeAuth } from './core/services/auth-initializer';

export const appConfig: ApplicationConfig = {
  providers: [
    // The pages keep their state in plain fields and rely on zone.js to notice when an HTTP response
    // changes them. Without zone.js (Angular's zoneless default) a page stayed on "Loading..." or
    // "Sending..." and raised ExpressionChanged errors; unit tests already run with zone.js.
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(withInterceptorsFromDi()),
    provideClientHydration(withEventReplay()),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAuth,
      deps: [AuthService],
      multi: true,
    },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: GlobalErrorInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: LoadingInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: TenantInterceptor, multi: true },
    // Innermost: keeps queueable writes on the device while offline (PLAT-51).
    { provide: HTTP_INTERCEPTORS, useClass: OfflineInterceptor, multi: true },
    provideServiceWorker('ngsw-worker.js', { enabled: !isDevMode(), registrationStrategy: 'registerWhenStable:30000' }),
    ...MOCK_BACKEND_PROVIDERS,
  ],
};
