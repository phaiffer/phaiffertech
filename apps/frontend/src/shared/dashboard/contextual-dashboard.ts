import { getAppThemeModeLabel } from '@/shared/lib/tenant-branding';
import { hasPermission } from '@/shared/permissions/has-permission';
import type { FrontendPlatformState } from '@/shared/platform/frontend-platform.types';
import type { ModuleItem } from '@/shared/types/module';

export type DashboardWorkspaceVariant = 'platform' | 'workspace';

export type DashboardContextCard = {
  key: string;
  label: string;
  value: string;
  description: string;
  tone?: 'accent' | 'primary' | 'neutral';
};

export type DashboardQuickAction = {
  key: string;
  eyebrow: string;
  title: string;
  description: string;
  href: string;
};

export type DashboardExperienceCopy = {
  description: string;
  actionsTitle: string;
  actionsDescription: string;
  modulesTitle: string;
  modulesDescription: string;
  summariesTitle: string;
  summariesDescription: string;
};

type ModuleWorkspaceMeta = {
  href: string;
  actionTitle: string;
  actionDescription: string;
};

const moduleWorkspaceMeta: Record<string, ModuleWorkspaceMeta> = {
  CRM: {
    href: '/crm',
    actionTitle: 'Open CRM workspace',
    actionDescription: 'Review contacts, pipeline flow, and commercial activity for the current workspace.'
  },
  IOT: {
    href: '/iot/dashboard',
    actionTitle: 'Open Industrial IoT',
    actionDescription: 'Inspect telemetry, alarms, and operational signals exposed to this workspace.'
  },
  PET: {
    href: '/pet',
    actionTitle: 'Open PetFlow workspace',
    actionDescription: 'Access the clinical and operational workflows contracted for this tenant.'
  }
};

function filterProductModules(
  modules: ModuleItem[],
  predicate: (moduleItem: ModuleItem) => boolean
) {
  return modules.filter((moduleItem) => moduleItem.code !== 'CORE_PLATFORM' && predicate(moduleItem));
}

export function resolveDashboardWorkspaceVariant(
  platform: Pick<FrontendPlatformState, 'workspace'>
): DashboardWorkspaceVariant {
  return platform.workspace.isPlatformOwnerTenant
    || platform.workspace.hasSystemAdminRole
    || platform.workspace.canManagePlatformAdministration
    ? 'platform'
    : 'workspace';
}

export function getContractedWorkspaceModules(
  platform: Pick<FrontendPlatformState, 'modules'>
) {
  return filterProductModules(platform.modules.items, (moduleItem) => moduleItem.moduleEnabled);
}

export function getAccessibleWorkspaceModules(
  platform: Pick<FrontendPlatformState, 'modules'>
) {
  return filterProductModules(platform.modules.items, (moduleItem) => moduleItem.available);
}

export function resolveModuleWorkspaceHref(moduleCode: string) {
  return moduleWorkspaceMeta[moduleCode]?.href ?? null;
}

export function buildDashboardExperienceCopy(platform: FrontendPlatformState): DashboardExperienceCopy {
  const variant = resolveDashboardWorkspaceVariant(platform);

  if (variant === 'platform') {
    return {
      description:
        'Platform control plane overview for tenant administration, contracted products, and module visibility.',
      actionsTitle: 'Platform Operations',
      actionsDescription:
        'Jump into tenant governance, user access, and the shared control surfaces that shape the platform workspace.',
      modulesTitle: 'Module Access Matrix',
      modulesDescription:
        'Explicit separation between tenant bindings, feature exposure, and final availability across the platform.',
      summariesTitle: 'Module Executive Summaries',
      summariesDescription:
        'Cross-module snapshots for the products currently exposed in the authenticated platform workspace.'
    };
  }

  return {
    description:
      `Workspace overview for ${platform.branding.scopeName}, shaped by contracted modules and the access currently granted to this tenant.`,
    actionsTitle: 'Workspace Actions',
    actionsDescription:
      'Open the contracted module surfaces and tenant-level controls available in this authenticated workspace.',
    modulesTitle: 'Contracted Modules',
    modulesDescription:
      'Tenant-bound products stay explicit here so workspace scope is clear before navigating into individual modules.',
    summariesTitle: 'Module Snapshots',
    summariesDescription:
      'Only summaries returned for the current tenant workspace are shown here.'
  };
}

