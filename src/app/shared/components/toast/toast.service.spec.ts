import { vi } from 'vitest';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    vi.useFakeTimers();
    service = new ToastService();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should start with empty toasts', () => {
    expect(service.toasts()).toEqual([]);
  });

  it('should add a toast with show()', () => {
    service.show('Test message', 'success');
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].message).toBe('Test message');
    expect(service.toasts()[0].type).toBe('success');
  });

  it('should auto-dismiss toast after duration', () => {
    service.show('Auto dismiss', 'info', 3000);
    expect(service.toasts().length).toBe(1);
    vi.advanceTimersByTime(3000);
    expect(service.toasts().length).toBe(0);
  });

  it('should not auto-dismiss when duration is 0', () => {
    service.show('Persistent', 'info', 0);
    vi.advanceTimersByTime(10000);
    expect(service.toasts().length).toBe(1);
  });

  it('success() should add success toast', () => {
    service.success('Success!');
    expect(service.toasts()[0].type).toBe('success');
  });

  it('error() should add error toast with 6000ms duration', () => {
    service.error('Error!');
    expect(service.toasts()[0].type).toBe('error');
    expect(service.toasts()[0].duration).toBe(6000);
  });

  it('warning() should add warning toast with 5000ms duration', () => {
    service.warning('Warning!');
    expect(service.toasts()[0].type).toBe('warning');
    expect(service.toasts()[0].duration).toBe(5000);
  });

  it('info() should add info toast', () => {
    service.info('Info!');
    expect(service.toasts()[0].type).toBe('info');
  });

  it('dismiss() should remove a specific toast by id', () => {
    service.show('Toast 1');
    service.show('Toast 2');
    const id = service.toasts()[0].id;
    service.dismiss(id);
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].message).toBe('Toast 2');
  });

  it('clear() should remove all toasts', () => {
    service.show('A');
    service.show('B');
    service.clear();
    expect(service.toasts().length).toBe(0);
  });

  it('should generate unique IDs for each toast', () => {
    service.show('A');
    service.show('B');
    expect(service.toasts()[0].id).not.toBe(service.toasts()[1].id);
  });

  it('should respect custom duration', () => {
    service.show('Custom', 'warning', 5000);
    expect(service.toasts()[0].duration).toBe(5000);
  });
});
