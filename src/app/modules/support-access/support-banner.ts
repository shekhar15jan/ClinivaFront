import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SupportAccessService } from '../../core/services/support-access.service';
import { hospitalCodeFrom } from '../../core/utils/route.util';

/**
 * Two bars at the top of the app. For support staff: "Support session" with an End button. For the clinic owner: a
 * notice when CodeAtCloud support is waiting for approval, so the owner sees it without looking for it.
 */
@Component({
  selector: 'app-support-banner',
  standalone: true,
  imports: [DatePipe, RouterLink],
  template: `
    @if (auth.supportSession(); as s) {
      <div class="support-session bg-indigo-700 text-white px-4 py-2 flex flex-wrap items-center gap-3 text-sm" role="status">
        <span class="font-semibold">Support session</span>
        <span>{{ s.staffName }} · {{ roleLabel(s.role) }}@if (s.accessEndsAt) { · until {{ s.accessEndsAt | date: 'h:mm a' }} }</span>
        <button type="button" class="end-support ml-auto bg-white text-indigo-800 font-semibold px-4 min-h-touch rounded-lg" (click)="end()">End</button>
      </div>
    } @else if (waiting() > 0) {
      <div class="support-waiting bg-amber-100 text-amber-900 px-4 py-2 flex flex-wrap items-center gap-3 text-sm" role="alert">
        <span class="font-semibold">CodeAtCloud support is asking for access.</span>
        <a class="review font-semibold underline min-h-touch inline-flex items-center" [routerLink]="['/', code, 'support-access']">Review and approve</a>
      </div>
    }
  `,
})
export class SupportBannerComponent implements OnInit, OnDestroy {
  protected auth = inject(AuthService);
  private service = inject(SupportAccessService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private timer: ReturnType<typeof setInterval> | null = null;

  readonly waiting = signal(0);

  get code(): string { return hospitalCodeFrom(this.route); }

  ngOnInit(): void {
    this.check();
    this.timer = setInterval(() => this.check(), 30000);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  roleLabel(role: string): string {
    return role === 'SUPPORT_READONLY' ? 'read-only' : role === 'SUPPORT_ADMIN' ? 'admin' : 'agent';
  }

  /** Only a user who may manage users (the owner) can see requests; everyone else is not asked. */
  check(): void {
    if (this.auth.supportSession() || !this.auth.can('USER_MANAGE')) { this.waiting.set(0); return; }
    this.service.open().subscribe({
      next: (list) => this.waiting.set(list.filter((r) => r.status === 'REQUESTED').length),
      error: () => this.waiting.set(0),
    });
  }

  end(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
