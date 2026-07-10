import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  function setup() {
    TestBed.configureTestingModule({});
    const component = TestBed.runInInjectionContext(() => new App());
    return component;
  }

  it('should create', () => {
    const component = setup();
    expect(component).toBeTruthy();
  });

  it('should have default title', () => {
    const component = setup();
    expect(component['title']()).toBe('ClinivaFront');
  });
});
