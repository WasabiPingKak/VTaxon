// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';

/* ─── Types ─── */

import { ApiError } from '../../types/api';
import type { User } from '../../types/models';

/* ─── Capture onAuthStateChange callback ─── */

type AuthCallback = (event: string, session: unknown) => void;
let authChangeCallback: AuthCallback | null = null;

/* ─── Mock supabase ─── */

const mockSignOut = vi.fn().mockResolvedValue({});
const mockSignInWithOAuth = vi.fn().mockResolvedValue({ error: null });
const mockGetSession = vi.fn();
const mockUnsubscribe = vi.fn();

vi.mock('../supabase', () => ({
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
      onAuthStateChange: (cb: AuthCallback) => {
        authChangeCallback = cb;
        return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
      },
      signInWithOAuth: (...args: unknown[]) => mockSignInWithOAuth(...args),
      signOut: (...args: unknown[]) => mockSignOut(...args),
    },
  },
}));

/* ─── Mock api ─── */

const mockAuthCallback = vi.fn();
const mockGetMe = vi.fn();
const mockSyncOAuthAccounts = vi.fn().mockResolvedValue([]);
const mockGetMyOAuthAccounts = vi.fn().mockResolvedValue([]);
const mockCreateLinkToken = vi.fn();

vi.mock('../api', () => ({
  api: {
    authCallback: (...args: unknown[]) => mockAuthCallback(...args),
    getMe: (...args: unknown[]) => mockGetMe(...args),
    syncOAuthAccounts: (...args: unknown[]) => mockSyncOAuthAccounts(...args),
    getMyOAuthAccounts: (...args: unknown[]) => mockGetMyOAuthAccounts(...args),
    createLinkToken: (...args: unknown[]) => mockCreateLinkToken(...args),
  },
}));

/* ─── Mock ToastContext ─── */

const mockAddToast = vi.fn();

vi.mock('../ToastContext', () => ({
  useToast: () => ({ addToast: mockAddToast }),
}));

/* ─── Mock fetch (for fetchYouTubeChannel) ─── */

function mockFetchYouTube(channel: { id: string; title: string } | null) {
  if (channel) {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        items: [{
          id: channel.id,
          snippet: { title: channel.title, thumbnails: { default: { url: 'https://avatar.url' } } },
        }],
      }),
    }) as unknown as typeof fetch;
  } else {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false, json: () => Promise.resolve({}),
    }) as unknown as typeof fetch;
  }
}

/* ─── Import AuthProvider after mocks ─── */

import { AuthProvider, useAuth } from '../AuthContext';

/* ─── Test helpers ─── */

const FAKE_USER: User = {
  id: 'user-1',
  display_name: 'TestVtuber',
  avatar_url: null,
  role: 'user',
  organization: null,
  bio: null,
  country_flags: [],
  social_links: {},
  primary_platform: null,
  profile_data: {},
  visibility: 'visible',
  visibility_reason: null,
  visibility_changed_at: null,
  visibility_changed_by: null,
  vtuber_declaration_at: null,
  appeal_note: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

function makeSession(overrides: Record<string, unknown> = {}) {
  return {
    access_token: 'test-jwt',
    user: {
      id: 'auth-uid-1',
      user_metadata: {},
      identities: [],
      ...overrides,
    },
    ...overrides,
  };
}

/** Renders AuthProvider with a consumer that displays context values for assertion. */
function TestConsumer() {
  const { user, loading } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user">{user ? user.display_name : 'null'}</span>
    </div>
  );
}

function renderAuth() {
  return render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>
  );
}

/* ─── Setup ─── */

beforeEach(() => {
  sessionStorage.clear();
  authChangeCallback = null;

  // Reset all mock call history & re-set default implementations
  mockSignOut.mockReset().mockResolvedValue({});
  mockSignInWithOAuth.mockReset().mockResolvedValue({ error: null });
  mockGetSession.mockReset();
  mockAuthCallback.mockReset();
  mockGetMe.mockReset();
  mockSyncOAuthAccounts.mockReset().mockResolvedValue([]);
  mockGetMyOAuthAccounts.mockReset().mockResolvedValue([]);
  mockCreateLinkToken.mockReset();
  mockAddToast.mockReset();

  // Default: no YouTube channel (prevent leak from previous test)
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: false, json: () => Promise.resolve({}),
  }) as unknown as typeof fetch;
});

