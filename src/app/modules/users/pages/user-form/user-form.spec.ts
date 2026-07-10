import { TestBed } from '@angular/core/testing';
import { UserFormComponent } from './user-form';

describe('UserFormComponent', () => {
  it('should create', () => {
    TestBed.configureTestingModule({});
    const component = TestBed.runInInjectionContext(() => new UserFormComponent());
    expect(component).toBeTruthy();
  });
});
