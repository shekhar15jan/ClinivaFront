import { TestBed } from '@angular/core/testing';
import { EmptyStateComponent } from './empty-state.component';
import { vi } from 'vitest';

describe('EmptyStateComponent', () => {
  function setup(overrides: Partial<EmptyStateComponent> = {}) {
    TestBed.configureTestingModule({});
    const component = TestBed.runInInjectionContext(() => new EmptyStateComponent());
    Object.assign(component, overrides);
    return component;
  }

  it('should create', () => {
    expect(setup()).toBeTruthy();
  });

  it('should have default values', () => {
    const component = setup();
    expect(component.icon).toBe('\uD83D\uDCCB');
    expect(component.title).toBe('No data found');
    expect(component.description).toBe('');
    expect(component.actionLabel).toBe('');
  });

  it('should accept all inputs', () => {
    const component = setup({
      icon: '\uD83D\uDD0D',
      title: 'Search results',
      description: 'No results found for your query',
      actionLabel: 'Try again',
    });
    expect(component.icon).toBe('\uD83D\uDD0D');
    expect(component.title).toBe('Search results');
    expect(component.description).toBe('No results found for your query');
    expect(component.actionLabel).toBe('Try again');
  });

  it('should emit action when action is triggered', () => {
    const component = setup({ actionLabel: 'Retry' });
    const spy = vi.spyOn(component.action, 'emit');
    component.action.emit();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
