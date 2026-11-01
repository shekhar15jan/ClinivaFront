import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TourService } from './tour.service';

/** The tour card: bottom of the screen on a phone (above the bottom bar), bottom right on a desk. */
@Component({
  selector: 'app-tour',
  standalone: true,
  template: `
    @if (tour.current(); as step) {
      <div class="fixed z-50 inset-x-3 bottom-20 md:bottom-6 md:right-6 md:left-auto md:w-96" id="tour-card" role="dialog" aria-label="Quick tour">
        <div class="rounded-2xl shadow-2xl border border-blue-200 bg-white overflow-hidden">
          <div class="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <span class="material-symbols-outlined text-3xl bg-white/20 rounded-xl p-1.5">{{ step.icon }}</span>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-medium text-blue-100" id="tour-count">Step {{ tour.index() + 1 }} of {{ tour.steps().length }}</p>
              <p class="text-base font-semibold truncate" id="tour-title">{{ step.title }}</p>
            </div>
            <button type="button" id="tour-skip" (click)="tour.finish()" aria-label="Close the tour"
              class="min-h-touch min-w-touch flex items-center justify-center rounded-full hover:bg-white/20">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
          <p class="px-4 pt-3 text-sm text-slate-700" id="tour-text">{{ step.text }}</p>
          <div class="flex flex-wrap items-center gap-2 p-4">
            @if (tour.index() > 0) {
              <button type="button" id="tour-back" (click)="tour.back()"
                class="px-4 min-h-touch text-sm font-semibold text-slate-700 border border-slate-300 rounded-lg">Back</button>
            }
            @if (step.route) {
              <button type="button" id="tour-show" (click)="tour.showMe(clinic())"
                class="px-4 min-h-touch text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg">Show me</button>
            }
            <button type="button" id="tour-next" (click)="tour.next()"
              class="ml-auto px-5 min-h-touch text-sm font-semibold text-white bg-blue-600 rounded-lg">{{ tour.isLast() ? 'Done' : 'Next' }}</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class TourComponent implements OnInit {
  protected tour = inject(TourService);
  private router = inject(Router);

  ngOnInit(): void {
    this.tour.startIfFirstRun();
  }

  protected clinic(): string {
    return this.router.url.split('?')[0].split('/').filter(Boolean)[0] ?? '';
  }
}
