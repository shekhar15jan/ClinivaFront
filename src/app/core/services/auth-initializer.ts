import { APP_INITIALIZER } from '@angular/core';
import { AuthService } from './auth.service';

export function initializeAuth(authService: AuthService): () => Promise<void> {
  return async () => {
    await authService.silentRefresh();
  };
}

export const AUTH_INITIALIZER_PROVIDER = {
  provide: APP_INITIALIZER,
  useFactory: initializeAuth,
  deps: [AuthService],
  multi: true
};
