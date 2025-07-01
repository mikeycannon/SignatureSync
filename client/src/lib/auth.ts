import { type AuthTokenPayload } from "@shared/schema";

const TOKEN_KEY = "auth_token";

export class AuthManager {
  private static instance: AuthManager;
  private token: string | null = null;
  private user: any = null;
  private tenant: any = null;

  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem(TOKEN_KEY);
    }
  }

  setAuth(token: string, user: any, tenant: any) {
    this.token = token;
    this.user = user;
    this.tenant = tenant;
    
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, token);
    }
  }

  clearAuth() {
    this.token = null;
    this.user = null;
    this.tenant = null;
    
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  getToken(): string | null {
    return this.token;
  }

  getUser() {
    return this.user;
  }

  getTenant() {
    return this.tenant;
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  getAuthHeaders() {
    return this.token ? { Authorization: `Bearer ${this.token}` } : {};
  }

  async refreshUserData(): Promise<{ user: any; tenant: any } | null> {
    if (!this.token) return null;

    try {
      const response = await fetch("/api/auth/me", {
        headers: this.getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        this.user = data.user;
        this.tenant = data.tenant;
        return data;
      } else {
        this.clearAuth();
        return null;
      }
    } catch (error) {
      this.clearAuth();
      return null;
    }
  }
}

export const auth = AuthManager.getInstance();
