import { TestBed } from '@angular/core/testing';
import { FabComponent } from './fab.component';
import { LayoutStore, FabConfig } from '../../../core/store/layout.store';
import { vi } from 'vitest';

describe('FabComponent', () => {
  function setup(config: FabConfig | null = null) {
    const layoutStore = {
      fabConfig: vi.fn(() => config),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: LayoutStore, useValue: layoutStore },
      ],
    });

    const component = TestBed.runInInjectionContext(() => new FabComponent());
    return { component, layoutStore };
  }

  it('should create', () => {
    const { component } = setup();
    expect(component).toBeTruthy();
  });

  it('should expose config signal from layout store', () => {
    const config: FabConfig = { icon: 'add', label: 'Add', route: '/add' };
    const { component } = setup(config);

    expect(component.config()).toEqual(config);
    expect(component.config()?.icon).toBe('add');
    expect(component.config()?.label).toBe('Add');
  });

  it('should return null config when not set', () => {
    const { component } = setup(null);

    expect(component.config()).toBeNull();
  });

  it('should call config action on fab click', () => {
    const actionSpy = vi.fn();
    const config: FabConfig = { icon: 'add', label: 'Add', action: actionSpy };
    const { component } = setup(config);

    component.onFabClick();

    expect(actionSpy).toHaveBeenCalledTimes(1);
  });

  it('should not throw when action is undefined', () => {
    const config: FabConfig = { icon: 'add', label: 'Add' };
    const { component } = setup(config);

    expect(() => component.onFabClick()).not.toThrow();
  });
});
