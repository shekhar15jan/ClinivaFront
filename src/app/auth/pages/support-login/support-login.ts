import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Where CodeAtCloud support staff arrive from the platform: /support-login#token=... The token is read from the
 * address (a fragment, so it is never sent to a server or written to a log), removed from the address bar at once,
 * and exchanged once for a session in this clinic.
 */
@Component({
  selector: 'app-support-login',
  standalone: true,
  template: `
    <div class="min-h-screen flex items-center justify-center p-6 bg-surface">
      <div class="max-w-md text-center">
        <h1 class="text-xl font-semibold">Support sign-in</h1>
        @if (error()) {
          <p class="error mt-3 text-rose-700" role="alert">{{ error() }}</p>
          <p class="text-sm text-slate-600 mt-2">Ask the clinic to approve support access again, then open the link from CodeAtCloud.</p>
        } @else {
          <p class="mt-3 text-slate-600">Checking your support access...</p>
        }
      </div>
    </div>
  `,
})
export class SupportLoginComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);

  readonly error = signal('');

  ngOnInit(): void {
    const token = this.takeToken();
    if (!token) {
      this.error.set('This link has no support token.');
      return;
    }
    this.auth.supportLogin(token).subscribe({
      next: (d) => this.router.navigate(['/', d.tenantCode ?? '', 'dashboard']),
      error: (e) => this.error.set(e?.error?.message ?? 'Support access is not available.'),
    });
  }

  private takeToken(): string | null {
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    const token = new URLSearchParams(hash.replace(/^#/, '')).get('token');
    if (typeof window !== 'undefined' && hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }
    return token;
  }
}
