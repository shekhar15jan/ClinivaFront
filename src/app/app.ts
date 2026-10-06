import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/components/toast/toast.component';
import { LoadingSpinnerComponent } from './shared/components/loading-spinner/loading-spinner.component';
import { FabComponent } from './shared/components/fab/fab.component';
import { IdleSignOutService } from './core/services/idle-sign-out.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
  imports: [RouterOutlet, ToastComponent, LoadingSpinnerComponent, FabComponent],
})
export class App {
  protected readonly title = signal('ClinivaFront');
  /** An unattended session is signed out (automatic logoff); a minute before, a banner offers to stay. */
  protected readonly idle = inject(IdleSignOutService);

  constructor() {
    this.idle.start();
  }
}
