import { TestBed } from '@angular/core/testing';
import { LoadingSpinnerComponent } from './loading-spinner.component';
import { LayoutStore } from '../../../core/store/layout.store';
import { vi } from 'vitest';

describe('LoadingSpinnerComponent', () => {
  function setup(isLoading = false) {
    const mockLayoutStore = {
      isLoading: vi.fn().mockReturnValue(isLoading),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: LayoutStore, useValue: mockLayoutStore },
      ],
    });
    const component = TestBed.runInInjectionContext(() => new LoadingSpinnerComponent());
    return { component, mockLayoutStore };
  }

  it('should create', () => {
    const { component } = setup();
    expect(component).toBeTruthy();
  });

  it('should read isLoading from layoutStore', () => {
    const { component, mockLayoutStore } = setup(true);
    expect(component.layoutStore.isLoading()).toBe(true);
    expect(mockLayoutStore.isLoading).toHaveBeenCalled();
  });

  it('should return false when not loading', () => {
    const { component } = setup(false);
    expect(component.layoutStore.isLoading()).toBe(false);
  });

  it('should have default empty message', () => {
    const { component } = setup();
    expect(component.message).toBe('');
  });

  it('should accept a message input', () => {
    const { component } = setup();
    component.message = 'Loading...';
    expect(component.message).toBe('Loading...');
  });
});
