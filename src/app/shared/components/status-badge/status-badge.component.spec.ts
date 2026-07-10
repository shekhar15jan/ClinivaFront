import { TestBed } from '@angular/core/testing';
import { StatusBadgeComponent } from './status-badge.component';

describe('StatusBadgeComponent', () => {
  function setup(status = '', label = '') {
    TestBed.configureTestingModule({});
    const component = TestBed.runInInjectionContext(() => new StatusBadgeComponent());
    component.status = status;
    component.label = label;
    return component;
  }

  it('should create', () => {
    expect(setup()).toBeTruthy();
  });

  describe('displayLabel', () => {
    it('should use label when provided', () => {
      const component = setup('ACTIVE', 'Custom Active');
      expect(component.displayLabel).toBe('Custom Active');
    });

    it('should format status as label when no label provided', () => {
      const component = setup('IN_PROGRESS');
      expect(component.displayLabel).toBe('IN PROGRESS');
    });

    it('should use status as-is for single word status', () => {
      const component = setup('PENDING');
      expect(component.displayLabel).toBe('PENDING');
    });
  });

  describe('badgeClasses', () => {
    it('should map ACTIVE to green class', () => {
      const component = setup('ACTIVE');
      expect(component.badgeClasses['bg-green-100 text-green-800']).toBe(true);
    });

    it('should map PAID to green class', () => {
      const component = setup('PAID');
      expect(component.badgeClasses['bg-green-100 text-green-800']).toBe(true);
    });

    it('should map COMPLETED to green class', () => {
      const component = setup('COMPLETED');
      expect(component.badgeClasses['bg-green-100 text-green-800']).toBe(true);
    });

    it('should map PENDING to amber class', () => {
      const component = setup('PENDING');
      expect(component.badgeClasses['bg-amber-100 text-amber-800']).toBe(true);
    });

    it('should map CANCELLED to red class', () => {
      const component = setup('CANCELLED');
      expect(component.badgeClasses['bg-red-100 text-red-800']).toBe(true);
    });

    it('should map INACTIVE to gray class', () => {
      const component = setup('INACTIVE');
      expect(component.badgeClasses['bg-gray-100 text-gray-800']).toBe(true);
    });

    it('should map PROCESSING to blue class', () => {
      const component = setup('PROCESSING');
      expect(component.badgeClasses['bg-blue-100 text-blue-800']).toBe(true);
    });

    it('should map DECEASED to red class', () => {
      const component = setup('DECEASED');
      expect(component.badgeClasses['bg-red-100 text-red-800']).toBe(true);
    });

    it('should be case-insensitive for status matching', () => {
      const component = setup('active');
      expect(component.badgeClasses['bg-green-100 text-green-800']).toBe(true);
    });
  });
});
