import { TestBed } from '@angular/core/testing';
import { BottomSheetComponent } from './bottom-sheet.component';
import { vi } from 'vitest';

describe('BottomSheetComponent', () => {
  function setup(overrides: Partial<BottomSheetComponent> = {}) {
    TestBed.configureTestingModule({});
    const component = TestBed.runInInjectionContext(() => new BottomSheetComponent());
    Object.assign(component, overrides);
    return component;
  }

  it('should create', () => {
    expect(setup()).toBeTruthy();
  });

  it('should have default values', () => {
    const component = setup();
    expect(component.isOpen).toBe(false);
    expect(component.title).toBe('');
    expect(component.showCloseButton).toBe(true);
  });

  it('should accept custom inputs', () => {
    const component = setup({
      isOpen: true,
      title: 'Filter Options',
      showCloseButton: false,
    });
    expect(component.isOpen).toBe(true);
    expect(component.title).toBe('Filter Options');
    expect(component.showCloseButton).toBe(false);
  });

  it('should emit closed on backdrop click', () => {
    const component = setup({ isOpen: true });
    const closedSpy = vi.spyOn(component.closed, 'emit');

    component.onBackdropClick();

    expect(closedSpy).toHaveBeenCalledTimes(1);
  });

  it('should not emit if closed handler not subscribed', () => {
    const component = setup({ isOpen: true });
    expect(() => component.onBackdropClick()).not.toThrow();
  });
});
