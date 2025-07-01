import { tenantManager, type TenantContextData } from "@/lib/tenant";
import { useAuth } from "./use-auth";

export function useTenant() {
  const { tenant } = useAuth();

  const currentTenant: TenantContextData | null = tenant || tenantManager.getTenant();

  return {
    tenant: currentTenant,
    tenantId: currentTenant?.id || null,
    isAdmin: tenantManager.isTenantAdmin(),
    canManageUsers: tenantManager.canManageUsers(),
    canManageTemplates: tenantManager.canManageTemplates(),
    canUploadAssets: tenantManager.canUploadAssets(),
    getTenantBasedRoute: tenantManager.getTenantBasedRoute.bind(tenantManager),
  };
}
