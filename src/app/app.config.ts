import { ApplicationConfig, provideBrowserGlobalErrorListeners, APP_INITIALIZER } from '@angular/core';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';

import { routes } from './app-routes';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { GlobalErrorInterceptor } from './core/interceptors/global-error.interceptor';
import { LoadingInterceptor } from './core/interceptors/loading.interceptor';
import { TenantInterceptor } from './core/interceptors/tenant.interceptor';
import { MockBackendInterceptor } from './core/interceptors/mock-backend.interceptor';
import { AuthService } from './core/services/auth.service';
import { initializeAuth } from './core/services/auth-initializer';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
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
    ...(environment.enableMock
      ? [{ provide: HTTP_INTERCEPTORS, useClass: MockBackendInterceptor, multi: true }]
      : []),
  ],
};
