import { Provider } from '@angular/core';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { MockBackendInterceptor } from './mock-backend.interceptor';

/** e2e build only (angular.json fileReplacements): answer API calls from the mock backend. */
export const MOCK_BACKEND_PROVIDERS: Provider[] = [{ provide: HTTP_INTERCEPTORS, useClass: MockBackendInterceptor, multi: true }];
