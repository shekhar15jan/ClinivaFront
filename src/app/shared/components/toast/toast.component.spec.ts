import { TestBed } from '@angular/core/testing';
import { ToastComponent } from './toast.component';
import { ToastService } from './toast.service';
import { vi } from 'vitest';
import { Toast } from './toast.service';

describe('ToastComponent', () => {
  function setup() {
    const mockToastService = {
      toasts: vi.fn().mockReturnValue([] as Toast[]),
      dismiss: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: ToastService, useValue: mockToastService },
      ],
    });
    const component = TestBed.runInInjectionContext(() => new ToastComponent());
    return { component, mockToastService };
  }

  it('should create', () => {
    const { component } = setup();
    expect(component).toBeTruthy();
  });

  describe('getToastClasses', () => {
    it('should return success classes for success type', () => {
      const { component } = setup();
      const toast: Toast = { id: '1', message: 'OK', type: 'success', duration: 4000 };
      const classes = component.getToastClasses(toast);
      expect(classes['bg-green-50 text-green-800 border border-green-200']).toBe(true);
      expect(classes['cursor-pointer']).toBe(true);
    });

    it('should return error classes for error type', () => {
      const { component } = setup();
      const toast: Toast = { id: '1', message: 'Err', type: 'error', duration: 6000 };
      const classes = component.getToastClasses(toast);
      expect(classes['bg-red-50 text-red-800 border border-red-200']).toBe(true);
    });

    it('should return warning classes for warning type', () => {
      const { component } = setup();
      const toast: Toast = { id: '1', message: 'Warn', type: 'warning', duration: 5000 };
      const classes = component.getToastClasses(toast);
      expect(classes['bg-amber-50 text-amber-800 border border-amber-200']).toBe(true);
    });

    it('should return info classes for info type', () => {
      const { component } = setup();
      const toast: Toast = { id: '1', message: 'Info', type: 'info', duration: 4000 };
      const classes = component.getToastClasses(toast);
      expect(classes['bg-blue-50 text-blue-800 border border-blue-200']).toBe(true);
    });
  });

  describe('getIcon', () => {
    it('should return checkmark for success', () => {
      const { component } = setup();
      const toast: Toast = { id: '', message: '', type: 'success', duration: 0 };
      expect(component.getIcon(toast)).toBe('\u2713');
    });

    it('should return X for error', () => {
      const { component } = setup();
      const toast: Toast = { id: '', message: '', type: 'error', duration: 0 };
      expect(component.getIcon(toast)).toBe('\u2717');
    });

    it('should return warning symbol for warning', () => {
      const { component } = setup();
      const toast: Toast = { id: '', message: '', type: 'warning', duration: 0 };
      expect(component.getIcon(toast)).toBe('\u26A0');
    });

    it('should return info symbol for info', () => {
      const { component } = setup();
      const toast: Toast = { id: '', message: '', type: 'info', duration: 0 };
      expect(component.getIcon(toast)).toBe('\u2139');
    });
  });
});
