import { Component, computed, inject, signal } from '@angular/core';
import { Sidebar } from '../sidebar/sidebar';
import { Header } from '../header/header';
import { BottomNav } from '../bottom-nav/bottom-nav';
import { MobileDrawer } from '../mobile-drawer/mobile-drawer';
import { FabComponent } from '../../shared/components/fab/fab.component';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';
import { SubscriptionBannerComponent } from '../../shared/components/subscription-banner/subscription-banner.component';
import { SubscriptionLockedComponent } from '../../shared/components/subscription-banner/subscription-locked.component';
import { SubscriptionStateService } from '../../core/services/subscription-state.service';

@Component({
  selector: 'app-shell',
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
  imports: [Sidebar, Header, BottomNav, MobileDrawer, FabComponent, RouterOutlet, SubscriptionBannerComponent, SubscriptionLockedComponent],
})
export class Shell {
  protected readonly drawerOpen = signal(false);
  private readonly subscription = inject(SubscriptionStateService);
  private readonly router = inject(Router);
  private readonly url = toSignal(
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd), map(() => this.router.url)),
    { initialValue: this.router.url },
  );
  /** A locked clinic sees the lock screen instead of its pages, except the plan screen where it renews. */
  protected readonly showLocked = computed(
    () => this.subscription.isLocked() && !this.url().split('?')[0].endsWith('/settings/plan'),
  );
  openDrawer(): void { this.drawerOpen.set(true); }
  closeDrawer(): void { this.drawerOpen.set(false); }
}
