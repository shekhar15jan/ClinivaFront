import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map, firstValueFrom, of, combineLatest } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';
import {
  AuthResponse,
  SendOtpRequest,
  VerifyOtpRequest,
  User,
} from '../models/auth.model';
import { ApiResponse } from '../models/common.model';
import { TenantContextService } from './tenant-context.service';
import { TenantResolution } from '../models/tenant.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private tenantContext = inject(TenantContextService);

  private readonly apiUrl = `${environment.apiUrl}`;
  /**
   * The access token lives only in memory (FR-AUTH-HMS-10): nothing a script could read is stored in the
   * browser. The refresh token is an HttpOnly cookie set by the API, which also restores the session after
   * a reload (silentRefresh) and is shared by every tab.
   */
  private accessToken: string | null = null;
  /** Legacy browser storage keys; cleared once so tokens saved by older versions do not linger. */
  private readonly LEGACY_KEYS = ['cliniva_access_token', 'cliniva_refresh_token'];
  private currentUserSubject = new BehaviorSubject<User | null>(null);

  public currentUser$ = this.currentUserSubject.asObservable();
  public currentUser = signal<User | null>(null);
  public pendingEmail: string | null = null;
  public pendingTenantCode: string | null = null;
  public loginStep = signal<'credentials' | 'otp'>('credentials');

  // Convert tenant signal to observable
  private tenant$ = toObservable(this.tenantContext.tenant);

  // authState$ combines user auth state for components that need to react to auth changes
  public authState$ = combineLatest([
    this.currentUser$,
    this.tenant$
  ]).pipe(
    map(([user, tenant]) => ({
      isAuthenticated: !!user && !!this.accessToken,
      user,
      tenant
    }))
  );

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  /** Whether the signed-in user has this permission (e.g. 'BILLING'). The API checks it too. */
  can(permission: string): boolean {
    return this.currentUserValue?.permissions?.includes(permission) ?? false;
  }

  private static userFrom(rawUser: Record<string, unknown> | undefined): User {
    const role = (rawUser?.['role'] as string) || '';
    return {
      id: (rawUser?.['id'] as string) || '',
      email: (rawUser?.['email'] as string) || '',
      role,
      roleName: (rawUser?.['roleName'] as string) || role,
      permissions: (rawUser?.['permissions'] as string[]) || [],
      profile: rawUser?.['profile'] as Record<string, string> | undefined,
    };
  }

  login(email: string, password: string): Observable<ApiResponse<{ requiresOtp: boolean; message: string }>> {
    return this.http.post<ApiResponse<{ requiresOtp: boolean; message: string }>>(`${this.apiUrl}/auth/login`, { email, password });
  }

  verifyPassword(email: string, password: string): Observable<ApiResponse<{ success: boolean; requiresOtp: boolean; message: string }>> {
    return this.http.post<ApiResponse<{ success: boolean; requiresOtp: boolean; message: string }>>(`${this.apiUrl}/auth/verify-password`, { email, password });
  }

  register(request: { email: string; password?: string; tenantCode: string; role: string }): Observable<ApiResponse<{ message: string }>> {
    return this.http.post<ApiResponse<{ message: string }>>(`${this.apiUrl}/auth/register`, request);
  }

  /** Replaces a temporary or expired password. Needs no session: the current password proves identity. */
  changePassword(email: string, currentPassword: string, newPassword: string, tenantCode?: string): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(`${this.apiUrl}/auth/change-password`, {
      email,
      currentPassword,
      newPassword,
      tenantCode: tenantCode || undefined,
    });
  }

  sendOtp(request: SendOtpRequest): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/auth/send-otp`, request);
  }

  verifyOtp(request: VerifyOtpRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http
      .post<ApiResponse<Record<string, unknown>>>(`${this.apiUrl}/auth/verify-otp`, request, { withCredentials: true })
      .pipe(
        map((response) => {
          if (!response.success || !response.data) return response as unknown as ApiResponse<AuthResponse>;
          const raw = response.data as Record<string, unknown>;
          const rawUser = raw['user'] as Record<string, unknown> | undefined;
          const rawTenant = raw['tenant'] as Record<string, unknown> | undefined;
          const authResponse: AuthResponse = {
            token: (raw['token'] as string) || (raw['accessToken'] as string) || '',
            refreshToken: (raw['refreshToken'] as string) || '',
            user: AuthService.userFrom(rawUser),
            tenant: {
              id: (rawTenant?.['id'] as string) || '',
              name: (rawTenant?.['name'] as string) || '',
              logoUrl: rawTenant?.['logoUrl'] as string | undefined,
              timezone: rawTenant?.['timezone'] as string | undefined,
              activeModules: (rawTenant?.['activeModules'] as string[]) || [],
            },
          };
          return { ...response, data: authResponse } as ApiResponse<AuthResponse>;
        }),
        tap((response) => {
          if (response.success && response.data) {
            this.setSession(response.data);
          }
        }),
      );
  }

  logout(): void {
    this.accessToken = null;
    this.currentUserSubject.next(null);
    this.currentUser.set(null);
    this.tenantContext.clear();
    this.loginStep.set('credentials');
    this.pendingEmail = null;
    this.pendingTenantCode = null;
    this.clearLegacyStorage();
    this.setHadSession(false);
    // The API revokes the refresh token from its cookie and clears the cookie.
    this.http
      .post(`${this.apiUrl}/auth/logout`, {}, { withCredentials: true })
      .pipe(catchError(() => of(null)))
      .subscribe();
  }

  public isLoggedIn(): boolean {
    return !!this.accessToken;
  }

  public getToken(): string | null {
    return this.accessToken;
  }

  setTenantResolution(resolution: TenantResolution): void {
    this.tenantContext.setTenantContext(
      resolution.tenant,
      resolution.modules,
      resolution.subscription,
    );
  }

  private normalizeResponse(raw: Record<string, unknown>): AuthResponse {
    const rawUser = raw['user'] as Record<string, unknown> | undefined;
    const rawTenant = raw['tenant'] as Record<string, unknown> | undefined;
    return {
      token: (raw['token'] as string) || (raw['accessToken'] as string) || '',
      refreshToken: (raw['refreshToken'] as string) || '',
      user: AuthService.userFrom(rawUser),
      tenant: {
        id: (rawTenant?.['id'] as string) || '',
        name: (rawTenant?.['name'] as string) || '',
        logoUrl: rawTenant?.['logoUrl'] as string | undefined,
        timezone: rawTenant?.['timezone'] as string | undefined,
        activeModules: (rawTenant?.['activeModules'] as string[]) || [],
      },
    };
  }

  /**
   * Restores the session after a page load from the HttpOnly refresh cookie. Only attempted when this
   * browser signed in before (a flag, not a token), so first-time visitors do not get a failing call.
   */
  async silentRefresh(): Promise<void> {
    this.clearLegacyStorage();
    if (!this.hadSession()) return;
    const response = await firstValueFrom(this.postRefresh().pipe(catchError(() => of(null))));
    if (response?.success && response.data) {
      this.setSession(this.normalizeResponse(response.data));
    } else {
      this.clearSession();
    }
  }

  refreshToken(): Observable<string> {
    return this.postRefresh().pipe(
      map((response) => {
        if (response.success && response.data) {
          const normalized = this.normalizeResponse(response.data);
          this.setSession(normalized);
          return normalized.token;
        }
        throw new Error('Refresh failed');
      }),
      catchError(() => {
        this.clearSession();
        throw new Error('Session expired');
      }),
    );
  }

  private postRefresh(): Observable<ApiResponse<Record<string, unknown>>> {
    // No token in the body: the API reads the HttpOnly cookie, which every tab shares.
    return this.http.post<ApiResponse<Record<string, unknown>>>(
      `${this.apiUrl}/auth/refresh`,
      {},
      { withCredentials: true },
    );
  }

  private setSession(authResponse: AuthResponse): void {
    this.accessToken = authResponse.token;
    this.currentUserSubject.next(authResponse.user);
    this.currentUser.set(authResponse.user);
    this.setHadSession(true);
  }

  private clearSession(): void {
    this.accessToken = null;
    this.currentUserSubject.next(null);
    this.currentUser.set(null);
    this.setHadSession(false);
  }

  private static readonly SESSION_FLAG = 'cliniva_signed_in';

  private hadSession(): boolean {
    try {
      return localStorage.getItem(AuthService.SESSION_FLAG) === '1';
    } catch {
      return true; // storage unavailable: just try the cookie
    }
  }

  private setHadSession(value: boolean): void {
    try {
      if (value) localStorage.setItem(AuthService.SESSION_FLAG, '1');
      else localStorage.removeItem(AuthService.SESSION_FLAG);
    } catch { /* storage unavailable */ }
  }

  private clearLegacyStorage(): void {
    try {
      this.LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));
    } catch { /* storage unavailable */ }
  }
}
