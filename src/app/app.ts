import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/components/toast/toast.component';
import { LoadingSpinnerComponent } from './shared/components/loading-spinner/loading-spinner.component';
import { FabComponent } from './shared/components/fab/fab.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
  imports: [RouterOutlet, ToastComponent, LoadingSpinnerComponent, FabComponent],
})
export class App {
  protected readonly title = signal('ClinivaFront');
}
