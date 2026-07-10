import { TestBed } from '@angular/core/testing';
import { Shell } from './shell';

describe('Shell', () => {
  it('should create', () => {
    TestBed.configureTestingModule({});
    const component = TestBed.runInInjectionContext(() => new Shell());
    expect(component).toBeTruthy();
  });
});
