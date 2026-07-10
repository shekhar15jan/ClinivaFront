import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
      [ngClass]="badgeClasses"
    >{{ displayLabel }}</span>
  `
})
export class StatusBadgeComponent {
  @Input() status = '';
  @Input() label = '';

  get displayLabel(): string {
    return this.label || this.status.replace(/_/g, ' ');
  }

  get badgeClasses(): Record<string, boolean> {
    const s = this.status.toUpperCase();
    return {
      'bg-green-100 text-green-800': ['ACTIVE', 'PAID', 'COMPLETED', 'APPROVED', 'CONFIRMED'].includes(s),
      'bg-amber-100 text-amber-800': ['PENDING', 'TRIAL', 'PARTIALLY_PAID', 'IN_PROGRESS', 'SCHEDULED'].includes(s),
      'bg-red-100 text-red-800': ['CANCELLED', 'REJECTED', 'UNPAID', 'EXPIRED', 'DISABLED', 'SUSPENDED', 'DECEASED'].includes(s),
      'bg-gray-100 text-gray-800': ['INACTIVE', 'DRAFT', 'VOIDED', 'ARCHIVED'].includes(s),
      'bg-blue-100 text-blue-800': ['PROCESSING', 'REFUNDED'].includes(s),
    };
  }
}
