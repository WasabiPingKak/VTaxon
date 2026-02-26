import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { api } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
    try {
      const meta = session.user?.user_metadata || {};
      await api.authCallback({
        display_name: meta.full_name || meta.name || 'Unnamed Vtuber',
        avatar_url: meta.avatar_url || meta.picture,
      });
      const userData = await api.getMe();
      setUser(userData);
    } catch (err) {
      console.error('Failed to sync user:', err);
    } finally {
      setLoading(false);
    }
  }

  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  }

  async function signInWithTwitch() {
    await supabase.auth.signInWithOAuth({
      provider: 'twitch',
      options: { redirectTo: window.location.origin },
    });
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