/* ─── Tests ─── */

describe('AuthContext — syncUser integration', () => {
  it('Google 首次登入：建立帳號並設定 user 狀態', async () => {
    const session = makeSession({
      provider_token: 'google-token',
      user_metadata: { full_name: 'Google User', avatar_url: 'https://google.avatar' },
      identities: [{ provider: 'google', id: 'g-1' }],
    });
    mockGetSession.mockResolvedValue({ data: { session } });
    mockAuthCallback.mockResolvedValue(FAKE_USER);
    mockGetMe.mockResolvedValue(FAKE_USER);
    mockFetchYouTube({ id: 'UC123', title: 'My Channel' });

    sessionStorage.setItem('vtaxon_login_provider', 'google');

    renderAuth();

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('TestVtuber');
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    // authCallback should have been called with YouTube channel title as display_name
    expect(mockAuthCallback).toHaveBeenCalledTimes(1);
    const callBody = mockAuthCallback.mock.calls[0][0];
    expect(callBody.display_name).toBe('My Channel');
    expect(callBody.login_provider).toBe('google');
  });

  it('Twitch 首次登入：display_name 使用 nickname', async () => {
    const session = makeSession({
      user_metadata: {
        nickname: 'TestStreamer',
        name: 'teststreamer_ascii',
        full_name: 'Test Full Name',
      },
      identities: [{ provider: 'twitch', id: 't-1' }],
    });
    mockGetSession.mockResolvedValue({ data: { session } });
    mockAuthCallback.mockResolvedValue(FAKE_USER);
    mockGetMe.mockResolvedValue(FAKE_USER);

    sessionStorage.setItem('vtaxon_login_provider', 'twitch');

    renderAuth();

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('TestVtuber');
    });

    const callBody = mockAuthCallback.mock.calls[0][0];
    expect(callBody.display_name).toBe('TestStreamer');
    expect(callBody.login_provider).toBe('twitch');
  });

  it('link_token 殘留：callback 失敗後 sessionStorage 被清除', async () => {
    const session = makeSession({
      identities: [{ provider: 'google', id: 'g-1' }],
    });
    mockGetSession.mockResolvedValue({ data: { session } });
    mockAuthCallback.mockRejectedValue(
      new ApiError('Validation failed', 400, { error: 'invalid_or_expired_link_token' }),
    );

    sessionStorage.setItem('vtaxon_pending_link', 'stale-expired-token');

    renderAuth();

    await waitFor(() => {
      expect(sessionStorage.getItem('vtaxon_pending_link')).toBeNull();
    });
  });

  it('account_banned：signOut 並清除 user 狀態', async () => {
    const session = makeSession({
      identities: [{ provider: 'google', id: 'g-1' }],
    });
    mockGetSession.mockResolvedValue({ data: { session } });
    mockAuthCallback.mockRejectedValue(
      new ApiError('Forbidden', 403, { error: 'account_banned' }),
    );

    renderAuth();

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
      expect(screen.getByTestId('user').textContent).toBe('null');
    });

    expect(mockAddToast).toHaveBeenCalledWith(
      '此帳號已被停用，如有疑問請聯繫管理員',
      expect.objectContaining({ duration: 8000 }),
    );
  });

  it('無 session：loading 結束且 user 為 null', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    renderAuth();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
      expect(screen.getByTestId('user').textContent).toBe('null');
    });

    expect(mockAuthCallback).not.toHaveBeenCalled();
  });

  it('TOKEN_REFRESHED 事件不觸發 syncUser', async () => {
    // Initial: no session
    mockGetSession.mockResolvedValue({ data: { session: null } });

    renderAuth();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    // Simulate TOKEN_REFRESHED event
    const session = makeSession();
    await act(async () => {
      authChangeCallback?.('TOKEN_REFRESHED', session);
    });

    // authCallback should NOT have been called
    expect(mockAuthCallback).not.toHaveBeenCalled();
  });
});
