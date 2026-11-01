import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '../services/auth.service';
import { OfflineQueue } from './offline-queue.service';

describe('offline queue: ordering, retry and storage', () => {
  let ctrl: HttpTestingController;
  let queue: OfflineQueue;
  const jwt = (sub: string) => `h.${btoa(JSON.stringify({ sub }))}.s`;
  const url = 'http://x.test/api/v1/hms/nursing/admissions/a1/vitals';

  function setup(stored?: string) {
    localStorage.clear();
    if (stored !== undefined) localStorage.setItem('cac.offline.queue.v1', stored);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: AuthService, useValue: { getToken: () => jwt('nina') } }],
    });
    TestBed.inject(HttpClient);
    ctrl = TestBed.inject(HttpTestingController);
    queue = TestBed.inject(OfflineQueue);
  }

  it('sends oldest first and stops at a server error, leaving the rest queued', async () => {
    setup();
    queue.enqueue({ id: 'one', method: 'POST', url, body: { n: 1 }, label: 'Vitals reading' });
    queue.enqueue({ id: 'two', method: 'POST', url, body: { n: 2 }, label: 'Vitals reading' });
    const done = queue.flush();
    const first = ctrl.expectOne(url);
    expect(first.request.headers.get('Idempotency-Key')).toBe('one');
    first.flush({}, { status: 503, statusText: 'Unavailable' });
    await done;
    ctrl.expectNone(url);
    expect(queue.waiting()).toBe(2);
    expect(queue.failed().length).toBe(0);
    expect(queue.synced()).toBe(0);
  });

  it('counts a sync that sent something so screens reload', async () => {
    setup();
    queue.enqueue({ id: 'one', method: 'POST', url, body: {}, label: 'Vitals reading' });
    const done = queue.flush();
    ctrl.expectOne(url).flush({});
    await done;
    expect(queue.synced()).toBe(1);
  });

  it('keeps a refused entry for the person, and discard removes it', async () => {
    setup();
    queue.enqueue({ id: 'bad', method: 'POST', url, body: {}, label: 'Vitals reading' });
    const done = queue.flush();
    ctrl.expectOne(url).flush({ message: 'Admission closed' }, { status: 409, statusText: 'Conflict' });
    await done;
    expect(queue.failed().length).toBe(1);
    expect(queue.waiting()).toBe(0);
    queue.discard('bad');
    expect(queue.entries().length).toBe(0);
    expect(localStorage.getItem('cac.offline.queue.v1')).toBe('[]');
  });

  it('survives damaged or non-list storage by starting empty', () => {
    setup('{not json');
    expect(queue.entries().length).toBe(0);
    setup('{"a":1}');
    expect(queue.entries().length).toBe(0);
  });

  it('clear removes only the signed-in person entries', () => {
    setup(JSON.stringify([{ id: 'x', method: 'POST', url, body: {}, label: 'n', savedAt: 't', owner: 'someone-else' }]));
    queue.enqueue({ id: 'mine', method: 'POST', url, body: {}, label: 'n' });
    queue.clear();
    const left = JSON.parse(localStorage.getItem('cac.offline.queue.v1')!);
    expect(left.map((e: { id: string }) => e.id)).toEqual(['x']);
  });
});
