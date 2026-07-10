import { TestBed } from '@angular/core/testing';
import { StatusBadgeComponent } from './status-badge.component';
import { describe, it, expect } from 'vitest';

describe('StatusBadgeComponent (snapshot)', () => {
  function createComponent(status = 'ACTIVE', label = '') {
    TestBed.configureTestingModule({});
    const component = TestBed.runInInjectionContext(() => new StatusBadgeComponent());
    component.status = status;
    component.label = label;
    return component;
  }

  it('should match snapshot for ACTIVE', () => {
    const component = createComponent('ACTIVE');
    expect(component.displayLabel).toMatchSnapshot();
    expect(component.badgeClasses).toMatchSnapshot();
  });

  it('should match snapshot for PENDING with custom label', () => {
    const component = createComponent('PENDING', 'Awaiting');
    expect(component.displayLabel).toMatchSnapshot();
    expect(component.badgeClasses).toMatchSnapshot();
  });

  it('should match snapshot for CANCELLED', () => {
    const component = createComponent('CANCELLED');
    expect(component.displayLabel).toMatchSnapshot();
    expect(component.badgeClasses).toMatchSnapshot();
  });

  it('should match snapshot for IN_PROGRESS', () => {
    const component = createComponent('IN_PROGRESS');
    expect(component.displayLabel).toMatchSnapshot();
    expect(component.badgeClasses).toMatchSnapshot();
  });
});
