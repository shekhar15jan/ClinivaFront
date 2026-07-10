import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ResourceConstraint } from '../../../core/models/effective-license.model';

@Component({
  selector: 'app-resource-usage-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (constraint) {
      <div class="flex flex-col gap-1">
        <div class="flex justify-between text-xs">
          <span class="font-medium text-gray-700">{{ constraint.resourceName }}</span>
          <span class="text-gray-500">
            @if (constraint.isUnlimited || constraint.limit === 0) {
              {{ constraint.currentUsage }} / Unlimited
            } @else {
              {{ constraint.currentUsage }} / {{ constraint.limit }}
            }
          </span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div
            class="h-2 rounded-full transition-all duration-300"
            [ngClass]="barColor"
            [style.width.%]="percentage"
          ></div>
        </div>
      </div>
    }
  `
})
export class ResourceUsageBarComponent {
  @Input() constraint: ResourceConstraint | null = null;

  get percentage(): number {
    if (!this.constraint) return 0;
    if (this.constraint.isUnlimited || this.constraint.limit === 0) return 0;
    return Math.min(100, (this.constraint.currentUsage / this.constraint.limit) * 100);
  }

  get barColor(): string {
    if (this.percentage >= 80) return 'bg-red-500';
    if (this.percentage >= 60) return 'bg-amber-500';
    return 'bg-green-500';
  }
}
