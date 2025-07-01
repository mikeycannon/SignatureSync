import { useState, useEffect } from "react";
import { auth } from "@/lib/auth";

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(auth.isAuthenticated());
  const [user, setUser] = useState(auth.getUser());
  const [tenant, setTenant] = useState(auth.getTenant());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (auth.isAuthenticated() && !user) {
        const userData = await auth.refreshUserData();
        if (userData) {
          setUser(userData.user);
          setTenant(userData.tenant);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [user]);

  const login = async (email: string, password: string) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      const data = await response.json();
      auth.setAuth(data.token, data.user, data.tenant);
      setUser(data.user);
      setTenant(data.tenant);
      setIsAuthenticated(true);
      return { success: true };
    } else {
      const error = await response.json();
      return { success: false, error: error.error };
    }
  };

  const register = async (registrationData: any) => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(registrationData),
    });

    if (response.ok) {
      const data = await response.json();
      auth.setAuth(data.token, data.user, data.tenant);
      setUser(data.user);
      setTenant(data.tenant);
      setIsAuthenticated(true);
      return { success: true };
    } else {
      const error = await response.json();
      return { success: false, error: error.error };
    }
  };

  const logout = () => {
    auth.clearAuth();
    setUser(null);
    setTenant(null);
    setIsAuthenticated(false);
  };

  return {
    isAuthenticated,
    user,
    tenant,
    isLoading,
    login,
    register,
    logout,
  };
}
