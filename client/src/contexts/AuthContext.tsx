import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiRequest } from '@/lib/queryClient';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  title?: string;
  department?: string;
}

export interface Tenant {
  id: number;
  name: string;
  domain: string;
  plan: string;
}

export interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
}

export interface RegisterData {
  organizationName: string;
  domain: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const ACCESS_TOKEN_KEY = 'access_token';
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiry

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    tenant: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Decode JWT to get expiry time
  const getTokenExpiry = (token: string): number | null => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000; // Convert to milliseconds
    } catch {
      return null;
    }
  };

  // Check if token needs refresh
  const shouldRefreshToken = (token: string): boolean => {
    const expiry = getTokenExpiry(token);
    if (!expiry) return true;
    
    return Date.now() > (expiry - TOKEN_REFRESH_THRESHOLD);
  };

  // Store auth data
  const setAuthData = (data: {
    accessToken: string;
    user: User;
    tenant: Tenant;
  }) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
    
    setAuthState({
      user: data.user,
      tenant: data.tenant,
      accessToken: data.accessToken,
      isAuthenticated: true,
      isLoading: false,
    });
  };

  // Clear auth data
  const clearAuthData = () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    
    setAuthState({
      user: null,
      tenant: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  // Refresh access token
  const refreshToken = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include', // Include httpOnly cookies
      });

      if (response.ok) {
        const data = await response.json();
        const currentUser = authState.user;
        const currentTenant = authState.tenant;
        
        if (currentUser && currentTenant) {
          setAuthData({
            accessToken: data.accessToken,
            user: currentUser,
            tenant: currentTenant,
          });
        }
        
        return true;
      }
      
      // Refresh failed, clear auth data
      clearAuthData();
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      clearAuthData();
      return false;
    }
  };

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      const data = await response.json();
      setAuthData({
        accessToken: data.accessToken,
        user: data.user,
        tenant: data.tenant,
      });
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Register function
  const register = async (registerData: RegisterData): Promise<void> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(registerData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Registration failed');
      }

      const data = await response.json();
      setAuthData({
        accessToken: data.accessToken,
        user: data.user,
        tenant: data.tenant,
      });
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: authState.accessToken ? {
          'Authorization': `Bearer ${authState.accessToken}`
        } : {},
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuthData();
    }
  };

  // Logout all devices
  const logoutAll = async (): Promise<void> => {
    try {
      await fetch('/api/auth/logout-all', {
        method: 'POST',
        credentials: 'include',
        headers: authState.accessToken ? {
          'Authorization': `Bearer ${authState.accessToken}`
        } : {},
      });
    } catch (error) {
      console.error('Logout all error:', error);
    } finally {
      clearAuthData();
    }
  };

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      
      if (!storedToken) {
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      // Check if token needs refresh
      if (shouldRefreshToken(storedToken)) {
        const refreshSuccess = await refreshToken();
        if (!refreshSuccess) {
          return; // Auth state already cleared by refreshToken
        }
      } else {
        // Token is still valid, verify with server
        try {
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${storedToken}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            setAuthData({
              accessToken: storedToken,
              user: data.user,
              tenant: data.tenant,
            });
          } else {
            clearAuthData();
          }
        } catch (error) {
          console.error('Auth verification failed:', error);
          clearAuthData();
        }
      }
    };

    initializeAuth();
  }, []);

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!authState.accessToken || !authState.isAuthenticated) {
      return;
    }

    const expiry = getTokenExpiry(authState.accessToken);
    if (!expiry) return;

    const timeUntilRefresh = expiry - Date.now() - TOKEN_REFRESH_THRESHOLD;
    
    if (timeUntilRefresh > 0) {
      const timeout = setTimeout(() => {
        refreshToken();
      }, timeUntilRefresh);

      return () => clearTimeout(timeout);
    }
  }, [authState.accessToken]);

  const contextValue: AuthContextType = {
    ...authState,
    login,
    register,
    logout,
    logoutAll,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};