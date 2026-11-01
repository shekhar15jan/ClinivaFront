import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { SubscriptionStateService } from '../../../core/services/subscription-state.service';

/**
 * Tells staff where the subscription stands: days left in the trial, or that the clinic is read-only (what that means,
 * the day it locks) with a Renew button. Shown across the top of every screen; nothing for a current subscription.
 */
@Component({
  selector: 'app-subscription-banner',
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    @if (subscription.isTrial()) {
      <div id="subscription-banner-trial" role="status"
        class="flex flex-wrap items-center justify-between gap-2 border-b border-sky-300 bg-sky-100 px-4 py-2 text-sm text-sky-950">
        <span>
          <strong>Free trial:</strong>
          @if (subscription.daysLeft() === null) { your trial is running. }
          @else if (subscription.daysLeft() === 0) { the last day of your trial is today. }
          @else if (subscription.daysLeft() === 1) { 1 day left. }
          @else { {{ subscription.daysLeft() }} days left. }
        </span>
        <a [routerLink]="renewLink()" class="min-h-touch inline-flex items-center rounded-lg bg-sky-700 px-4 font-semibold text-white">Choose a plan</a>
      </div>
    }
    @if (subscription.isReadOnly()) {
      <div id="subscription-banner-readonly" role="alert"
        class="flex flex-wrap items-center justify-between gap-2 border-b border-amber-400 bg-amber-100 px-4 py-2 text-sm text-amber-950">
        <span>
          <strong>Your subscription has ended: view only.</strong>
          You can still open patient records, but nothing can be added or changed.
          @if (subscription.lockDate(); as lock) { The clinic locks on {{ lock | date: 'd MMM y' }}. }
        </span>
        <a [routerLink]="renewLink()" id="subscription-renew" class="min-h-touch inline-flex items-center rounded-lg bg-amber-700 px-4 font-semibold text-white">Renew</a>
      </div>
    }
  `,
})
export class SubscriptionBannerComponent {
  protected readonly subscription = inject(SubscriptionStateService);
  private readonly router = inject(Router);

  /** The clinic plan and renewal screen: /<clinic>/settings/plan. */
  renewLink(): string[] {
    return planLink(this.router.url);
  }
}

export function planLink(url: string): string[] {
  const clinic = url.split('?')[0].split('/')[1];
  return clinic ? ['/', clinic, 'settings', 'plan'] : ['/'];
}
