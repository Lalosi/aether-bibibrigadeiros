import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, type AppRole } from '@/integrations/supabase/client';
import { config } from '@/lib/config';

interface BypassUser {
  id: string;
  email: string;
  bypass: true;
}

interface AuthContextValue {
  user: User | BypassUser | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
  isBypass: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, nome: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const BYPASS_KEY = 'aether_bypass_session';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | BypassUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isBypass, setIsBypass] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchRole = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .order('role', { ascending: true });
    if (error || !data?.length) {
      setRole('funcionario');
      return;
    }
    // Highest privilege wins: master > admin > funcionario
    const priority: AppRole[] = ['master', 'admin', 'funcionario'];
    const found = priority.find((r) => data.some((d) => d.role === r));
    setRole(found ?? 'funcionario');
  }, []);

  useEffect(() => {
    // Restore bypass session if present
    const cached = localStorage.getItem(BYPASS_KEY);
    if (cached && config.presentationMode) {
      try {
        const parsed = JSON.parse(cached) as BypassUser & { role: AppRole };
        setUser({ id: parsed.id, email: parsed.email, bypass: true });
        setRole(parsed.role);
        setIsBypass(true);
      } catch {
        localStorage.removeItem(BYPASS_KEY);
      }
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        setUser(newSession.user);
        setIsBypass(false);
        localStorage.removeItem(BYPASS_KEY);
        setTimeout(() => {
          fetchRole(newSession.user.id);
        }, 0);
      } else if (!localStorage.getItem(BYPASS_KEY)) {
        setUser(null);
        setRole(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) {
        setUser(s.user);
        fetchRole(s.user.id);
      }
      setLoading(false);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [fetchRole]);

  const signIn = useCallback<AuthContextValue['signIn']>(async (email, password) => {
    // Bypass: presentation mode + magic password
    if (config.presentationMode && password === config.bypassPassword) {
      const bypassUser: BypassUser = {
        id: 'bypass-' + email,
        email,
        bypass: true,
      };
      setUser(bypassUser);
      setRole('master');
      setIsBypass(true);
      localStorage.setItem(
        BYPASS_KEY,
        JSON.stringify({ ...bypassUser, role: 'master' }),
      );
      return { error: null };
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signUp = useCallback<AuthContextValue['signUp']>(async (email, password, nome) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { nome },
      },
    });
    return { error: error?.message ?? null };
  }, []);

  const signOut = useCallback(async () => {
    localStorage.removeItem(BYPASS_KEY);
    setIsBypass(false);
    setRole(null);
    setUser(null);
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, session, role, loading, isBypass, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allow?: AppRole[];
}> = ({ children, allow }) => {
  const { user, role, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Carregando…
      </div>
    );
  }
  if (!user) {
    window.location.replace('/login');
    return null;
  }
  if (allow && role && !allow.includes(role)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 text-center">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Acesso negado</h1>
          <p className="text-muted-foreground">
            Sua função (<strong>{role}</strong>) não permite acessar esta página.
          </p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
};