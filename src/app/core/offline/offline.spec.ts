import { HttpClient, provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '../services/auth.service';
import { OfflineInterceptor } from './offline.interceptor';
import { OfflineQueue, ownerOf } from './offline-queue.service';

describe('offline queue (PLAT-51)', () => {
  let http: HttpClient;
  let ctrl: HttpTestingController;
  let queue: OfflineQueue;
  let token: string | null;
  const jwt = (sub: string) => `h.${btoa(JSON.stringify({ sub }))}.s`;
  const url = 'http://x.test/api/v1/hms/consultations';

  function setOnline(value: boolean): void {
    Object.defineProperty(window.navigator, 'onLine', { value, configurable: true });
  }

  beforeEach(() => {
    localStorage.clear();
    token = jwt('alice');
    setOnline(true);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: HTTP_INTERCEPTORS, useClass: OfflineInterceptor, multi: true },
        { provide: AuthService, useValue: { getToken: () => token } },
      ],
    });
    http = TestBed.inject(HttpClient);
    ctrl = TestBed.inject(HttpTestingController);
    queue = TestBed.inject(OfflineQueue);
  });

  afterEach(() => setOnline(true));

  it('adds an Idempotency-Key to a queueable write', () => {
    http.post(url, { a: 1 }).subscribe();
    const req = ctrl.expectOne(url);
    expect(req.request.headers.get('Idempotency-Key')).toBeTruthy();
    req.flush({});
  });

  it('keeps the write and answers 202 when offline, then sends it with the same key when back online', async () => {
    setOnline(false);
    let answer: { queued?: boolean } | null = null;
    http.post<{ queued?: boolean }>(url, { a: 1 }).subscribe((r) => (answer = r));
    ctrl.expectNone(url);
    expect(answer).not.toBeNull();
    expect(answer!.queued).toBe(true);
    expect(queue.waiting()).toBe(1);
    const key = queue.entries()[0].id;

    setOnline(true);
    const done = queue.flush();
    const replay = ctrl.expectOne(url);
    expect(replay.request.headers.get('Idempotency-Key')).toBe(key);
    expect(replay.request.headers.has('X-Offline-Replay')).toBe(false);
    replay.flush({ ok: true });
    await done;
    expect(queue.waiting()).toBe(0);
  });

  it('queues a write whose request never reached the server (status 0)', () => {
    http.post(url, { a: 1 }).subscribe({ error: () => undefined });
    ctrl.expectOne(url).error(new ProgressEvent('error'), { status: 0 });
    expect(queue.waiting()).toBe(1);
  });

  it('does not queue a write the server refused; a refused replay waits for the person', async () => {
    http.post(url, { a: 1 }).subscribe({ error: () => undefined });
    ctrl.expectOne(url).flush({ message: 'No' }, { status: 400, statusText: 'Bad Request' });
    expect(queue.waiting()).toBe(0);

    queue.enqueue({ id: 'k1', method: 'POST', url, body: {}, label: 'Entry' });
    const done = queue.flush();
    ctrl.expectOne(url).flush({ message: 'Closed account' }, { status: 400, statusText: 'Bad Request' });
    await done;
    expect(queue.failed().length).toBe(1);
    expect(queue.failed()[0].error).toBe('Closed account');
  });

  it('sends an entry only when the person who saved it is signed in', async () => {
    queue.enqueue({ id: 'a1', method: 'POST', url, body: {}, label: 'Entry' });
    expect(queue.waiting()).toBe(1);

    token = jwt('bob');
    await queue.flush();
    ctrl.expectNone(url);
    expect(queue.waiting()).toBe(0);

    token = jwt('alice');
    const done = queue.flush();
    ctrl.expectOne(url).flush({});
    await done;
    expect(queue.waiting()).toBe(0);
    expect(localStorage.getItem('cac.offline.queue.v1')).toBe('[]');
  });

  it('reads the person from a sign-in token', () => {
    expect(ownerOf(jwt('u-1'))).toBe('u-1');
    expect(ownerOf('garbage')).toBeNull();
    expect(ownerOf(null)).toBeNull();
  });

  it('never queues a write that is not in the list', () => {
    setOnline(false);
    http.post('http://x.test/api/v1/auth/login', {}).subscribe({ error: () => undefined });
    ctrl.expectOne('http://x.test/api/v1/auth/login');
    expect(queue.entries().length).toBe(0);
  });
});
