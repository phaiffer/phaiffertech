import { hasAnyTenantEntitlement } from '@/shared/entitlements/tenant-entitlements';
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
  moduleCode?: string;
  group: string;
  platformOnly?: boolean;
};

export type SidebarNavigationContext = Pick<FrontendPlatformState, 'user'> & {
  modules: Pick<FrontendPlatformModules, 'availableCodes' | 'loading'>;
  workspace: Pick<FrontendPlatformWorkspace, 'canManagePlatformAdministration'>;
};

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
