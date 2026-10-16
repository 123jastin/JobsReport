import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// ============================================================
// TYPES
// ============================================================
export interface PublicUser {
  id: string;
  name: string;
  username?: string | null;
  email: string;
  profile_image_url?: string | null;
  bio?: string | null;
  country?: string | null;
  role: 'user' | 'creator' | 'admin';
  is_verified?: number;
  created_at?: string | null;
}

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  username?: string;
  country?: string;
}

interface UserAuthContextType {
  user: PublicUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; message: string }>;
  register: (input: RegisterInput) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

// ============================================================
// STORAGE KEYS — separate from admin so they never collide
// ============================================================
const TOKEN_KEY = 'jobsreport_token';
const USER_KEY = 'jobsreport_user';
const EXPIRY_KEY = 'jobsreport_expiry';

const safeGet = (key: string): string | null => {
  try { return localStorage.getItem(key); } catch { return null; }
};
const safeSet = (key: string, value: string): void => {
  try { localStorage.setItem(key, value); } catch {}
};
const safeRemove = (key: string): void => {
  try { localStorage.removeItem(key); } catch {}
};

export const getUserToken = (): string | null => safeGet(TOKEN_KEY);

// ============================================================
// CONTEXT
// ============================================================
const UserAuthContext = createContext<UserAuthContextType | undefined>(undefined);

export function UserAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const clearStorage = () => {
    safeRemove(TOKEN_KEY);
    safeRemove(USER_KEY);
    safeRemove(EXPIRY_KEY);
  };

  const persistSession = (u: PublicUser, token: string, rememberMe: boolean) => {
    safeSet(USER_KEY, JSON.stringify(u));
    safeSet(TOKEN_KEY, token);
    if (rememberMe) {
      const expiry = Date.now() + 30 * 24 * 60 * 60 * 1000;
      safeSet(EXPIRY_KEY, String(expiry));
    } else {
      safeRemove(EXPIRY_KEY);
    }
  };

  // ---------------------------------------------------------
  // Session restore on mount
  // ---------------------------------------------------------
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedUser = safeGet(USER_KEY);
        const storedToken = safeGet(TOKEN_KEY);
        const storedExpiry = safeGet(EXPIRY_KEY);

        if (storedExpiry) {
          const expiryTime = parseInt(storedExpiry, 10);
          if (!Number.isNaN(expiryTime) && Date.now() > expiryTime) {
            clearStorage();
            setLoading(false);
            return;
          }
        }

        if (storedUser && storedToken) {
          try {
            const parsed: PublicUser = JSON.parse(storedUser);
            setUser(parsed);
          } catch {
            clearStorage();
            setLoading(false);
            return;
          }

          try {
            const res = await fetch('/api/auth/user/me', {
              headers: { Authorization: `Bearer ${storedToken}` },
            });
            if (res.ok) {
              const data = await res.json();
              if (data?.user) {
                setUser(data.user);
                safeSet(USER_KEY, JSON.stringify(data.user));
              }
            } else if (res.status === 401) {
              clearStorage();
              setUser(null);
            }
          } catch {
            // keep cached session on network error
          }
        }
      } catch (err) {
        console.error('User session restore failed:', err);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  // ---------------------------------------------------------
  // LOGIN
  // ---------------------------------------------------------
  const login = useCallback(async (
    email: string,
    password: string,
    rememberMe: boolean = true
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch('/api/auth/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data?.token && data?.user) {
        const u: PublicUser = data.user;
        setUser(u);
        persistSession(u, data.token, rememberMe);
        return { success: true, message: 'Login successful' };
      }

      return { success: false, message: data?.error || 'Invalid email or password' };
    } catch (err) {
      console.error('User login error:', err);
      return { success: false, message: 'Network error. Please try again.' };
    }
  }, []);

  // ---------------------------------------------------------
  // REGISTER
  // ---------------------------------------------------------
  const register = useCallback(async (
    input: RegisterInput
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch('/api/auth/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data?.token && data?.user) {
        const u: PublicUser = data.user;
        setUser(u);
        persistSession(u, data.token, true);
        return { success: true, message: 'Account created' };
      }

      return { success: false, message: data?.error || 'Registration failed' };
    } catch (err) {
      console.error('User register error:', err);
      return { success: false, message: 'Network error. Please try again.' };
    }
  }, []);

  // ---------------------------------------------------------
  // LOGOUT
  // ---------------------------------------------------------
  const logout = useCallback(() => {
    setUser(null);
    clearStorage();
  }, []);

  // ---------------------------------------------------------
  // REFRESH
  // ---------------------------------------------------------
  const refreshUser = useCallback(async () => {
    const token = safeGet(TOKEN_KEY);
    if (!token) return;
    try {
      const res = await fetch('/api/auth/user/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.user) {
          setUser(data.user);
          safeSet(USER_KEY, JSON.stringify(data.user));
        }
      } else if (res.status === 401) {
        logout();
      }
    } catch {}
  }, [logout]);

  // ---------------------------------------------------------
  // Auto-check expiry
  // ---------------------------------------------------------
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      const expiry = safeGet(EXPIRY_KEY);
      if (expiry) {
        const t = parseInt(expiry, 10);
        if (!Number.isNaN(t) && Date.now() > t) {
          logout();
        }
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, [user, logout]);

  return (
    <UserAuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </UserAuthContext.Provider>
  );
}

export function useUserAuth() {
  const ctx = useContext(UserAuthContext);
  if (ctx === undefined) {
    throw new Error('useUserAuth must be used within a UserAuthProvider');
  }
  return ctx;
}
