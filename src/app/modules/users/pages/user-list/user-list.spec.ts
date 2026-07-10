import { TestBed } from '@angular/core/testing';
import { UserListComponent } from './user-list';

describe('UserListComponent', () => {
  it('should create', () => {
    TestBed.configureTestingModule({});
    const component = TestBed.runInInjectionContext(() => new UserListComponent());
    expect(component).toBeTruthy();
  });
});
