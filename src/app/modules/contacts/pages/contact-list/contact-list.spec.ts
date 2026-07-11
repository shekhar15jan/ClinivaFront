import { TestBed } from '@angular/core/testing';
import { ContactList } from './contact-list';
import { ContactService } from '../../../../core/services/contact.service';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { ApiResponse } from '../../../../core/models/common.model';
import { ContactMessageResponse } from '../../../../core/models/contact.model';

describe('ContactList', () => {
  const mockMessage: ContactMessageResponse = {
    id: 'c1', tenantId: 't1', name: 'John', email: 'john@test.com',
    phone: '9999999999', subject: 'Query', message: 'Test message',
    status: 'NEW', adminReply: '', createdAt: '2026-01-01T00:00:00Z',
  };

  const mockListResponse: ApiResponse<ContactMessageResponse[]> = {
    success: true, data: [mockMessage], message: '', timestamp: '', requestId: '',
  };

  function createComponent(overrides?: Partial<ContactService>) {
    TestBed.configureTestingModule({
      providers: [
        { provide: ContactService, useValue: { list: vi.fn().mockReturnValue(of(mockListResponse)), ...overrides } },
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
});
