/**
 * axiosInstance.test.js
 *
 * Unit tests for the axiosInstance Axios configuration:
 *  1. Request interceptor attaches Bearer token from authStateRef.accessToken
 *  2. Retry-once on 401 — calls refreshAccessToken, retries with new token
 *  3. _retry guard prevents infinite loop when retry also returns 401
 *  4. Redirect to /login when refreshAccessToken throws (refresh failure)
 */

import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

// ---------------------------------------------------------------------------
// vi.hoisted ensures mockAuthStateRef is initialised BEFORE vi.mock hoisting
// ---------------------------------------------------------------------------
const mockAuthStateRef = vi.hoisted(() => ({
  accessToken: null,
  refreshAccessToken: vi.fn(),
  logout: vi.fn(),
}));

vi.mock('../context/AuthContext', () => ({
  authStateRef: mockAuthStateRef,
}));

// Import AFTER the mock is registered
import axiosInstance from './axiosInstance';

// ---------------------------------------------------------------------------
// MSW server — intercepts actual HTTP requests made by axios
// ---------------------------------------------------------------------------
const BASE = 'http://localhost:5000';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());
afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
  mockAuthStateRef.accessToken = null;
});

// ---------------------------------------------------------------------------
// Test 1 — Request interceptor attaches Bearer token
// ---------------------------------------------------------------------------
describe('Request interceptor', () => {
  it('attaches Authorization header when accessToken is set', async () => {
    mockAuthStateRef.accessToken = 'my-token';

    let capturedAuthHeader;

    server.use(
      http.get(`${BASE}/api/test`, ({ request }) => {
        capturedAuthHeader = request.headers.get('Authorization');
        return HttpResponse.json({ ok: true }, { status: 200 });
      }),
    );

    await axiosInstance.get('/api/test');

    expect(capturedAuthHeader).toBe('Bearer my-token');
  });

  it('does NOT attach Authorization header when accessToken is null', async () => {
    mockAuthStateRef.accessToken = null;

    let capturedAuthHeader = 'not-set';

    server.use(
      http.get(`${BASE}/api/test`, ({ request }) => {
        capturedAuthHeader = request.headers.get('Authorization');
        return HttpResponse.json({ ok: true }, { status: 200 });
      }),
    );

    await axiosInstance.get('/api/test');

    expect(capturedAuthHeader).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Test 2 — Retry-once on 401
// ---------------------------------------------------------------------------
describe('Response interceptor — 401 retry', () => {
  it('calls refreshAccessToken on 401 and retries with the new token', async () => {
    mockAuthStateRef.accessToken = 'old-token';

    // Simulate what the real refreshAccessToken does: update authStateRef.accessToken
    // so the request interceptor picks up the new token on the retry.
    mockAuthStateRef.refreshAccessToken.mockImplementationOnce(async () => {
      mockAuthStateRef.accessToken = 'new-token';
      return 'new-token';
    });

    let requestCount = 0;
    const capturedHeaders = [];

    server.use(
      http.get(`${BASE}/api/protected`, ({ request }) => {
        requestCount++;
        capturedHeaders.push(request.headers.get('Authorization'));

        // First call → 401; second call (retry) → 200
        if (requestCount === 1) {
          return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        return HttpResponse.json({ data: 'secret' }, { status: 200 });
      }),
    );

    const response = await axiosInstance.get('/api/protected');

    expect(mockAuthStateRef.refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);
    expect(response.data).toEqual({ data: 'secret' });

    // Original request used old token; retry used new token
    expect(capturedHeaders[0]).toBe('Bearer old-token');
    expect(capturedHeaders[1]).toBe('Bearer new-token');
  });
});

// ---------------------------------------------------------------------------
// Test 3 — _retry guard prevents infinite loop
// ---------------------------------------------------------------------------
describe('Response interceptor — _retry guard', () => {
  it('does NOT call refreshAccessToken a second time when the retry also returns 401', async () => {
    mockAuthStateRef.accessToken = 'old-token';
    mockAuthStateRef.refreshAccessToken.mockResolvedValueOnce('new-token');

    // Both the original request AND the retry return 401
    server.use(
      http.get(`${BASE}/api/protected`, () => {
        return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }),
    );

    await expect(axiosInstance.get('/api/protected')).rejects.toMatchObject({
      response: { status: 401 },
    });

    // refreshAccessToken should have been called exactly once (for the first 401),
    // not again for the retried 401 — the _retry flag stops re-entry.
    expect(mockAuthStateRef.refreshAccessToken).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Test 4 — Redirect to /login on refresh failure
// ---------------------------------------------------------------------------
describe('Response interceptor — refresh failure', () => {
  it('calls logout and redirects to /login when refreshAccessToken throws', async () => {
    mockAuthStateRef.accessToken = 'old-token';
    mockAuthStateRef.refreshAccessToken.mockRejectedValueOnce(new Error('Refresh token expired'));
    mockAuthStateRef.logout.mockResolvedValueOnce(undefined);

    // jsdom doesn't support navigation, so window.location.href assignment throws.
    // Replace window.location with a plain object that has a working href setter
    // AND a valid origin so Axios URL construction keeps working.
    let capturedHref = '';

    // Build a mock location object that mimics a real Location with all fields
    // that Axios or jsdom might read when resolving URLs.
    const mockLocation = {
      href: 'http://localhost/',
      origin: 'http://localhost',
      protocol: 'http:',
      host: 'localhost',
      hostname: 'localhost',
      port: '',
      pathname: '/',
      search: '',
      hash: '',
      assign: vi.fn(),
      replace: vi.fn(),
      reload: vi.fn(),
      toString: () => 'http://localhost/',
    };

    // Use a Proxy to intercept href assignment
    const locationProxy = new Proxy(mockLocation, {
      set(target, prop, value) {
        if (prop === 'href') capturedHref = value;
        target[prop] = value;
        return true;
      },
    });

    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: locationProxy,
    });

    server.use(
      http.get(`${BASE}/api/protected`, () => {
        return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }),
    );

    let thrownError;
    try {
      await axiosInstance.get('/api/protected');
    } catch (e) {
      thrownError = e;
    }

    // Restore window.location before asserting so other code is unaffected
    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: { href: '' },
    });

    expect(thrownError).toBeDefined();
    expect(thrownError.message).toBe('Refresh token expired');
    expect(mockAuthStateRef.logout).toHaveBeenCalledTimes(1);
    expect(capturedHref).toBe('/login');
  });
});
