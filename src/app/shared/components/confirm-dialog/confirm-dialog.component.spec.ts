import { TestBed } from '@angular/core/testing';
import { ConfirmDialogComponent } from './confirm-dialog.component';
import { vi } from 'vitest';

describe('ConfirmDialogComponent', () => {
  function setup(overrides: Partial<ConfirmDialogComponent> = {}) {
    TestBed.configureTestingModule({});
    const component = TestBed.runInInjectionContext(() => new ConfirmDialogComponent());
    Object.assign(component, overrides);
    return component;
  }

  it('should create', () => {
    expect(setup()).toBeTruthy();
  });

  it('should have default values', () => {
    const component = setup();
    expect(component.open).toBe(false);
    expect(component.title).toBe('Confirm');
    expect(component.message).toBe('Are you sure?');
    expect(component.confirmText).toBe('Confirm');
    expect(component.cancelText).toBe('Cancel');
    expect(component.isDestructive).toBe(false);
  });

  it('should emit confirmed and set open to false on onConfirm', () => {
    const component = setup({ open: true });
    const confirmedSpy = vi.spyOn(component.confirmed, 'emit');
    const cancelledSpy = vi.spyOn(component.cancelled, 'emit');
    component.onConfirm();
    expect(confirmedSpy).toHaveBeenCalledTimes(1);
    expect(cancelledSpy).not.toHaveBeenCalled();
    expect(component.open).toBe(false);
  });

  it('should emit cancelled and set open to false on onCancel', () => {
    const component = setup({ open: true });
    const cancelledSpy = vi.spyOn(component.cancelled, 'emit');
    const confirmedSpy = vi.spyOn(component.confirmed, 'emit');
    component.onCancel();
    expect(cancelledSpy).toHaveBeenCalledTimes(1);
    expect(confirmedSpy).not.toHaveBeenCalled();
    expect(component.open).toBe(false);
  });

  it('should accept all inputs', () => {
    const component = setup({
      open: true,
      title: 'Delete Item',
      message: 'Are you sure you want to delete?',
      confirmText: 'Delete',
      cancelText: 'Keep',
      isDestructive: true,
    });
    expect(component.open).toBe(true);
    expect(component.title).toBe('Delete Item');
    expect(component.message).toBe('Are you sure you want to delete?');
    expect(component.confirmText).toBe('Delete');
    expect(component.cancelText).toBe('Keep');
    expect(component.isDestructive).toBe(true);
  });
});
