import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-[#F4F7FA]">
      <div class="text-center px-6">
        <h1 class="text-8xl font-bold text-[#0052CC] mb-4">404</h1>
        <h2 class="text-2xl font-semibold text-[#1E293B] mb-2">Page Not Found</h2>
        <p class="text-[#64748B] mb-8 max-w-md mx-auto">The page you're looking for doesn't exist or has been moved.</p>
        <a routerLink="/login" class="inline-flex items-center gap-2 px-6 py-3 bg-[#0052CC] text-white rounded-lg hover:bg-[#0040A0] transition-colors">
          <span class="material-symbols-outlined text-lg">arrow_back</span>
          Go to Login
        </a>
      </div>
    </div>
  `
})
export class NotFoundComponent {}
