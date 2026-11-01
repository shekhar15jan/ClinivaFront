import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map, firstValueFrom, of, combineLatest, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';
import {
  AuthResponse,
  SubscriptionStateInfo,
  SendOtpRequest,
  VerifyOtpRequest,
  User,
} from '../models/auth.model';
import { ApiResponse } from '../models/common.model';
import { TenantContextService } from './tenant-context.service';
import { EffectiveLicenseService } from './effective-license.service';
import { SubscriptionStateService } from './subscription-state.service';
import { TenantResolution } from '../models/tenant.model';
import { environment } from '../../../environments/environment';
import { homeCurrency } from '../utils/money';

/** A CodeAtCloud support staff member working in this clinic with the customer's approval. */
export interface SupportSession {
  sessionId: string;
  staffName: string;
  role: string;
  accessEndsAt: string | null;
}

/** What POST /auth/support-login and /auth/support-refresh answer. */
export interface SupportLoginData {
  accessToken: string;
  accessTokenExpiresAt: string;
  accessEndsAt: string | null;
  sessionId: string;
  tenantId: string;
  staffName: string;
  role: string;
  tenantCode: string | null;
  tenantName: string | null;
  permissions: string[];
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private tenantContext = inject(TenantContextService);
  private licenseService = inject(EffectiveLicenseService);
  private subscriptionState = inject(SubscriptionStateService);

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
  /** Set while the signed-in person is a support staff member; the banner shows it and End closes it. */
  public supportSession = signal<SupportSession | null>(null);
  private static readonly SUPPORT_KEY = 'cliniva_support_token';

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

  /** Step one of patient registration: emails a code to the address (nothing is created yet). */
  sendRegistrationCode(request: { email: string; tenantCode: string }): Observable<ApiResponse<{ message: string }>> {
    return this.http.post<ApiResponse<{ message: string }>>(`${this.apiUrl}/auth/register/send-code`, request);
  }

  /** Step two: the account is created only when `otp` is the code emailed in step one. */
  register(request: { email: string; password?: string; tenantCode: string; role: string; otp?: string; [key: string]: unknown }): Observable<ApiResponse<{ message: string }>> {
    return this.http.post<ApiResponse<{ message: string }>>(`${this.apiUrl}/auth/register`, request);
  }

