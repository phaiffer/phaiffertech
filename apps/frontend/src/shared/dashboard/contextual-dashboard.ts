import { getAppThemeModeLabel } from '@/shared/lib/tenant-branding';
import { isVisibleProductModuleCode } from '@/shared/modules/visible-product-modules';
import type { GettingStartedStep } from '@/shared/onboarding/getting-started';
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
    href: '/iot',
    actionTitle: 'Open IoT workspace',
    actionDescription: 'Inspect fleet health, alarms, telemetry, and the next operational action for this workspace.'
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
  return modules.filter((moduleItem) => isVisibleProductModuleCode(moduleItem.code) && predicate(moduleItem));
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
  if (!isVisibleProductModuleCode(moduleCode)) {
    return null;
  }

  return moduleWorkspaceMeta[moduleCode]?.href ?? null;
}

export function buildDashboardExperienceCopy(platform: FrontendPlatformState): DashboardExperienceCopy {
  const variant = resolveDashboardWorkspaceVariant(platform);

  if (variant === 'platform') {
    return {
      description:
        'Executive control plane for cross-module health, current pressure, and the next operational action across the platform workspace.',
      actionsTitle: 'Recommended Actions',
      actionsDescription:
        'Start with the highest-leverage move for the current workspace, then use the supporting platform controls below when needed.',
      modulesTitle: 'Module Access Matrix',
      modulesDescription:
        'Explicit separation between tenant bindings, feature exposure, and final availability across the platform.',
      summariesTitle: 'Module Executive Summaries',
      summariesDescription:
        'Cross-module snapshots that keep KPI posture, recent movement, and the next best action visible in one place.'
    };
  }

  return {
    description:
      `Executive workspace for ${platform.branding.scopeName}, built to show what is happening now, what needs attention, and where to act first.`,
    actionsTitle: 'Recommended Actions',
    actionsDescription:
      'Use the strongest next action first, then move into the contracted module surfaces that are available in this workspace.',
    modulesTitle: 'Contracted Modules',
    modulesDescription:
      'Tenant-bound products stay explicit here so workspace scope is clear before navigating into individual modules.',
    summariesTitle: 'Module Snapshots',
    summariesDescription:
      'Each module snapshot is trimmed to the KPIs, recent movement, and continuation step that matter first.'
  };
}

function buildModuleSetupDescription(moduleCode: string) {
  if (!isVisibleProductModuleCode(moduleCode)) {
    return 'This workspace no longer exposes that standalone module on the visible PetFlow surface.';
  }

  if (moduleCode === 'CRM') {
    return 'Open CRM and create the first commercial records so the workspace can begin surfacing contacts, leads, deals, and activity.';
  }

  if (moduleCode === 'PET') {
    return 'Open PetFlow and establish the first clients, pet profiles, and appointments so clinical context can start building.';
  }

  if (moduleCode === 'IOT') {
    return 'Open IoT and onboard the first devices, mappings, and telemetry flows so operational signals can start surfacing.';
  }

  return 'Open the contracted module workspace and establish the first operational records for this tenant.';
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

export function buildDashboardGettingStartedSteps(platform: FrontendPlatformState): GettingStartedStep[] {
  if (resolveDashboardWorkspaceVariant(platform) !== 'workspace') {
    return [];
  }

  const steps: GettingStartedStep[] = [];

  getAccessibleWorkspaceModules(platform).forEach((moduleItem) => {
    if (steps.length >= 3) {
      return;
    }

    const meta = moduleWorkspaceMeta[moduleItem.code];

    if (!meta) {
      return;
    }

    steps.push({
      key: `setup-${moduleItem.code.toLowerCase()}`,
      eyebrow: moduleItem.code,
      title: meta.actionTitle,
      description: buildModuleSetupDescription(moduleItem.code),
      href: meta.href,
      status: 'setup required',
      actionLabel: 'Open setup flow'
    });
  });

  if (steps.length === 0) {
    return [];
  }

  steps.unshift({
    key: 'workspace-settings',
    eyebrow: 'Workspace',
    title: 'Confirm workspace settings',
    description: 'Review workspace identity, contracted modules, theme policy, and branding before broader tenant rollout.',
    href: '/settings',
    status: 'active',
    actionLabel: 'Open workspace settings'
  });

  if (steps.length > 3) {
    steps.pop();
  }

  if (steps.length < 3 && hasPermission(platform.user, 'USER_READ')) {
    steps.push({
      key: 'workspace-users',
      eyebrow: 'Access',
      title: 'Review workspace access',
      description: 'Confirm which tenant users and roles are ready to join the first operational workflows.',
      href: '/users',
      status: 'active',
      actionLabel: 'Review workspace users'
    });
  }

  return steps;
}
