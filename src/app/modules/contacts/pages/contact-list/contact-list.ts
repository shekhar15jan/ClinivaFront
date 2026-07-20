import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContactService } from '../../../../core/services/contact.service';
import { ContactMessageResponse } from '../../../../core/models/contact.model';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-contact-list',
  templateUrl: './contact-list.html',
  styleUrl: './contact-list.scss',
  standalone: true,
  imports: [StatusBadgeComponent, EmptyStateComponent, DatePipe, FormsModule],
})
export class ContactList implements OnInit {
  private contactService = inject(ContactService);

  messages: ContactMessageResponse[] = [];
  filteredMessages: ContactMessageResponse[] = [];
  isLoading = false;
  error = '';
  statusFilter = '';
  searchQuery = '';
  selectedMessage: ContactMessageResponse | null = null;
  replyText = '';
  isReplying = false;

  get newCount(): number {
    return this.messages.filter((m) => m.status === 'NEW').length;
  }

  get repliedCount(): number {
    return this.messages.filter((m) => m.status === 'REPLIED').length;
  }

  ngOnInit(): void {
    this.loadMessages();
  }

  loadMessages(): void {
    this.isLoading = true;
    this.error = '';
    this.contactService.list().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.messages = res.data;
          this.applyFilters();
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err?.message || 'Failed to load contact messages';
        this.isLoading = false;
      },
    });
  }

  applyFilters(): void {
    let result = [...this.messages];
    if (this.statusFilter) {
      result = result.filter((m) => m.status === this.statusFilter);
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(
        (m) => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.subject?.toLowerCase().includes(q),
      );
    }
    this.filteredMessages = result;
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
