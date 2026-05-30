import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAdmin: boolean;
  user: { email: string; role: string; name?: string } | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [user, setUser] = useState<{ email: string; role: string; name?: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Check existing session on mount - ALWAYS restore if token exists
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Check localStorage for existing session
        const storedUser = localStorage.getItem('jr_admin_user');
        const storedToken = localStorage.getItem('jr_admin_token');
        
        if (storedUser && storedToken) {
          // Restore session immediately without API call first
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setIsAdmin(true);
          
          // Verify token in background (don't block UI)
          try {
            const response = await fetch('/api/auth/verify', {
              headers: {
                'Authorization': `Bearer ${storedToken}`
              }
            });
            
            if (!response.ok) {
              // Token expired but keep user logged in with stored data
              console.log('Token expired, using cached session');
            }
          } catch (err) {
            // Network error, keep using stored session
            console.log('Network error, using cached session');
          }
        }
      } catch (err) {
        console.error('Session check failed:', err);
      } finally {
        setLoading(false);
      }
    };
    
    checkSession();
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean = true): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, rememberMe })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const userData = {
          email: data.user.email,
          role: data.user.role,
          name: data.user.name
        };
        
        setUser(userData);
        setIsAdmin(true);
        
        // Always store in localStorage for persistent login
        localStorage.setItem('jr_admin_user', JSON.stringify(userData));
        localStorage.setItem('jr_admin_token', data.token);
        
        // If rememberMe is true, set long expiry (30 days)
        // localStorage doesn't have expiry, so we store a timestamp
        if (rememberMe) {
          const expiry = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 days
          localStorage.setItem('jr_admin_expiry', expiry.toString());
        } else {
          // Session only - clear on browser close
          localStorage.removeItem('jr_admin_expiry');
        }
        
        return { success: true, message: 'Login successful' };
      }
      
      return { success: false, message: data.message || 'Invalid credentials' };
    } catch (err) {
      console.error('Login error:', err);
      
      // Check if we have stored session to use offline
      const storedUser = localStorage.getItem('jr_admin_user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAdmin(true);
        return { success: true, message: 'Offline mode - using cached session' };
      }
      
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const logout = () => {
    setUser(null);
    setIsAdmin(false);
    localStorage.removeItem('jr_admin_user');
    localStorage.removeItem('jr_admin_token');
    localStorage.removeItem('jr_admin_expiry');
    
    // Optional: Call backend to invalidate token
    fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jr_admin_token')}`
      }
    }).catch(() => {});
  };

  // Auto-refresh session periodically
  useEffect(() => {
    if (!isAdmin) return;
    
    const refreshInterval = setInterval(() => {
      const expiry = localStorage.getItem('jr_admin_expiry');
      if (expiry) {
        const expiryTime = parseInt(expiry);
        if (Date.now() > expiryTime) {
          // Session expired
          logout();
        }
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(refreshInterval);
  }, [isAdmin]);

  return (
    <AuthContext.Provider value={{ isAdmin, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
