import { TestBed } from '@angular/core/testing';
import { Header } from './header';

describe('Header', () => {
  it('should create', () => {
    TestBed.configureTestingModule({});
    const component = TestBed.runInInjectionContext(() => new Header());
    expect(component).toBeTruthy();
  });
});
