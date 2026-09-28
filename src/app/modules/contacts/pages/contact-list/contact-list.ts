import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContactService } from '../../../../core/services/contact.service';
import { ContactMessageResponse } from '../../../../core/models/contact.model';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { DatePipe } from '@angular/common';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-contact-list',
  templateUrl: './contact-list.html',
  styleUrl: './contact-list.scss',
  standalone: true,
  imports: [StatusBadgeComponent, EmptyStateComponent, DatePipe, FormsModule],
})
export class ContactList implements OnInit, OnDestroy {
  private contactService = inject(ContactService);

  /** The page on screen; filtering, search and paging are done by the server. */
  messages: ContactMessageResponse[] = [];
  page = 0;
  totalPages = 1;
  totalElements = 0;
  /** Messages in each status across the whole inbox, not only this page. */
  counts: Record<string, number> = {};
  isLoading = false;
  error = '';
  statusFilter = '';
  searchQuery = '';
  selectedMessage: ContactMessageResponse | null = null;
  replyText = '';
  isReplying = false;
  private searchTimer?: ReturnType<typeof setTimeout>;

  get newCount(): number {
    return this.counts['NEW'] ?? 0;
  }

  get resolvedCount(): number {
    return this.counts['RESOLVED'] ?? 0;
  }

  get totalCount(): number {
    return Object.values(this.counts).reduce((a, b) => a + b, 0);
  }

  get hasFilters(): boolean {
    return !!this.statusFilter || !!this.searchQuery.trim();
  }

  ngOnInit(): void {
    this.loadMessages();
  }

  ngOnDestroy(): void {
    clearTimeout(this.searchTimer);
  }

  loadMessages(page = this.page): void {
    this.isLoading = true;
    this.error = '';
    this.contactService.list({ page, size: PAGE_SIZE, status: this.statusFilter, q: this.searchQuery }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.messages = res.data.content;
          this.page = res.data.pageNumber;
          this.totalPages = Math.max(1, res.data.totalPages);
          this.totalElements = res.data.totalElements;
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || err?.message || 'Failed to load contact messages';
        this.isLoading = false;
      },
    });
    this.contactService.counts().subscribe({
      next: (res) => { if (res.success && res.data) this.counts = res.data; },
      error: () => undefined,
    });
  }

  /** A new filter starts again from the first page. */
  applyFilters(): void {
    clearTimeout(this.searchTimer);
    this.loadMessages(0);
  }

  /** Searches once typing pauses rather than on every key. */
  onSearchInput(): void {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.loadMessages(0), 300);
  }

  clearFilters(): void {
    this.statusFilter = '';
    this.searchQuery = '';
    this.applyFilters();
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages || page === this.page) return;
    this.loadMessages(page);
  }

  selectMessage(msg: ContactMessageResponse): void {
    this.selectedMessage = msg;
    this.replyText = '';
  }

  closeDetail(): void {
    this.selectedMessage = null;
  }

  sendReply(): void {
    if (!this.selectedMessage || !this.replyText.trim()) return;
    this.isReplying = true;
    this.contactService.reply(this.selectedMessage.id, this.replyText).subscribe({
      next: (res) => {
        if (res.success) {
          this.selectedMessage = null;
          this.replyText = '';
          this.loadMessages();
        }
        this.isReplying = false;
      },
      error: () => {
        this.isReplying = false;
      },
    });
  }
}
