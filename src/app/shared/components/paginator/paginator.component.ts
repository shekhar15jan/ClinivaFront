import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-paginator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-white">
      <div class="text-sm text-gray-600">
        Showing {{ startItem }} to {{ endItem }} of {{ totalElements }} entries
      </div>
      <div class="flex items-center gap-1">
        <button
          class="px-3 py-1.5 text-sm rounded border transition-colors"
          [ngClass]="currentPage === 0 ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
          [disabled]="currentPage === 0"
          (click)="goToPage(currentPage - 1)"
        >Previous</button>

        @for (page of visiblePages; track page) {
          <button
            class="px-3 py-1.5 text-sm rounded border transition-colors"
            [ngClass]="page === currentPage ? 'bg-[#003d9b] text-white border-[#003d9b]' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
            (click)="goToPage(page)"
          >{{ page + 1 }}</button>
        }

        <button
          class="px-3 py-1.5 text-sm rounded border transition-colors"
          [ngClass]="currentPage === totalPages - 1 ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
          [disabled]="currentPage === totalPages - 1"
          (click)="goToPage(currentPage + 1)"
        >Next</button>
      </div>
    </div>
  `
})
export class PaginatorComponent {
  @Input() totalElements = 0;
  @Input() pageSize = 20;
  @Input() currentPage = 0;
  @Input() pageSizeOptions = [10, 20, 50];
  @Output() pageChange = new EventEmitter<{ page: number; size: number }>();

  get totalPages(): number {
    return Math.ceil(this.totalElements / this.pageSize) || 1;
  }

  get startItem(): number {
    return this.currentPage * this.pageSize + 1;
  }

  get endItem(): number {
    return Math.min((this.currentPage + 1) * this.pageSize, this.totalElements);
  }

  get visiblePages(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(0, this.currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(this.totalPages, start + maxVisible);
    start = Math.max(0, end - maxVisible);
    for (let i = start; i < end; i++) {
      pages.push(i);
    }
    return pages;
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages && page !== this.currentPage) {
      this.pageChange.emit({ page, size: this.pageSize });
    }
  }
}
