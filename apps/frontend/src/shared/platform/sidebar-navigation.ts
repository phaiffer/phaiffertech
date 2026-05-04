import {
  hasAnyTenantEntitlement,
  hasTenantEntitlement,
  tenantEntitlementKeys
} from '@/shared/entitlements/tenant-entitlements';
import { hasAnyPermission } from '@/shared/permissions/has-permission';
import type {
  FrontendPlatformModules,
  FrontendPlatformState,
  FrontendPlatformWorkspace
} from '@/shared/platform/frontend-platform.types';

export type SidebarGroup = 'core' | 'finance' | 'pet';

type SidebarItemBase = {
  href: string;
  label: string;
  anyOf?: string[];
  anyEntitlements?: readonly string[];
  allowedPlanCodes?: readonly string[];
  blockedPlanCodes?: readonly string[];
  moduleCode?: string;
  group: string;
  platformOnly?: boolean;
};

export const petClinicNavigationPlanCodes = ['CLINICA_VETERINARIA', 'BANHO_TOSA_CLINICA'] as const;
export const petPosNavigationPlanCodes = ['PETSHOP', 'PETSHOP_BANHO_TOSA'] as const;
export const banhoTosaOnlyPlanCodes = ['BANHO_TOSA'] as const;
export const petCommercialNavigationPlanCodes = ['PETSHOP', 'PETSHOP_BANHO_TOSA', 'BANHO_TOSA_CLINICA'] as const;

export type SidebarNavigationContext = Pick<FrontendPlatformState, 'user'> & {
  modules: Pick<FrontendPlatformModules, 'availableCodes' | 'loading'>;
  workspace: Pick<FrontendPlatformWorkspace, 'canManagePlatformAdministration' | 'hasFullPlatformVisibility'>;
};

function hasPlanVisibilityBypass(context: SidebarNavigationContext) {
  return context.workspace.canManagePlatformAdministration
    || context.workspace.hasFullPlatformVisibility
    || hasTenantEntitlement(context.user, tenantEntitlementKeys.any);
}

function matchesAllowedPlanCodes(
  user: SidebarNavigationContext['user'],
  allowedPlanCodes: readonly string[]
) {
  const normalizedPlanCode = user?.tenantPlanCode?.trim().toUpperCase();
  return normalizedPlanCode ? allowedPlanCodes.includes(normalizedPlanCode) : false;
}

export function filterSidebarItems<T extends SidebarItemBase>(
  items: T[],
  context: SidebarNavigationContext
) {
  const availableModuleCodes = new Set(context.modules.availableCodes);

  return items.filter((item) => {
    if (item.platformOnly && !context.workspace.canManagePlatformAdministration) {
      return false;
    }

    if (item.moduleCode && context.modules.loading) {
      return false;
    }

    if (item.moduleCode && !availableModuleCodes.has(item.moduleCode)) {
      return false;
    }

    if (item.blockedPlanCodes && item.blockedPlanCodes.length > 0 && matchesAllowedPlanCodes(context.user, item.blockedPlanCodes)) {
      return false;
    }

    if (item.allowedPlanCodes && item.allowedPlanCodes.length > 0 && !hasPlanVisibilityBypass(context)) {
      if (!matchesAllowedPlanCodes(context.user, item.allowedPlanCodes)) {
        return false;
      }
    }

    if (item.anyEntitlements && item.anyEntitlements.length > 0 && !hasAnyTenantEntitlement(context.user, item.anyEntitlements)) {
      return false;
    }

    if (!item.anyOf || item.anyOf.length === 0) {
      return true;
    }

    return hasAnyPermission(context.user, item.anyOf);
  });
}

export function groupSidebarItems<T extends SidebarItemBase>(
  items: T[],
  canManagePlatformAdministration: boolean
) {
  const groupOrder: SidebarGroup[] = ['core', 'pet', 'finance'];

  return groupOrder
    .map((group) => {
      const title = group === 'core'
        ? (canManagePlatformAdministration ? 'Platform' : 'Workspace')
        : group === 'finance'
          ? 'Finance'
          : 'PetFlow';

      return {
        key: group,
        title,
        items: items.filter((item) => item.group === group)
      };
    })
    .filter((group) => group.items.length > 0);
}
