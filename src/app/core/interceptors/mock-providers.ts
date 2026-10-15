import { Provider } from '@angular/core';

/**
 * The mock backend (fake patients, doctors, bills) is only for the e2e build, which swaps this file for
 * mock-providers.e2e.ts (angular.json). Every other build ships none of it: importing the interceptor here
 * put 55 KB of fake data into every production download.
 */
export const MOCK_BACKEND_PROVIDERS: Provider[] = [];
