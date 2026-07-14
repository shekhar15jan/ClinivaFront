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
  private accessToken: string | null = null;
  private refreshTokenValue: string | null = null;
  private readonly TOKEN_KEY = 'cliniva_access_token';
  private readonly REFRESH_KEY = 'cliniva_refresh_token';
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

  login(email: string, password: string): Observable<ApiResponse<{ requiresOtp: boolean; message: string }>> {
    return this.http.post<ApiResponse<{ requiresOtp: boolean; message: string }>>(`${this.apiUrl}/auth/login`, { email, password });
  }

  verifyPassword(email: string, password: string): Observable<ApiResponse<{ success: boolean; requiresOtp: boolean; message: string }>> {
    return this.http.post<ApiResponse<{ success: boolean; requiresOtp: boolean; message: string }>>(`${this.apiUrl}/auth/verify-password`, { email, password });
  }

  register(request: { email: string; password?: string; tenantCode: string; role: string }): Observable<ApiResponse<{ message: string }>> {
    return this.http.post<ApiResponse<{ message: string }>>(`${this.apiUrl}/auth/register`, request);
  }

  sendOtp(request: SendOtpRequest): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/auth/send-otp`, request);
  }

  verifyOtp(request: VerifyOtpRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http
      .post<ApiResponse<Record<string, unknown>>>(`${this.apiUrl}/auth/verify-otp`, request)
      .pipe(
        map((response) => {
          if (!response.success || !response.data) return response as unknown as ApiResponse<AuthResponse>;
          const raw = response.data as Record<string, unknown>;
          const rawUser = raw['user'] as Record<string, unknown> | undefined;
          const rawTenant = raw['tenant'] as Record<string, unknown> | undefined;
          const authResponse: AuthResponse = {
            token: (raw['token'] as string) || (raw['accessToken'] as string) || '',
            refreshToken: (raw['refreshToken'] as string) || '',
            user: {
              id: (rawUser?.['id'] as string) || '',
              email: (rawUser?.['email'] as string) || '',
              role: (rawUser?.['role'] as string) || '',
              profile: rawUser?.['profile'] as Record<string, string> | undefined,
            },
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
    const refreshToken = this.refreshTokenValue;
    this.accessToken = null;
    this.refreshTokenValue = null;
    this.currentUserSubject.next(null);
    this.currentUser.set(null);
    this.tenantContext.clear();
    this.loginStep.set('credentials');
    this.pendingEmail = null;
    this.pendingTenantCode = null;
    try {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_KEY);
    } catch { /* localStorage unavailable */ }
    this.http
      .post(`${this.apiUrl}/auth/logout`, { refreshToken })
      .pipe(catchError(() => of(null)))
      .subscribe();
  }

  public isLoggedIn(): boolean {
    return !!this.accessToken;
  }

  public getToken(): string | null {
    return this.accessToken;
  }

  public getRefreshToken(): string | null {
    return this.refreshTokenValue;
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
      user: {
        id: (rawUser?.['id'] as string) || '',
        email: (rawUser?.['email'] as string) || '',
        role: (rawUser?.['role'] as string) || '',
        profile: rawUser?.['profile'] as Record<string, string> | undefined,
      },
      tenant: {
        id: (rawTenant?.['id'] as string) || '',
        name: (rawTenant?.['name'] as string) || '',
        logoUrl: rawTenant?.['logoUrl'] as string | undefined,
        timezone: rawTenant?.['timezone'] as string | undefined,
        activeModules: (rawTenant?.['activeModules'] as string[]) || [],
      },
    };
  }

  async silentRefresh(): Promise<void> {
    try {
      const storedToken = localStorage.getItem(this.TOKEN_KEY);
      const storedRefresh = localStorage.getItem(this.REFRESH_KEY);
      if (storedToken && storedRefresh) {
        this.accessToken = storedToken;
        this.refreshTokenValue = storedRefresh;
      }
    } catch { /* localStorage unavailable */ }
    if (!this.accessToken || !this.refreshTokenValue) return;
    try {
      const response = await firstValueFrom(
        this.http
          .post<ApiResponse<Record<string, unknown>>>(
            `${this.apiUrl}/auth/refresh`,
            { refreshToken: this.refreshTokenValue },
          )
          .pipe(catchError(() => of(null))),
      );
      if (response?.success && response.data) {
        this.setSession(this.normalizeResponse(response.data));
      }
    } catch {
      this.accessToken = null;
      this.refreshTokenValue = null;
      this.currentUserSubject.next(null);
      this.currentUser.set(null);
      try {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.REFRESH_KEY);
      } catch { /* localStorage unavailable */ }
    }
  }

  refreshToken(): Observable<string> {
    return this.http
      .post<ApiResponse<Record<string, unknown>>>(
        `${this.apiUrl}/auth/refresh`,
        { refreshToken: this.refreshTokenValue },
      )
      .pipe(
        map((response) => {
          if (response.success && response.data) {
            const normalized = this.normalizeResponse(response.data);
            this.accessToken = normalized.token;
            this.refreshTokenValue = normalized.refreshToken;
            if (normalized.user) {
              this.currentUserSubject.next(normalized.user);
              this.currentUser.set(normalized.user);
            }
            try {
              localStorage.setItem(this.TOKEN_KEY, normalized.token);
              localStorage.setItem(this.REFRESH_KEY, normalized.refreshToken);
            } catch { /* localStorage unavailable */ }
            return normalized.token;
          }
          throw new Error('Refresh failed');
        }),
        catchError(() => {
          this.accessToken = null;
          this.refreshTokenValue = null;
          this.currentUserSubject.next(null);
          this.currentUser.set(null);
          try {
            localStorage.removeItem(this.TOKEN_KEY);
            localStorage.removeItem(this.REFRESH_KEY);
          } catch { /* localStorage unavailable */ }
          throw new Error('Session expired');
        }),
      );
  }

  private setSession(authResponse: AuthResponse): void {
    this.accessToken = authResponse.token;
    this.refreshTokenValue = authResponse.refreshToken;
    this.currentUserSubject.next(authResponse.user);
    this.currentUser.set(authResponse.user);
    try {
      localStorage.setItem(this.TOKEN_KEY, authResponse.token);
      localStorage.setItem(this.REFRESH_KEY, authResponse.refreshToken);
    } catch { /* localStorage unavailable */ }
  }
}
