import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, mockAuth } from '../data/auth/mockData';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role: 'buyer' | 'seller', phone: string, phoneVerified: boolean) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing auth data on app load
    const initAuth = async () => {
      try {
        const savedToken = localStorage.getItem('auth-token');
        const savedUser = localStorage.getItem('auth-user');

        if (savedToken && savedUser) {
          // Verify token is still valid
          const currentUser = await mockAuth.getCurrentUser(savedToken);
          
          if (currentUser) {
            setUser(currentUser);
            setToken(savedToken);
          } else {
            // Token invalid, clear storage
            localStorage.removeItem('auth-token');
            localStorage.removeItem('auth-user');
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        localStorage.removeItem('auth-token');
        localStorage.removeItem('auth-user');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const result = await mockAuth.login({ email, password });
      setUser(result.user);
      setToken(result.token);
      localStorage.setItem('auth-token', result.token);
      localStorage.setItem('auth-user', JSON.stringify(result.user));
    } catch (error) {
      throw error;
    }
  };

  const signup = async (email: string, password: string, name: string, role: 'buyer' | 'seller', phone: string, phoneVerified: boolean) => {
    try {
      const result = await mockAuth.signup({ email, password, name, role, phone, phoneVerified });
      setUser(result.user);
      setToken(result.token);
      localStorage.setItem('auth-token', result.token);
      localStorage.setItem('auth-user', JSON.stringify(result.user));
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await mockAuth.logout();
      setUser(null);
      setToken(null);
      localStorage.removeItem('auth-token');
      localStorage.removeItem('auth-user');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    signup,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
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