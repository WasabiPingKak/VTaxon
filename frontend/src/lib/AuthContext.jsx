import { createContext, useContext, useEffect, useRef, useState } from 'react';
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
  const syncingRef = useRef(false);
  const { addToast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) syncUser(session);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session) syncUser(session);
        else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function syncUser(session) {
    // Guard against concurrent calls (getSession + onAuthStateChange fire together)
    if (syncingRef.current) return;
    syncingRef.current = true;
    try {
      const pendingLink = localStorage.getItem('vtaxon_pending_link');

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

      // Use YouTube channel title if available, otherwise fall back to Google name
      const displayName = ytChannel?.channelTitle
        || meta.full_name || meta.name || 'Unnamed Vtuber';
      const avatarUrl = ytChannel?.channelAvatar
        || meta.avatar_url || meta.picture;

      await api.authCallback({
        display_name: displayName,
        avatar_url: avatarUrl,
        ...(pendingLink ? { link_to_user_id: pendingLink } : {}),
        ...(loginProvider ? { login_provider: loginProvider } : {}),
      });

      // Clear pending link regardless of outcome
      if (pendingLink) {
        localStorage.removeItem('vtaxon_pending_link');
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
          console.error('Failed to sync OAuth accounts:', err);
        }
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
      setUser(userData);
    } catch (err) {
      console.error('Failed to sync user:', err);
    } finally {
      syncingRef.current = false;
      setLoading(false);
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
    // Save current VTaxon user ID before OAuth redirect.
    // If the new provider has a different email, Supabase creates a new
    // auth.users record. The backend uses this to create an alias mapping
    // the new auth ID back to the original VTaxon user.
    if (user) {
      localStorage.setItem('vtaxon_pending_link', user.id);
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin + '/profile/edit',
        ...(provider === 'google'
          ? { scopes: 'https://www.googleapis.com/auth/youtube.readonly' }
          : {}),
      },
    });
    if (error) {
      console.error(`linkProvider(${provider}) failed:`, error.message);
      localStorage.removeItem('vtaxon_pending_link');
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

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }

  return (
    <AuthContext.Provider value={{
      session, user, loading, setUser,
      signInWithGoogle, signInWithTwitch, signOut,
      linkProvider, unlinkProvider,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
