import { Component, signal } from '@angular/core';
import { Sidebar } from '../sidebar/sidebar';
import { Header } from '../header/header';
import { BottomNav } from '../bottom-nav/bottom-nav';
import { MobileDrawer } from '../mobile-drawer/mobile-drawer';
import { FabComponent } from '../../shared/components/fab/fab.component';
import { RouterOutlet } from '@angular/router';
import { TourComponent } from '../../modules/help/tour.component';

@Component({
  selector: 'app-shell',
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
  imports: [Sidebar, Header, BottomNav, MobileDrawer, FabComponent, RouterOutlet, TourComponent],
})
export class Shell {
  protected readonly drawerOpen = signal(false);
  openDrawer(): void { this.drawerOpen.set(true); }
  closeDrawer(): void { this.drawerOpen.set(false); }
}
