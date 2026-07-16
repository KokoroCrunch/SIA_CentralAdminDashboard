import { render, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import AuthProvider, { useAuth } from './AuthContext';

// ── Helper: mount the provider and expose the context value ─────────────────
function renderAuthContext() {
  let contextValue;

  function Consumer() {
    contextValue = useAuth();
    return null;
  }

  render(
    <AuthProvider>
      <Consumer />
    </AuthProvider>,
  );

  return () => contextValue;
}

// ── Helpers to build Response objects ────────────────────────────────────────
function makeResponse(body, { ok = true, status = 200 } = {}) {
  return {
    ok,
    status,
    json: async () => body,
  };
}

describe('AuthContext', () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // ── login success ──────────────────────────────────────────────────────────
  it('login success: sets user and accessToken', async () => {
    fetchMock.mockResolvedValueOnce(
      makeResponse({
        success: true,
        data: {
          accessToken: 'tok123',
          user: { id: '1', name: 'Alice', email: 'a@b.com', role: 'admin' },
        },
        message: '',
      }),
    );

    const getCtx = renderAuthContext();

    await act(async () => {
      await getCtx().login({ email: 'a@b.com', password: 'secret' });
    });

    const ctx = getCtx();
    expect(ctx.user).toEqual({ id: '1', name: 'Alice', email: 'a@b.com', role: 'admin' });
    expect(ctx.accessToken).toBe('tok123');
    expect(ctx.error).toBeNull();
  });

  // ── login failure ──────────────────────────────────────────────────────────
  it('login failure: throws and sets error', async () => {
    fetchMock.mockResolvedValueOnce(
      makeResponse({ message: 'Invalid email or password' }, { ok: false, status: 401 }),
    );

    const getCtx = renderAuthContext();

    let thrownError;
    await act(async () => {
      try {
        await getCtx().login({ email: 'bad@b.com', password: 'wrong' });
      } catch (e) {
        thrownError = e;
      }
    });

    expect(thrownError).toBeDefined();
    expect(thrownError.message).toBe('Invalid email or password');
    expect(getCtx().error).toBe('Invalid email or password');
    expect(getCtx().user).toBeNull();
    expect(getCtx().accessToken).toBeNull();
  });

  // ── logout ────────────────────────────────────────────────────────────────
  it('logout: clears user and accessToken', async () => {
    // First, login so there is something to clear
    fetchMock.mockResolvedValueOnce(
      makeResponse({
        success: true,
        data: {
          accessToken: 'tok123',
          user: { id: '1', name: 'Alice', email: 'a@b.com', role: 'admin' },
        },
        message: '',
      }),
    );

    const getCtx = renderAuthContext();

    await act(async () => {
      await getCtx().login({ email: 'a@b.com', password: 'secret' });
    });

    // Confirm logged in
    expect(getCtx().user).not.toBeNull();

    // Mock the logout endpoint
    fetchMock.mockResolvedValueOnce(makeResponse({}, { ok: true, status: 200 }));

    await act(async () => {
      await getCtx().logout();
    });

    expect(getCtx().user).toBeNull();
    expect(getCtx().accessToken).toBeNull();
  });

  // ── refreshAccessToken ────────────────────────────────────────────────────
  it('refreshAccessToken: updates accessToken and returns new token', async () => {
    fetchMock.mockResolvedValueOnce(
      makeResponse({
        success: true,
        data: { accessToken: 'new-tok' },
      }),
    );

    const getCtx = renderAuthContext();

    let returnedToken;
    await act(async () => {
      returnedToken = await getCtx().refreshAccessToken();
    });

    expect(returnedToken).toBe('new-tok');
    expect(getCtx().accessToken).toBe('new-tok');
  });
});