  /** "Not registered? Ask for access": passed on to the platform by our server; the answer never says whether an account exists. */
  requestAccess(request: { contact: string; name?: string; consent: boolean; website?: string }): Observable<ApiResponse<{ received: boolean }>> {
    return this.http.post<ApiResponse<{ received: boolean }>>(`${this.apiUrl}/public/access-request`, request);
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
              currency: AuthService.useCurrency(rawTenant?.['currency']),
              subscription: AuthService.subscriptionFrom(rawTenant?.['subscription']),
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
    this.endSupportSession();
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
        currency: AuthService.useCurrency(rawTenant?.['currency']),
        subscription: AuthService.subscriptionFrom(rawTenant?.['subscription']),
      },
    };
  }

  private static subscriptionFrom(raw: unknown): SubscriptionStateInfo | null {
    const value = raw as { state?: string; until?: string | null } | null | undefined;
    const states = ['NORMAL', 'TRIAL', 'READ_ONLY', 'LOCKED'];
    if (!value?.state || !states.includes(value.state)) return null;
    return { state: value.state as SubscriptionStateInfo['state'], until: value.until ?? null };
  }

  /** The clinic's currency becomes the one all amounts are shown in. */
  private static useCurrency(code: unknown): string {
    const currency = typeof code === 'string' && /^[A-Z]{3}$/.test(code) ? code : 'INR';
    homeCurrency.set(currency);
    return currency;
  }

  /**
   * Restores the session after a page load from the HttpOnly refresh cookie. Only attempted when this
   * browser signed in before (a flag, not a token), so first-time visitors do not get a failing call.
   */
  async silentRefresh(): Promise<void> {
    this.clearLegacyStorage();
    const saved = this.savedSupportToken();
    if (saved) {
      // A reload inside a support session: the platform is asked again before the session continues.
      const ok = await firstValueFrom(this.supportRefreshWith(saved).pipe(map(() => true), catchError(() => of(false))));
      if (!ok) this.clearSession();
      return;
    }
    if (!this.hadSession()) return;
    const response = await firstValueFrom(this.postRefresh().pipe(catchError(() => of(null))));
    if (response?.success && response.data) {
      this.setSession(this.normalizeResponse(response.data));
    } else {
      this.clearSession();
    }
  }

  refreshToken(): Observable<string> {
    if (this.supportSession()) return this.refreshSupport();
    return this.postRefresh().pipe(
      map((response) => {
        if (response.success && response.data) {
          const normalized = this.normalizeResponse(response.data);
          this.setSession(normalized, false);
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

  /** Exchanges the platform's single-use support token for a clinic session. */
  supportLogin(platformToken: string): Observable<SupportLoginData> {
    return this.http
      .post<ApiResponse<SupportLoginData>>(`${this.apiUrl}/auth/support-login`, { token: platformToken })
      .pipe(map((r) => this.startSupport(r.data)));
  }

  private refreshSupport(): Observable<string> {
    const token = this.accessToken ?? this.savedSupportToken();
    if (!token) return throwError(() => new Error('No support session'));
    return this.supportRefreshWith(token).pipe(map((d) => d.accessToken));
  }

  private supportRefreshWith(token: string): Observable<SupportLoginData> {
    return this.http
      .post<ApiResponse<SupportLoginData>>(`${this.apiUrl}/auth/support-refresh`, {}, { headers: { Authorization: `Bearer ${token}` } })
      .pipe(map((r) => this.startSupport(r.data, false)));
  }

  private startSupport(data: SupportLoginData, newSession = true): SupportLoginData {
    const user: User = {
      id: data.sessionId,
      email: data.staffName,
      role: data.role,
      roleName: data.role === 'SUPPORT_READONLY' ? 'Support (read-only)' : data.role === 'SUPPORT_ADMIN' ? 'Support admin' : 'Support agent',
      permissions: data.permissions,
      tenantId: data.tenantId,
      tenantCode: data.tenantCode ?? undefined,
    };
    this.accessToken = data.accessToken;
    this.currentUserSubject.next(user);
    this.currentUser.set(user);
    this.supportSession.set({ sessionId: data.sessionId, staffName: data.staffName, role: data.role, accessEndsAt: data.accessEndsAt });
    try { sessionStorage.setItem(AuthService.SUPPORT_KEY, data.accessToken); } catch { /* storage unavailable */ }
    if (newSession) {
      this.licenseService.loadLicense().pipe(catchError(() => of(null))).subscribe();
    }
    return data;
  }

  private savedSupportToken(): string | null {
    try { return sessionStorage.getItem(AuthService.SUPPORT_KEY); } catch { return null; }
  }

  /** Tells the clinic (and through it the platform) the support session is over; the token stops working at once. */
  private endSupportSession(): void {
    if (!this.supportSession()) return;
    const token = this.accessToken;
    if (token) {
      this.http
        .post(`${this.apiUrl}/hms/support-access/session/end`, {}, { headers: { Authorization: `Bearer ${token}` } })
        .pipe(catchError(() => of(null)))
        .subscribe();
    }
    this.supportSession.set(null);
    try { sessionStorage.removeItem(AuthService.SUPPORT_KEY); } catch { /* storage unavailable */ }
  }

  private setSession(authResponse: AuthResponse, newSession = true): void {
    this.accessToken = authResponse.token;
    this.currentUserSubject.next(authResponse.user);
    this.currentUser.set(authResponse.user);
    this.setHadSession(true);
    this.subscriptionState.set(authResponse.tenant?.subscription ?? null);
    if (newSession) {
      // The screens decide what to show from the clinic's modules. The public lookup before sign-in no longer carries them,
      // so they come from the sign-in answer at once, and the full licence (limits, usage) is loaded in the background.
      // Nothing waits for it, and a failure to load it never fails the sign-in. The routine token renewal skips this.
      // It starts only after the token is stored: the request has to carry it.
      this.licenseService.seedModules(authResponse.tenant?.activeModules);
      this.licenseService.loadLicense().pipe(catchError(() => of(null))).subscribe();
    }
  }

  private clearSession(): void {
    this.supportSession.set(null);
    try { sessionStorage.removeItem(AuthService.SUPPORT_KEY); } catch { /* storage unavailable */ }
    this.accessToken = null;
    this.currentUserSubject.next(null);
    this.currentUser.set(null);
    this.subscriptionState.clear();
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
