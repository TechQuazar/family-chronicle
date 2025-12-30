// Auth context for managing user authentication state

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getAdapter } from '@/adapters';
import type { AuthSession, User } from '@/types/models';

interface AuthContextType {
  user: User | null;
  session: AuthSession | null;
  isLoading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const adapter = getAdapter();

    // Set up auth state listener
    const unsubscribe = adapter.auth.onAuthStateChange((newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    // Check for existing session
    adapter.auth.getCurrentSession().then(({ data }) => {
      setSession(data);
      setUser(data?.user ?? null);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    const adapter = getAdapter();
    const { error } = await adapter.auth.signUp({ email, password, displayName });
    if (error) {
      return { error: error.message };
    }
    return {};
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const adapter = getAdapter();
    const { error } = await adapter.auth.signIn({ email, password });
    if (error) {
      return { error: error.message };
    }
    return {};
  }, []);

  const signOut = useCallback(async () => {
    const adapter = getAdapter();
    await adapter.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
