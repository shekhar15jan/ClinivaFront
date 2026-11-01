import { APIRequestContext, Page, expect } from '@playwright/test';

/**
 * Helpers for the live specs that cross the line between Cliniva and CloudSuite (plan and billing, support access,
 * oversight, subscription state). Same environment variables as helpers.ts; no secret is ever printed.
 */
export const CLOUDSUITE = process.env.CLOUDSUITE_API || 'http://localhost:8081/api/v1';
export const CLINIVA = process.env.CLINIVA_API || 'http://localhost:8080/api/v1';
const OPERATOR_EMAIL = process.env.CLOUDSUITE_ADMIN_EMAIL || 'admin@codeatcloud.in';
const OPERATOR_PASSWORD = process.env.CLOUDSUITE_ADMIN_PASSWORD || 'admin';

/** CloudSuite wraps most answers as { success, data }; the support-access and oversight endpoints answer the bare JSON. */
export function unwrap<T = any>(body: any): T {
  return body && typeof body === 'object' && 'success' in body && 'data' in body ? body.data : body;
}

/** Signs the CloudSuite platform super admin in over the API (the same account provisionTenant uses). */
export async function operatorToken(request: APIRequestContext): Promise<string> {
  const login = await request.post(`${CLOUDSUITE}/auth/login`, { data: { email: OPERATOR_EMAIL, password: OPERATOR_PASSWORD } });
  expect(login.ok(), 'CloudSuite operator sign-in').toBeTruthy();
  return (await login.json()).data.accessToken as string;
}

export interface CloudSuiteCall {
  status: number;
  body: any;
  text: string;
}

/** A small caller for CloudSuite with a bearer token; never throws on a non-2xx answer. */
export function cloudSuite(request: APIRequestContext, token?: string) {
  return async (method: string, path: string, data?: unknown): Promise<CloudSuiteCall> => {
    const res = await request.fetch(`${CLOUDSUITE}${path}`, {
      method,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      data,
    });
    const text = await res.text();
    let body: any = null;
    try { body = text ? JSON.parse(text) : null; } catch { body = null; }
    return { status: res.status(), body, text };
  };
}

/** A small caller for Cliniva with a bearer header value ("Bearer ..."); never throws on a non-2xx answer. */
export function cliniva(request: APIRequestContext, bearer?: string) {
  return async (method: string, path: string, data?: unknown): Promise<CloudSuiteCall> => {
    const res = await request.fetch(`${CLINIVA}${path}`, {
      method,
      headers: bearer ? { Authorization: bearer } : {},
      data,
    });
    const text = await res.text();
    let body: any = null;
    try { body = text ? JSON.parse(text) : null; } catch { body = null; }
    return { status: res.status(), body, text };
  };
}

/** The Authorization header the signed-in page sends to the clinic API (reloads the page to catch one). */
export async function bearerOf(page: Page): Promise<string> {
  const seen = page.waitForRequest((r) => r.url().includes('/api/v1/hms/') && !!r.headers()['authorization'], { timeout: 20000 });
  await page.reload();
  return (await seen).headers()['authorization'];
}

/** Collects the clinic-API calls a page makes that fail, and the page's script errors, for a "nothing broke" check. */
export function watchFailures(page: Page) {
  const failedCalls: string[] = [];
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on('response', (r) => {
    if (r.url().includes('/api/v1/') && r.status() >= 400) failedCalls.push(`${r.request().method()} ${r.url().split('/api/v1/')[1]} -> ${r.status()}`);
  });
  page.on('pageerror', (e) => pageErrors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  return { failedCalls, pageErrors, consoleErrors };
}

/** Product code of Cliniva in CloudSuite (provisionTenant looks the product up by this code). */
export const HMS_CODE = 'HMS';

/** The base URL the app is served from, with the trailing slash (so relative page.goto() paths resolve under /cliniva/ too). */
export function appBase(): string {
  const base = process.env.BASE_URL || 'http://localhost:4201';
  return base.endsWith('/') ? base : `${base}/`;
}
