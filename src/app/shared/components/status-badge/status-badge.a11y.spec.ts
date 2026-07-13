import { TestBed } from '@angular/core/testing';
import { StatusBadgeComponent } from './status-badge.component';
import { describe, it, expect, afterEach } from 'vitest';
import axe from 'axe-core';

describe('StatusBadgeComponent (a11y)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  async function renderComponent(status = 'ACTIVE') {
    await TestBed.configureTestingModule({
      imports: [StatusBadgeComponent]
    }).compileComponents();

    const fixture = TestBed.createComponent(StatusBadgeComponent);
    fixture.componentInstance.status = status;
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  it('should have no accessibility violations for ACTIVE status', async () => {
    const element = await renderComponent('ACTIVE');
    const results = await axe.run(element);
    expect(results.violations).toHaveLength(0);
  });

  it('should have no accessibility violations for PENDING status', async () => {
    const element = await renderComponent('PENDING');
    const results = await axe.run(element);
    expect(results.violations).toHaveLength(0);
  });

  it('should have no accessibility violations for CANCELLED status', async () => {
    const element = await renderComponent('CANCELLED');
    const results = await axe.run(element);
    expect(results.violations).toHaveLength(0);
  });
});
