import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import type { Session, User, AuthResponse, AuthTokenResponsePassword } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithPassword: (email: string, pass: string) => Promise<AuthTokenResponsePassword>;
  signUpNewUser: (email: string, pass: string) => Promise<AuthResponse>;
  signOut: () => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const initialLoadDone = useRef(false);

  useEffect(() => {
    // Attempt to get the session on initial load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      initialLoadDone.current = true;
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        // If loading was still true, it's now safe to set it to false
        if (!initialLoadDone.current) {
          setLoading(false);
          initialLoadDone.current = true;
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    session,
    loading,
    signInWithPassword: (email: string, pass: string) => supabase.auth.signInWithPassword({ email, password: pass }),
    signUpNewUser: (email: string, pass: string) => supabase.auth.signUp({
      email,
      password: pass,
      options: {
        // Explicitly set the redirect URL to fix verification link issues in development.
        emailRedirectTo: window.location.origin,
      }
    }),
    signOut: () => supabase.auth.signOut(),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};