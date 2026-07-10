import { TestBed } from '@angular/core/testing';
import { ModuleUpgradePromptComponent } from './module-upgrade-prompt.component';

describe('ModuleUpgradePromptComponent', () => {
  function setup(overrides: Partial<ModuleUpgradePromptComponent> = {}) {
    TestBed.configureTestingModule({});
    const component = TestBed.runInInjectionContext(() => new ModuleUpgradePromptComponent());
    Object.assign(component, overrides);
    return component;
  }

  it('should create', () => {
    expect(setup()).toBeTruthy();
  });

  it('should have default values', () => {
    const component = setup();
    expect(component.moduleCode).toBe('');
    expect(component.moduleName).toBe('');
    expect(component.planName).toBe('Current');
  });

  it('should accept all inputs', () => {
    const component = setup({
      moduleCode: 'BILLING',
      moduleName: 'Billing',
      planName: 'Free',
    });
    expect(component.moduleCode).toBe('BILLING');
    expect(component.moduleName).toBe('Billing');
    expect(component.planName).toBe('Free');
  });
});
