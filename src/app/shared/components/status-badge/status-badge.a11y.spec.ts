import { TestBed } from '@angular/core/testing';
import { StatusBadgeComponent } from './status-badge.component';
import { describe, it, expect } from 'vitest';
import axe from 'axe-core';

describe('StatusBadgeComponent (a11y)', () => {
  function createComponent(status = 'ACTIVE') {
    TestBed.configureTestingModule({});
    const component = TestBed.runInInjectionContext(() => new StatusBadgeComponent());
    component.status = status;
    return component;
  }

  it('should have no accessibility violations for ACTIVE status', async () => {
    createComponent('ACTIVE');
    const results = await axe.run(document.body);
    expect(results.violations).toHaveLength(0);
  });

  it('should have no accessibility violations for PENDING status', async () => {
    createComponent('PENDING');
    const results = await axe.run(document.body);
    expect(results.violations).toHaveLength(0);
  });

  it('should have no accessibility violations for CANCELLED status', async () => {
    createComponent('CANCELLED');
    const results = await axe.run(document.body);
    expect(results.violations).toHaveLength(0);
  });
});
