import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from './supabase';
import { api } from './api';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

const PROVIDER_LABELS = { google: 'YouTube', youtube: 'YouTube', twitch: 'Twitch' };

async function fetchYouTubeChannel(accessToken) {
  try {
    const res = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const ch = data.items?.[0];
    if (!ch) return null;
    return {
      channelId: ch.id,
      channelUrl: `https://www.youtube.com/channel/${ch.id}`,
      channelTitle: ch.snippet?.title,
      channelAvatar: ch.snippet?.thumbnails?.default?.url || null,
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ytPermissionModal, setYtPermissionModal] = useState(false);
  const syncingRef = useRef(false);
  const mountedRef = useRef(true);
  const { addToast } = useToast();

  useEffect(() => {
    mountedRef.current = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mountedRef.current) return;
      setSession(session);
      if (session) syncUser(session);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mountedRef.current) return;
        setSession(session);
        // TOKEN_REFRESHED only updates the JWT — no need to re-sync user data,
        // which would cause unnecessary re-renders and UI flicker (e.g. AdminPage)
        if (event === 'TOKEN_REFRESHED') return;
        if (session) syncUser(session);
        else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  async function syncUser(session) {
    // Guard against concurrent calls (getSession + onAuthStateChange fire together)
    if (syncingRef.current) return;
    syncingRef.current = true;
    try {
      const pendingLink = sessionStorage.getItem('vtaxon_pending_link');

      const meta = session.user?.user_metadata || {};
      const loginProvider = sessionStorage.getItem('vtaxon_login_provider');
      const identities = session.user?.identities || [];

      // Fetch YouTube channel data BEFORE authCallback so first-time registration
      // can use the channel title as display_name instead of Google account name
      let ytChannel = null;
      const googleIdentity = identities.find(i => i.provider === 'google');
      if (googleIdentity && session.provider_token) {
        ytChannel = await fetchYouTubeChannel(session.provider_token);
      }
      // Show modal on fresh Google login if YouTube data couldn't be fetched.
      // Covers both: provider_token missing (getSession() race) and API failure
      // (user didn't grant youtube.readonly scope).
      if (!ytChannel && loginProvider === 'google' && googleIdentity) {
        setYtPermissionModal(true);
      }

      // Use YouTube channel title if available; for Twitch use nickname (display name),
      // not name/full_name which is the ASCII login name
      const isTwitchLogin = loginProvider === 'twitch';
      const displayName = ytChannel?.channelTitle
        || (isTwitchLogin ? (meta.nickname || meta.slug || meta.name) : (meta.full_name || meta.name))
        || 'Unnamed Vtuber';
      const avatarUrl = ytChannel?.channelAvatar
        || meta.avatar_url || meta.picture;

      try {
        await api.authCallback({
          display_name: displayName,
          avatar_url: avatarUrl,
          ...(pendingLink ? { link_token: pendingLink } : {}),
          ...(loginProvider ? { login_provider: loginProvider } : {}),
          ...(ytChannel?.channelAvatar ? { yt_avatar: true } : {}),
        });
      } catch (err) {
        if (err.data?.error === 'account_banned') {
          if (!mountedRef.current) return;
          addToast('此帳號已被停用，如有疑問請聯繫管理員', { duration: 8000 });
          await supabase.auth.signOut();
          setUser(null);
          setSession(null);
          return;
        }
        throw err;
      }
      if (!mountedRef.current) return;

      // Clear pending link regardless of outcome
      if (pendingLink) {
        sessionStorage.removeItem('vtaxon_pending_link');
      }

      // Sync OAuth identities to backend
      // Only create new accounts on fresh OAuth redirect (loginProvider set),
      // not on page refresh — prevents re-creating explicitly unlinked accounts
      const isFreshOAuth = !!loginProvider;

      if (identities.length > 0) {
        const syncBody = { identities, create_missing: isFreshOAuth };

        // Send provider_token so backend can store it for later refresh
        if (session.provider_token && loginProvider) {
          syncBody.provider_token = session.provider_token;
          syncBody.token_provider = loginProvider === 'google' ? 'youtube' : loginProvider;
        }

        // Attach YouTube channel data if available
        if (ytChannel) {
          syncBody.channel_url = ytChannel.channelUrl;
          syncBody.provider_for_url = 'youtube';
          syncBody.channel_display_name = ytChannel.channelTitle;
          if (ytChannel.channelAvatar) {
            syncBody.provider_avatar_url = ytChannel.channelAvatar;
            syncBody.avatar_for_provider = 'youtube';
          }
        }

        try {
          await api.syncOAuthAccounts(syncBody);
        } catch (err) {
          if (err.data?.error === 'account_banned') {
            if (!mountedRef.current) return;
            addToast('此帳號已被停用，如有疑問請聯繫管理員', { duration: 8000 });
            await supabase.auth.signOut();
            setUser(null);
            setSession(null);
            return;
          }
          console.error('Failed to sync OAuth accounts:', err);
        }
        if (!mountedRef.current) return;
      }

      // Detect auto-linked providers that are NOT yet bound in our backend.
      // Only show toast for providers that exist in Supabase identities but
      // have no oauth_accounts record (i.e. truly unbound).
      const providerMap = { google: 'youtube', twitch: 'twitch' };
      if (loginProvider && identities.length > 1) {
        try {
          const boundAccounts = await api.getMyOAuthAccounts();
          const boundProviders = new Set(boundAccounts.map(a => a.provider));
          const unbound = identities
            .map(i => providerMap[i.provider] || i.provider)
            .filter(p => p !== (providerMap[loginProvider] || loginProvider))
            .filter(p => !boundProviders.has(p));
          if (unbound.length > 0) {
            const labels = unbound.map(p => PROVIDER_LABELS[p] || p);
            addToast(
              `偵測到使用相同 Email 的 ${labels.join('、')} 帳號，可在編輯頁面中綁定`,
              { duration: 6000 },
            );
          }
        } catch {
          // Silently ignore — toast is non-critical
        }
      }

      // Clear login provider flag so page refresh won't re-create unlinked accounts
      if (loginProvider) {
        sessionStorage.removeItem('vtaxon_login_provider');
      }

      const userData = await api.getMe();
      if (!mountedRef.current) return;
      setUser(userData);
    } catch (err) {
      console.error('Failed to sync user:', err);
    } finally {
      syncingRef.current = false;
      if (mountedRef.current) setLoading(false);
    }
  }

  async function signInWithGoogle() {
    sessionStorage.setItem('vtaxon_login_provider', 'google');
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        scopes: 'https://www.googleapis.com/auth/youtube.readonly',
      },
    });
  }

  async function signInWithTwitch() {
    sessionStorage.setItem('vtaxon_login_provider', 'twitch');
    await supabase.auth.signInWithOAuth({
      provider: 'twitch',
      options: { redirectTo: window.location.origin },
    });
  }

  async function linkProvider(provider) {
    // Mark as fresh OAuth so sync will create the new account
    sessionStorage.setItem('vtaxon_login_provider', provider);
    // Obtain a signed link token before OAuth redirect.
    // If the new provider has a different email, Supabase creates a new
    // auth.users record. The backend verifies this token to securely map
    // the new auth ID back to the original VTaxon user.
    if (user) {
      try {
        const { link_token } = await api.createLinkToken();
        sessionStorage.setItem('vtaxon_pending_link', link_token);
      } catch (err) {
        console.error('Failed to create link token:', err);
        sessionStorage.removeItem('vtaxon_login_provider');
        alert('綁定準備失敗，請重試');
        return;
      }
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin + '/profile?tab=account',
        ...(provider === 'google'
          ? { scopes: 'https://www.googleapis.com/auth/youtube.readonly' }
          : {}),
      },
    });
    if (error) {
      console.error(`linkProvider(${provider}) failed:`, error.message);
      sessionStorage.removeItem('vtaxon_pending_link');
      alert(`綁定失敗：${error.message}`);
    }
  }

  async function unlinkProvider(identityId) {
    // unlinkIdentity may also 404 on older Supabase instances;
    // the backend DELETE /oauth-accounts endpoint handles app-level removal.
    try {
      const { error } = await supabase.auth.unlinkIdentity({ id: identityId });
      if (error) console.warn('unlinkIdentity failed (may be unsupported):', error.message);
    } catch (err) {
      console.warn('unlinkIdentity not available:', err.message);
    }
  }

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, []);

  const contextValue = useMemo(() => ({
    session, user, loading, setUser,
    signInWithGoogle, signInWithTwitch, signOut,
    linkProvider, unlinkProvider,
    ytPermissionFailed: ytPermissionModal,
  }), [session, user, loading, signOut, ytPermissionModal]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
