import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { planLink } from './subscription-banner.component';

/** What a locked clinic sees instead of its screens: a plain explanation and the way back (renew). */
@Component({
  selector: 'app-subscription-locked',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div id="subscription-locked" class="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-2xl border border-rose-300 bg-rose-50 p-8 text-center text-rose-950">
      <h1 class="text-2xl font-bold">This clinic is locked</h1>
      <p>
        The subscription has ended and the read-only period is over, so records cannot be opened for now.
        Nothing has been deleted: renew the plan and everything comes back exactly as it was.
      </p>
      <a [routerLink]="renewLink()" id="subscription-locked-renew" class="min-h-touch inline-flex items-center rounded-lg bg-rose-700 px-6 font-semibold text-white">Renew the plan</a>
      <p class="text-sm text-slate-700">Need help? Contact your clinic administrator or CodeAtCloud support.</p>
    </div>
  `,
})
export class SubscriptionLockedComponent {
  private readonly router = inject(Router);
  protected renewLink(): string[] {
    return planLink(this.router.url);
  }
}
