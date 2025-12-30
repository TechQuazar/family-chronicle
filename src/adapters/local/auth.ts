// Local/mock authentication adapter

import type { AuthAdapter } from '@/adapters/types';
import type { AuthCredentials, AuthSession, User, ApiResponse } from '@/types/models';
import { getFromStorage, setToStorage, removeFromStorage, generateId } from './storage';

const USERS_KEY = 'users';
const SESSION_KEY = 'session';

interface StoredUser extends User {
  passwordHash: string;
}

// Simple hash function for demo purposes - NOT secure for production
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

let authChangeCallbacks: ((session: AuthSession | null) => void)[] = [];

function notifyAuthChange(session: AuthSession | null): void {
  authChangeCallbacks.forEach(cb => cb(session));
}

export const localAuthAdapter: AuthAdapter = {
  async signUp({ email, password, displayName }): Promise<ApiResponse<AuthSession>> {
    const users = getFromStorage<StoredUser[]>(USERS_KEY) || [];
    
    // Check if user exists
    if (users.some(u => u.email === email)) {
      return { error: { code: 'USER_EXISTS', message: 'An account with this email already exists' } };
    }

    const now = new Date();
    const newUser: StoredUser = {
      id: generateId(),
      email,
      displayName,
      passwordHash: simpleHash(password),
      createdAt: now,
      updatedAt: now,
    };

    users.push(newUser);
    setToStorage(USERS_KEY, users);

    const session: AuthSession = {
      user: {
        id: newUser.id,
        email: newUser.email,
        displayName: newUser.displayName,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      },
      token: generateId(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    };

    setToStorage(SESSION_KEY, session);
    notifyAuthChange(session);

    return { data: session };
  },

  async signIn({ email, password }): Promise<ApiResponse<AuthSession>> {
    const users = getFromStorage<StoredUser[]>(USERS_KEY) || [];
    const user = users.find(u => u.email === email);

    if (!user || user.passwordHash !== simpleHash(password)) {
      return { error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } };
    }

    const session: AuthSession = {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token: generateId(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };

    setToStorage(SESSION_KEY, session);
    notifyAuthChange(session);

    return { data: session };
  },

  async signOut(): Promise<ApiResponse<void>> {
    removeFromStorage(SESSION_KEY);
    notifyAuthChange(null);
    return { data: undefined };
  },

  async getCurrentSession(): Promise<ApiResponse<AuthSession | null>> {
    const session = getFromStorage<AuthSession>(SESSION_KEY);
    
    if (!session) {
      return { data: null };
    }

    // Check if session expired
    if (new Date(session.expiresAt) < new Date()) {
      removeFromStorage(SESSION_KEY);
      return { data: null };
    }

    return { data: session };
  },

  onAuthStateChange(callback: (session: AuthSession | null) => void): () => void {
    authChangeCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      authChangeCallbacks = authChangeCallbacks.filter(cb => cb !== callback);
    };
  },
};
