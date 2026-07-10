import { TestBed } from '@angular/core/testing';
import { ResourceUsageBarComponent } from './resource-usage-bar.component';
import { ResourceConstraint } from '../../../core/models/effective-license.model';

describe('ResourceUsageBarComponent', () => {
  function setup(constraint: ResourceConstraint | null = null) {
    TestBed.configureTestingModule({});
    const component = TestBed.runInInjectionContext(() => new ResourceUsageBarComponent());
    component.constraint = constraint;
    return component;
  }

  it('should create', () => {
    const component = setup();
    expect(component).toBeTruthy();
  });

  describe('percentage', () => {
    it('should return 0 when constraint is null', () => {
      expect(setup(null).percentage).toBe(0);
    });

    it('should return 0 for unlimited constraint', () => {
      const constraint: ResourceConstraint = {
        resourceCode: 'DOC', resourceName: 'Doctors',
        limit: 0, currentUsage: 50, isUnlimited: true,
      };
      expect(setup(constraint).percentage).toBe(0);
    });

    it('should return 0 when limit is 0', () => {
      const constraint: ResourceConstraint = {
        resourceCode: 'DOC', resourceName: 'Doctors',
        limit: 0, currentUsage: 0, isUnlimited: false,
      };
      expect(setup(constraint).percentage).toBe(0);
    });

    it('should calculate percentage correctly', () => {
      const constraint: ResourceConstraint = {
        resourceCode: 'DOC', resourceName: 'Doctors',
        limit: 100, currentUsage: 50, isUnlimited: false,
      };
      expect(setup(constraint).percentage).toBe(50);
    });

    it('should cap percentage at 100', () => {
      const constraint: ResourceConstraint = {
        resourceCode: 'DOC', resourceName: 'Doctors',
        limit: 100, currentUsage: 150, isUnlimited: false,
      };
      expect(setup(constraint).percentage).toBe(100);
    });
  });

  describe('barColor', () => {
    it('should return green for < 60%', () => {
      const constraint: ResourceConstraint = {
        resourceCode: 'DOC', resourceName: 'Doctors',
        limit: 100, currentUsage: 30, isUnlimited: false,
      };
      expect(setup(constraint).barColor).toBe('bg-green-500');
    });

    it('should return amber for >= 60% and < 80%', () => {
      const constraint: ResourceConstraint = {
        resourceCode: 'DOC', resourceName: 'Doctors',
        limit: 100, currentUsage: 70, isUnlimited: false,
      };
      expect(setup(constraint).barColor).toBe('bg-amber-500');
    });

    it('should return red for >= 80%', () => {
      const constraint: ResourceConstraint = {
        resourceCode: 'DOC', resourceName: 'Doctors',
        limit: 100, currentUsage: 80, isUnlimited: false,
      };
      expect(setup(constraint).barColor).toBe('bg-red-500');
    });

    it('should return green when constraint is null', () => {
      expect(setup(null).barColor).toBe('bg-green-500');
    });
  });
});
