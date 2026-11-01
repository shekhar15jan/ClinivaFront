import { Component, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { HELP_ARTICLES, HelpArticle, articlesFor } from './help-content';
import { TourService } from './tour.service';

/** Help: short articles for the signed-in role, and the button that starts the tour again. */
@Component({
  selector: 'app-help-page',
  standalone: true,
  template: `
    <div class="max-w-3xl mx-auto">
      <div class="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-5 sm:p-6 mb-4">
        <div class="flex items-center gap-3">
          <span class="material-symbols-outlined text-4xl bg-white/20 rounded-xl p-2">help</span>
          <div>
            <h1 class="text-2xl font-semibold">Help</h1>
            <p class="text-sm text-blue-100" id="help-for">Short guides for {{ roleLabel() }}</p>
          </div>
        </div>
        <button type="button" id="start-tour" (click)="tour.start()"
          class="mt-4 px-5 min-h-touch inline-flex items-center gap-2 text-sm font-semibold text-blue-700 bg-white rounded-lg">
          <span class="material-symbols-outlined">tour</span> Take the quick tour again
        </button>
      </div>

      <div class="flex gap-2 mb-4">
        <button type="button" id="show-mine" (click)="all.set(false)" class="px-4 min-h-touch text-sm font-semibold rounded-full border"
          [class]="!all() ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-300'">For my role</button>
        <button type="button" id="show-all" (click)="all.set(true)" class="px-4 min-h-touch text-sm font-semibold rounded-full border"
          [class]="all() ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-300'">Everything</button>
      </div>

      <div class="space-y-3" id="help-list">
        @for (a of shown(); track a.id) {
          <details class="group bg-white rounded-xl border border-blue-100 shadow-sm" [attr.data-article]="a.id">
            <summary class="flex items-center gap-3 p-4 min-h-touch cursor-pointer list-none">
              <span class="material-symbols-outlined text-2xl text-blue-600 bg-blue-50 rounded-lg p-1.5">{{ a.icon }}</span>
              <span class="flex-1">
                <span class="block text-base font-semibold text-slate-900">{{ a.title }}</span>
                <span class="block text-sm text-slate-600">{{ a.summary }}</span>
              </span>
              <span class="material-symbols-outlined text-slate-600 group-open:rotate-180 transition-transform">expand_more</span>
            </summary>
            <div class="px-4 pb-4">
              <ol class="list-decimal pl-5 space-y-1.5 text-sm text-slate-700">
                @for (s of a.steps; track $index) { <li>{{ s }}</li> }
              </ol>
              @if (a.tip) {
                <p class="mt-3 text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-2.5"><strong>Tip:</strong> {{ a.tip }}</p>
              }
            </div>
          </details>
        } @empty {
          <p class="text-sm text-slate-600">No guides yet for this role.</p>
        }
      </div>
    </div>
  `,
})
export class HelpPageComponent {
  private auth = inject(AuthService);
  protected tour = inject(TourService);
  protected all = signal(false);

  protected roleLabel = computed(() => {
    const u = this.auth.currentUser();
    return (u?.roleName || u?.role || 'your role').toString().replace(/_/g, ' ').toLowerCase();
  });

  protected shown = computed<HelpArticle[]>(() => (this.all() ? HELP_ARTICLES : articlesFor(this.auth.currentUser()?.role)));
}
