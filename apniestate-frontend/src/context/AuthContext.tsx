import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { authApi, type AuthUser, type LoginCredentials, type Membership, type AuthResponse } from '@/api/auth';
import { permissionsApi } from '@/api/permissions';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  memberships: Membership[];
  activeWorkspace: { company: { id: string; name: string }; role: string } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  permissions: string[];
  hasPermission: (permission: string) => boolean;
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  signup: (credentials: LoginCredentials) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  setAuthSession: (token: string, user: AuthUser) => void;
  updateUser: (userData: AuthUser) => void;
  switchWorkspace: (companyId: string, role: string) => Promise<void>;
  restoreWorkspace: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<{ company: { id: string; name: string }; role: string } | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('access_token');
    const savedUser = localStorage.getItem('user');
    const savedMemberships = localStorage.getItem('memberships');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        
        if (savedMemberships) {
          const parsedMemberships = JSON.parse(savedMemberships);
          setMemberships(parsedMemberships);
          
          if (parsedUser.company_id) {
            const activeMem = parsedMemberships.find((m: Membership) => m.company_id === parsedUser.company_id);
            if (activeMem) {
              setActiveWorkspace({ company: activeMem.company, role: parsedUser.role });
            }
          }
        }
      } catch {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        localStorage.removeItem('memberships');
      }
    }
    setIsLoading(false);
  }, []);

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
  }, [token, activeWorkspace]); // Reload permissions when workspace changes

  useEffect(() => {
    const handleUnauthorized = () => {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      localStorage.removeItem('memberships');
      setToken(null);
      setUser(null);
      setMemberships([]);
      setActiveWorkspace(null);
      setPermissions([]);
      window.location.href = '/login';
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const response = await authApi.login(credentials);
    if (response.success && response.data) {
      const { accessToken, user: userData, memberships: mems } = response.data;
      setToken(accessToken);
      setUser(userData);
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      if (mems) {
        setMemberships(mems);
        localStorage.setItem('memberships', JSON.stringify(mems));
      }
    }
    return response.data as AuthResponse;
  }, []);

  const signup = useCallback(async (credentials: LoginCredentials) => {
    const response = await authApi.signup(credentials);
    if (response.success && response.data) {
      const { accessToken, user: userData, memberships: mems } = response.data;
      setToken(accessToken);
      setUser(userData);
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      if (mems) {
        setMemberships(mems);
        localStorage.setItem('memberships', JSON.stringify(mems));
      }
    }
    return response.data as AuthResponse;
  }, []);

  const restoreWorkspace = useCallback(async () => {
    if (!token) return false;
    try {
      const response = await authApi.restoreWorkspace();
      if (response.success && response.data) {
        if (response.data.restored && response.data.user && response.data.company) {
          const { accessToken, user: userData, company } = response.data;
          setToken(accessToken);
          setUser(userData);
          setActiveWorkspace({ company, role: userData.role });
          
          localStorage.setItem('access_token', accessToken);
          localStorage.setItem('user', JSON.stringify(userData));
          return true;
        }
      }
    } catch (e) {
      console.error("Workspace restoration failed", e);
    }
    return false;
  }, [token]);

  const switchWorkspace = useCallback(async (companyId: string, role: string) => {
    try {
      const response = await authApi.switchWorkspace(companyId, role);
      if (response.success && response.data) {
        const { user: updatedUser, accessToken } = response.data;
        setUser(updatedUser);
        setToken(accessToken);
        
        // Find company info from memberships
        const mem = memberships.find(m => m.company_id === companyId);
        if (mem) {
          setActiveWorkspace({ company: mem.company, role });
        }

        localStorage.setItem('user', JSON.stringify(updatedUser));
        localStorage.setItem('access_token', accessToken);
      }
    } catch (error) {
      console.error("Failed to switch workspace", error);
      throw error;
    }
  }, [memberships]);

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
      setMemberships([]);
      setActiveWorkspace(null);
      setPermissions([]);
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      localStorage.removeItem('memberships');
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
        memberships,
        activeWorkspace,
        isAuthenticated: !!token && !!user,
        isLoading,
        permissions,
        hasPermission,
        login,
        signup,
        logout,
        setAuthSession,
        updateUser,
        switchWorkspace,
        restoreWorkspace,
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
