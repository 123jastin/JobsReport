import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  isAdmin: boolean;
  login: (passcode: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem('jr_admin_auth') === 'true';
  });

  const login = (passcode: string): boolean => {
    // Elegant, straightforward admin login with default passcode 'admin' or 'admin123'
    if (passcode.trim().toLowerCase() === 'admin' || passcode.trim() === 'admin123') {
      setIsAdmin(true);
      localStorage.setItem('jr_admin_auth', 'true');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAdmin(false);
    localStorage.removeItem('jr_admin_auth');
  };

  return (
    <AuthContext.Provider value={{ isAdmin, login, logout }}>
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
