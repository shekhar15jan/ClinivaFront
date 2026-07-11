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
  isLoading = false;
  error = '';
  selectedMessage: ContactMessageResponse | null = null;
  replyText = '';
  isReplying = false;

  ngOnInit() {
    this.loadMessages();
  }

  loadMessages() {
    this.isLoading = true;
    this.error = '';
    this.contactService.list().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.messages = res.data;
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err?.message || 'Failed to load contact messages';
        this.isLoading = false;
      },
    });
  }

  selectMessage(msg: ContactMessageResponse) {
    this.selectedMessage = msg;
    this.replyText = '';
  }

  closeDetail() {
    this.selectedMessage = null;
  }

  sendReply() {
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
