import { TestBed } from '@angular/core/testing';
import { AuditLogViewerComponent } from './audit-log-viewer';

describe('AuditLogViewerComponent', () => {
  it('should create', () => {
    TestBed.configureTestingModule({});
    const component = TestBed.runInInjectionContext(() => new AuditLogViewerComponent());
    expect(component).toBeTruthy();
  });
});
