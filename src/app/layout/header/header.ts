import { Component, EventEmitter, Output, inject, OnInit, OnDestroy, ElementRef, HostListener } from '@angular/core';
import { NotificationService } from '../../core/services/notification.service';
import { Notification } from '../../core/models/notification.model';
import { Subject, interval, takeUntil, startWith, switchMap } from 'rxjs';

@Component({
  selector: 'app-header',
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements OnInit, OnDestroy {
  @Output() menuClick = new EventEmitter<void>();

  private notificationService = inject(NotificationService);
  private destroy$ = new Subject<void>();

  notifications: Notification[] = [];
  unreadCount = 0;
  showDropdown = false;

  ngOnInit(): void {
    interval(30000).pipe(
      startWith(0),
      switchMap(() => this.notificationService.getUnreadCount()),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (res) => this.unreadCount = res.data?.count ?? 0,
      error: () => {}
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.showDropdown) {
      const target = event.target as HTMLElement;
      if (!target.closest('.notification-wrapper')) {
        this.showDropdown = false;
      }
    }
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
    if (this.showDropdown) {
      this.loadNotifications();
    }
  }

  loadNotifications(): void {
    this.notificationService.getNotifications().subscribe({
      next: (res) => this.notifications = res.data ?? [],
      error: () => {}
    });
  }

  markAsRead(notification: Notification): void {
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.id).subscribe({
        next: () => {
          notification.isRead = true;
          this.unreadCount = Math.max(0, this.unreadCount - 1);
        }
      });
    }
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.forEach(n => n.isRead = true);
        this.unreadCount = 0;
      }
    });
  }

  closeDropdown(): void {
    this.showDropdown = false;
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'APPOINTMENT_CONFIRMED': return 'event_available';
      case 'APPOINTMENT_REJECTED': return 'event_busy';
      case 'APPOINTMENT_CANCELLED': return 'event_cancelled';
      case 'PRESCRIPTION_CREATED': return 'description';
      case 'BILL_GENERATED': return 'receipt_long';
      case 'PAYMENT_RECEIVED': return 'payments';
      default: return 'notifications';
    }
  }

  getTimeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }
}
