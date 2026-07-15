import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { authApi, type AuthUser, type LoginCredentials, type SignupCredentials, type Membership, type AuthResponse } from '@/api/auth';
import { permissionsApi } from '@/api/permissions';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  permissions: string[];
  hasPermission: (permission: string) => boolean;
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  signup: (credentials: SignupCredentials) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  setAuthSession: (token: string, user: AuthUser) => void;
  updateUser: (userData: AuthUser) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch {
        localStorage.removeItem('user');
      }
    }
    return null;
  });
  const [token, setToken] = useState<string | null>(() => {
    const savedToken = localStorage.getItem('access_token');
    if (!savedToken) localStorage.removeItem('access_token');
    return savedToken || null;
  });
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token || !user) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
    }
    setIsLoading(false);
  }, [token, user]);

  useEffect(() => {
    if (token) {
      permissionsApi.getMyPermissions()
        .then((res) => {
          if (res.success && res.data) {
            setPermissions(res.data.permissions);
          }
        })
        .catch(console.error);
    } else {
      setPermissions([]);
    }
  }, [token]); // Reload permissions when token changes

  useEffect(() => {
    const handleUnauthorized = () => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
      setPermissions([]);
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const response = await authApi.login(credentials);
    if (response.success && response.data) {
      const { accessToken, user: userData } = response.data;
      setToken(accessToken);
      setUser(userData);
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('user', JSON.stringify(userData));
    }
    return response.data as AuthResponse;
  }, []);

  const signup = useCallback(async (credentials: SignupCredentials) => {
    const response = await authApi.signup(credentials);
    if (response.success && response.data) {
      const { accessToken, user: userData } = response.data;
      setToken(accessToken);
      setUser(userData);
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('user', JSON.stringify(userData));
    }
    return response.data as AuthResponse;
  }, []);


  const setAuthSession = useCallback((newToken: string, newUser: AuthUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('access_token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
    } finally {
      setToken(null);
      setUser(null);
      setPermissions([]);
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    }
  }, []);

  const hasPermission = useCallback((permission: string) => {
    if (user?.role === 'ADMIN' || user?.role === 'BUILDER') return true;
    return permissions.includes(permission);
  }, [permissions, user]);

  const updateUser = useCallback((userData: AuthUser) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        permissions,
        hasPermission,
        login,
        signup,
        logout,
        setAuthSession,
        updateUser,
      }}
    >
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
