import { TestBed } from '@angular/core/testing';
import { AuthShell } from './auth-shell';

describe('AuthShell', () => {
  it('should create', () => {
    TestBed.configureTestingModule({});
    const component = TestBed.runInInjectionContext(() => new AuthShell());
    expect(component).toBeTruthy();
  });
});
