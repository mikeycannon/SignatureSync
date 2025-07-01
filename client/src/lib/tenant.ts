import { auth } from "./auth";

export interface TenantContextData {
  id: number;
  name: string;
  slug: string;
  plan: string;
}

export class TenantManager {
  private static instance: TenantManager;
  private currentTenant: TenantContextData | null = null;

  static getInstance(): TenantManager {
    if (!TenantManager.instance) {
      TenantManager.instance = new TenantManager();
    }
    return TenantManager.instance;
  }

  setTenant(tenant: TenantContextData) {
    this.currentTenant = tenant;
  }

  getTenant(): TenantContextData | null {
    return this.currentTenant || auth.getTenant();
  }

  getTenantId(): number | null {
    const tenant = this.getTenant();
    return tenant?.id || null;
  }

  requireTenantId(): number {
    const tenantId = this.getTenantId();
    if (!tenantId) {
      throw new Error("Tenant context is required");
    }
    return tenantId;
  }

  isTenantAdmin(): boolean {
    const user = auth.getUser();
    return user?.role === "admin";
  }

  canManageUsers(): boolean {
    return this.isTenantAdmin();
  }

  canManageTemplates(): boolean {
    // All authenticated users can manage templates within their tenant
    return !!auth.isAuthenticated();
  }

  canUploadAssets(): boolean {
    return !!auth.isAuthenticated();
  }

  getTenantBasedRoute(route: string): string {
    const tenant = this.getTenant();
    if (tenant) {
      return `/${tenant.slug}${route}`;
    }
    return route;
  }
}

export const tenantManager = TenantManager.getInstance();
