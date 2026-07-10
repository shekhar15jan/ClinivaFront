import { APP_INITIALIZER } from '@angular/core';
import { initializeAuth, AUTH_INITIALIZER_PROVIDER } from './auth-initializer';
import { AuthService } from './auth.service';
import { vi } from 'vitest';

describe('AuthInitializer', () => {
  describe('initializeAuth', () => {
    it('should call silentRefresh on auth service', async () => {
      const mockAuthService = { silentRefresh: vi.fn().mockResolvedValue(undefined) } as unknown as AuthService;
      const initializer = initializeAuth(mockAuthService);
      await initializer();
      expect(mockAuthService.silentRefresh).toHaveBeenCalledTimes(1);
    });

    it('should return a promise-like object', () => {
      const mockAuthService = { silentRefresh: vi.fn().mockResolvedValue(undefined) } as unknown as AuthService;
      const initializer = initializeAuth(mockAuthService);
      const result = initializer();
      expect(result).toBeDefined();
      expect(typeof result.then).toBe('function');
    });
  });

  describe('AUTH_INITIALIZER_PROVIDER', () => {
    it('should configure the APP_INITIALIZER provider', () => {
      expect(AUTH_INITIALIZER_PROVIDER.provide).toBe(APP_INITIALIZER);
      expect(AUTH_INITIALIZER_PROVIDER.multi).toBe(true);
      expect(typeof AUTH_INITIALIZER_PROVIDER.useFactory).toBe('function');
      expect(AUTH_INITIALIZER_PROVIDER.deps).toContain(AuthService);
    });
  });
});
