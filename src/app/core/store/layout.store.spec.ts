import { TestBed } from '@angular/core/testing';
import { LayoutStore, Breadcrumb } from './layout.store';

describe('LayoutStore', () => {
  let store: LayoutStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LayoutStore],
    });
    store = TestBed.runInInjectionContext(() => new LayoutStore());
  });

  it('should have initial state', () => {
    expect(store.isLoading()).toBe(false);
    expect(store.isSidebarCollapsed()).toBe(false);
    expect(store.breadcrumbs()).toEqual([]);
    expect(store.notifications()).toEqual([]);
    expect(store.unreadCount()).toBe(0);
  });

  it('should set loading', () => {
    store.setLoading(true);
    expect(store.isLoading()).toBe(true);
    store.setLoading(false);
    expect(store.isLoading()).toBe(false);
  });

  it('should toggle sidebar', () => {
    expect(store.isSidebarCollapsed()).toBe(false);
    store.toggleSidebar();
    expect(store.isSidebarCollapsed()).toBe(true);
    store.toggleSidebar();
    expect(store.isSidebarCollapsed()).toBe(false);
  });

  it('should set sidebar collapsed directly', () => {
    store.setSidebarCollapsed(true);
    expect(store.isSidebarCollapsed()).toBe(true);
    store.setSidebarCollapsed(false);
    expect(store.isSidebarCollapsed()).toBe(false);
  });

  it('should set breadcrumbs', () => {
    const crumbs: Breadcrumb[] = [
      { label: 'Home', route: '/' },
      { label: 'Patients' },
    ];
    store.setBreadcrumbs(crumbs);
    expect(store.breadcrumbs()).toEqual(crumbs);
  });

  it('should set notifications and update unread count', () => {
    const notifications = [
      { id: '1', message: 'Test 1', read: false, timestamp: '2026-01-01T00:00:00Z' },
      { id: '2', message: 'Test 2', read: true, timestamp: '2026-01-01T00:00:00Z' },
    ];
    store.setNotifications(notifications);
    expect(store.notifications().length).toBe(2);
    expect(store.unreadCount()).toBe(1);
  });

  it('should mark notification as read', () => {
    const notifications = [
      { id: '1', message: 'Test 1', read: false, timestamp: '2026-01-01T00:00:00Z' },
      { id: '2', message: 'Test 2', read: false, timestamp: '2026-01-01T00:00:00Z' },
    ];
    store.setNotifications(notifications);
    expect(store.unreadCount()).toBe(2);

    store.markNotificationRead('1');
    expect(store.notifications()[0].read).toBe(true);
    expect(store.unreadCount()).toBe(1);
  });
});
