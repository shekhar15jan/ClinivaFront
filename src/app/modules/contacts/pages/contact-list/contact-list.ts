import { Component, OnInit, inject } from '@angular/core';
import { ContactService } from '../../../core/services/contact.service';
import { ContactMessageResponse } from '../../../core/models/contact.model';
import { SharedModule } from '../../../shared/shared-module';

@Component({
  selector: 'app-contact-list',
  templateUrl: './contact-list.html',
  styleUrl: './contact-list.scss',
  standalone: true,
  imports: [SharedModule],
})
export class ContactList implements OnInit {
  private contactService = inject(ContactService);

  messages: ContactMessageResponse[] = [];
  isLoading = false;
  error = '';

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
}