export function buildDashboardContextCards(platform: FrontendPlatformState): DashboardContextCard[] {
  const variant = resolveDashboardWorkspaceVariant(platform);
  const contractedModules = getContractedWorkspaceModules(platform);
  const accessibleModules = getAccessibleWorkspaceModules(platform);

  if (variant === 'platform') {
    const adminContext = platform.workspace.hasSystemAdminRole
      ? 'SYS_ADMIN'
      : platform.workspace.canManagePlatformAdministration
        ? 'Platform admin'
        : 'Platform tenant';

    return [
      {
        key: 'workspace-type',
        label: 'Workspace Type',
        value: platform.workspace.isPlatformOwnerTenant ? 'Platform tenant' : 'Internal admin workspace',
        description: 'This authenticated session can operate in a platform-oriented context.',
        tone: 'accent'
      },
      {
        key: 'access-scope',
        label: 'Access Scope',
        value: 'Full platform visibility',
        description: 'Tenant administration and shared platform surfaces are available from this workspace.',
        tone: 'neutral'
      },
      {
        key: 'admin-context',
        label: 'Admin Context',
        value: adminContext,
        description: `${accessibleModules.length} product workspace${accessibleModules.length === 1 ? '' : 's'} are currently visible here.`,
        tone: 'primary'
      }
    ];
  }

  return [
    {
      key: 'workspace-type',
      label: 'Workspace Type',
      value: 'Customer tenant',
      description: 'This workspace is scoped to the tenant contract and current user permissions.',
      tone: 'accent'
    },
    {
      key: 'access-scope',
      label: 'Access Scope',
      value: 'Contracted modules only',
      description: 'Platform-level administration is intentionally excluded from customer workspaces.',
      tone: 'neutral'
    },
    {
      key: 'contracted-products',
      label: 'Contracted Products',
      value: contractedModules.length.toString(),
      description:
        `Theme default: ${getAppThemeModeLabel(platform.theme.tenantDefaultMode)}${platform.theme.canOverride ? ' with user override enabled.' : ' with tenant-managed control.'}`,
      tone: 'primary'
    }
  ];
}

export function buildDashboardQuickActions(platform: FrontendPlatformState): DashboardQuickAction[] {
  const variant = resolveDashboardWorkspaceVariant(platform);
  const actions: DashboardQuickAction[] = [];
  const user = platform.user;

  if (variant === 'platform') {
    if (platform.workspace.canManagePlatformAdministration && hasPermission(user, 'TENANT_READ')) {
      actions.push({
        key: 'manage-tenants',
        eyebrow: 'Platform',
        title: 'Manage tenants',
        description: 'Review contracted products, branding defaults, and tenant experience policies.',
        href: '/tenants'
      });
    }

    if (hasPermission(user, 'USER_READ')) {
      actions.push({
        key: 'review-users',
        eyebrow: 'Access',
        title: 'Review user access',
        description: 'Inspect tenant-scoped users, roles, and the current workspace access model.',
        href: '/users'
      });
    }

    actions.push({
      key: 'open-settings',
      eyebrow: 'Workspace',
      title: 'Open settings',
      description: 'Review shared workspace preferences and support-facing configuration surfaces.',
      href: '/settings'
    });

    return actions;
  }

  getAccessibleWorkspaceModules(platform).forEach((moduleItem) => {
    const meta = moduleWorkspaceMeta[moduleItem.code];
    if (!meta) {
      return;
    }

    actions.push({
      key: `module-${moduleItem.code.toLowerCase()}`,
      eyebrow: moduleItem.code,
      title: meta.actionTitle,
      description: meta.actionDescription,
      href: meta.href
    });
  });

  if (hasPermission(user, 'USER_READ')) {
    actions.push({
      key: 'review-users',
      eyebrow: 'Access',
      title: 'Review workspace users',
      description: 'Inspect the users and roles currently assigned to this tenant workspace.',
      href: '/users'
    });
  }

  actions.push({
    key: 'open-settings',
    eyebrow: 'Workspace',
    title: 'Open settings',
    description: 'Review shared workspace preferences and support surfaces for this tenant.',
    href: '/settings'
  });

  return actions;
}
