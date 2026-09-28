import { TestBed } from '@angular/core/testing';
import { ContactList } from './contact-list';
import { ContactService } from '../../../../core/services/contact.service';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { ApiResponse, PagedResponse } from '../../../../core/models/common.model';
import { ContactMessageResponse } from '../../../../core/models/contact.model';

describe('ContactList', () => {
  const mockMessage: ContactMessageResponse = {
    id: 'c1', tenantId: 't1', name: 'John', email: 'john@test.com',
    phone: '9999999999', subject: 'Query', message: 'Test message',
    status: 'NEW', adminReply: '', createdAt: '2026-01-01T00:00:00Z',
  };

  const page = (content: ContactMessageResponse[], pageNumber = 0, totalPages = 1): ApiResponse<PagedResponse<ContactMessageResponse>> => ({
    success: true, message: '', timestamp: '', requestId: '',
    data: { content, pageNumber, pageSize: 20, totalElements: content.length, totalPages, last: pageNumber >= totalPages - 1 },
  });
  const mockListResponse = page([mockMessage]);
  const counts = { success: true, data: { NEW: 3, IN_PROGRESS: 1, RESOLVED: 2 }, message: '', timestamp: '', requestId: '' };

  function createComponent(overrides?: Partial<Record<keyof ContactService, unknown>>) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ContactService,
          useValue: {
            list: vi.fn().mockReturnValue(of(mockListResponse)),
            counts: vi.fn().mockReturnValue(of(counts)),
            ...overrides,
          },
        },
      ],
    });
    return TestBed.runInInjectionContext(() => new ContactList());
  }

  it('should create with initial state', () => {
    const component = createComponent();
    expect(component).toBeTruthy();
    expect(component.messages).toEqual([]);
    expect(component.isLoading).toBe(false);
    expect(component.error).toBe('');
  });

  it('should load messages on init', () => {
    const component = createComponent();
    component.ngOnInit();
    expect(component.messages.length).toBe(1);
    expect(component.messages[0].name).toBe('John');
    expect(component.isLoading).toBe(false);
  });

  it('should handle load error', () => {
    const component = createComponent({
      list: vi.fn().mockReturnValue(throwError(() => ({ message: 'Server error' }))),
    });
    component.ngOnInit();
    expect(component.isLoading).toBe(false);
    expect(component.error).toBe('Server error');
    expect(component.messages).toEqual([]);
  });

  it('should handle load error without message', () => {
    const component = createComponent({
      list: vi.fn().mockReturnValue(throwError(() => ({}))),
    });
    component.ngOnInit();
    expect(component.error).toBe('Failed to load contact messages');
  });

  it('should handle empty data in response', () => {
    const component = createComponent({
      list: vi.fn().mockReturnValue(of({ success: true, data: null, message: '', timestamp: '', requestId: '' })),
    });
    component.ngOnInit();
    expect(component.messages).toEqual([]);
  });

  it('should handle failed response', () => {
    const component = createComponent({
      list: vi.fn().mockReturnValue(of({ success: false, data: [mockMessage], message: '', timestamp: '', requestId: '' })),
    });
    component.ngOnInit();
    expect(component.messages).toEqual([]);
  });

  it('shows counts for the whole inbox, not just the page', () => {
    const component = createComponent();
    component.ngOnInit();
    expect(component.newCount).toBe(3);
    expect(component.resolvedCount).toBe(2);
    expect(component.totalCount).toBe(6);
  });

  it('asks the server for the chosen status and search, from the first page', () => {
    const list = vi.fn().mockReturnValue(of(page([mockMessage], 1, 3)));
    const component = createComponent({ list });
    component.ngOnInit();
    component.statusFilter = 'RESOLVED';
    component.searchQuery = 'john';
    component.applyFilters();
    expect(list).toHaveBeenLastCalledWith({ page: 0, size: 20, status: 'RESOLVED', q: 'john' });
  });

  it('pages forward and back within range', () => {
    const list = vi.fn().mockReturnValue(of(page([mockMessage], 0, 3)));
    const component = createComponent({ list });
    component.ngOnInit();
    component.goToPage(1);
    expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 }));
    list.mockClear();
    component.goToPage(-1);
    component.goToPage(3);
    expect(list).not.toHaveBeenCalled();
  });

  it('waits for typing to pause before searching', () => {
    vi.useFakeTimers();
    try {
      const list = vi.fn().mockReturnValue(of(mockListResponse));
      const component = createComponent({ list });
      component.ngOnInit();
      list.mockClear();
      component.searchQuery = 'jo';
      component.onSearchInput();
      component.searchQuery = 'joh';
      component.onSearchInput();
      expect(list).not.toHaveBeenCalled();
      vi.advanceTimersByTime(300);
      expect(list).toHaveBeenCalledTimes(1);
      expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ q: 'joh', page: 0 }));
    } finally {
      vi.useRealTimers();
    }
  });
});
