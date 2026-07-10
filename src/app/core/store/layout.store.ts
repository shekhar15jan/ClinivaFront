import { Injectable, signal } from '@angular/core';

export interface Breadcrumb {
  label: string;
  route?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LayoutStore {
  private loadingSignal = signal(false);
  private sidebarCollapsedSignal = signal(false);
  private breadcrumbsSignal = signal<Breadcrumb[]>([]);
  private notificationsSignal = signal<{ id: string; message: string; read: boolean; timestamp: string }[]>([]);

  readonly isLoading = this.loadingSignal.asReadonly();
  readonly isSidebarCollapsed = this.sidebarCollapsedSignal.asReadonly();
  readonly breadcrumbs = this.breadcrumbsSignal.asReadonly();
  readonly notifications = this.notificationsSignal.asReadonly();
  readonly unreadCount = signal(0);

  setLoading(loading: boolean): void {
    this.loadingSignal.set(loading);
  }

  toggleSidebar(): void {
    this.sidebarCollapsedSignal.set(!this.sidebarCollapsedSignal());
  }

  setSidebarCollapsed(collapsed: boolean): void {
    this.sidebarCollapsedSignal.set(collapsed);
  }

  setBreadcrumbs(breadcrumbs: Breadcrumb[]): void {
    this.breadcrumbsSignal.set(breadcrumbs);
  }

  setNotifications(notifications: { id: string; message: string; read: boolean; timestamp: string }[]): void {
    this.notificationsSignal.set(notifications);
    this.unreadCount.set(notifications.filter(n => !n.read).length);
  }

  markNotificationRead(id: string): void {
    const current = this.notificationsSignal();
    const updated = current.map(n => n.id === id ? { ...n, read: true } : n);
    this.notificationsSignal.set(updated);
    this.unreadCount.set(updated.filter(n => !n.read).length);
  }
}
