import { TestBed } from '@angular/core/testing';
import { NotFoundComponent } from './not-found';

describe('NotFoundComponent', () => {
  it('should create', () => {
    TestBed.configureTestingModule({});
    const component = TestBed.runInInjectionContext(() => new NotFoundComponent());
    expect(component).toBeTruthy();
  });
});
