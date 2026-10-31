import type { AppMessages } from '@/shared/i18n/messages/pt-br';
import type { FrontendPlatformState } from '@/shared/platform/frontend-platform.types';

export type WorkspaceConfigurationTone = 'active' | 'pending' | 'warn' | 'info' | 'neutral' | 'alert';

export type WorkspaceConfigurationField = {
  label: string;
  value: string;
  description: string;
  badgeStatus?: WorkspaceConfigurationTone;
};

export type WorkspaceConfigurationModule = {
  code: string;
  name: string;
  description: string;
  availabilityLabel: string;
  availabilityDescription: string;
  availabilityStatus: WorkspaceConfigurationTone;
  exposureLabel: string;
  exposureDescription: string;
  exposureStatus: WorkspaceConfigurationTone;
};

export type WorkspaceConfigurationVariant = 'platform-owner' | 'internal-support' | 'customer';

export type WorkspaceConfigurationCopy = AppMessages['workspaceSettings']['overview'];

export type WorkspaceConfigurationOverviewModel = {
  variant: WorkspaceConfigurationVariant;
  pageDescription: string;
  identityEyebrow: string;
  identityTitle: string;
  identityDescription: string;
  identityFields: WorkspaceConfigurationField[];
  brandingDescription: string;
  brandingPolicy: string;
  brandingFields: WorkspaceConfigurationField[];
  themeDescription: string;
  themeFields: WorkspaceConfigurationField[];
  modulesDescription: string;
  modulesEmptyDescription: string;
  contractedModules: WorkspaceConfigurationModule[];
  coreAccessNote: string;
  planFields: WorkspaceConfigurationField[];
};

type VariantKey = 'platformOwner' | 'internalSupport' | 'customer';

const DEFAULT_PRIMARY_COLOR = '#0f172a';
const DEFAULT_ACCENT_COLOR = '#2563eb';

const VARIANT_KEYS: Record<WorkspaceConfigurationVariant, VariantKey> = {
  'platform-owner': 'platformOwner',
  'internal-support': 'internalSupport',
  customer: 'customer'
};

function humanizeToken(value: string) {
  return value
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function resolveRoleLabel(role: string | undefined, copy: WorkspaceConfigurationCopy) {
  if (!role) {
    return copy.fields.unknownRole;
  }

  const roles: Record<string, string> = copy.roles;
  return roles[role] ?? humanizeToken(role);
}

function resolveVariant(platform: FrontendPlatformState): WorkspaceConfigurationVariant {
  if (platform.workspace.isPlatformOwnerTenant) {
    return 'platform-owner';
  }

  if (platform.workspace.hasSystemAdminRole) {
    return 'internal-support';
  }

  return 'customer';
}

function resolveWorkspacePlan(
  variant: WorkspaceConfigurationVariant,
  contractedModuleCount: number,
  copy: WorkspaceConfigurationCopy
) {
  if (variant === 'platform-owner') {
    return copy.plan.platformOwner;
  }

  if (variant === 'internal-support') {
    return copy.plan.internalSupport;
  }

  if (contractedModuleCount > 1) {
    return {
      value: copy.plan.multiProduct.value,
      description: copy.plan.multiProduct.description.replace('{count}', String(contractedModuleCount))
    };
  }

  if (contractedModuleCount === 1) {
    return copy.plan.singleProduct;
  }

  return copy.plan.core;
}

function resolveWorkspaceStatus(
  platform: FrontendPlatformState,
  contractedModules: WorkspaceConfigurationModule[],
  copy: WorkspaceConfigurationCopy
) {
  if (platform.modules.error) {
    return { ...copy.status.error, badgeStatus: 'alert' as const };
  }

  if (platform.modules.loading) {
    return { ...copy.status.loading, badgeStatus: 'info' as const };
  }

  if (contractedModules.length === 0) {
    return { ...copy.status.coreOnly, badgeStatus: 'neutral' as const };
  }

  if (contractedModules.some((moduleItem) => moduleItem.availabilityStatus !== 'active')) {
    return { ...copy.status.provisioning, badgeStatus: 'pending' as const };
  }

  return { ...copy.status.active, badgeStatus: 'active' as const };
}

function resolveVisibilityField(variant: WorkspaceConfigurationVariant, copy: WorkspaceConfigurationCopy) {
  if (variant === 'platform-owner') {
    return { ...copy.visibility.platformOwner, badgeStatus: 'active' as const };
  }

  if (variant === 'internal-support') {
    return { ...copy.visibility.internalSupport, badgeStatus: 'info' as const };
  }

  return { ...copy.visibility.customer, badgeStatus: 'neutral' as const };
}

function resolveWorkspaceLabel(platform: FrontendPlatformState, copy: WorkspaceConfigurationCopy) {
  if (platform.user?.impersonation) {
    return copy.workspaceLabels.support;
  }

  return platform.user?.platformAdmin ? copy.workspaceLabels.controlPlane : copy.workspaceLabels.workspace;
}

function resolveAccessLabel(
  platform: FrontendPlatformState,
  variant: WorkspaceConfigurationVariant,
  copy: WorkspaceConfigurationCopy
) {
  if (variant === 'internal-support') {
    return copy.accessLabels.internalSupport;
  }

  if (platform.user?.impersonation) {
    return copy.accessLabels.impersonation;
  }

  return platform.workspace.canManagePlatformAdministration
    ? copy.accessLabels.platformOwner
    : copy.accessLabels.contracted;
}

export function buildWorkspaceConfigurationOverview(
  platform: FrontendPlatformState,
  copy: WorkspaceConfigurationCopy
): WorkspaceConfigurationOverviewModel {
  const variant = resolveVariant(platform);
  const variantKey = VARIANT_KEYS[variant];
  const scopeName = platform.branding.scopeName;
  const primaryColor = platform.user?.tenantPrimaryColor?.toUpperCase() ?? DEFAULT_PRIMARY_COLOR;
  const accentColor = platform.user?.tenantAccentColor?.toUpperCase() ?? DEFAULT_ACCENT_COLOR;
  const hasLogo = Boolean(platform.branding.logoUrl);
  const moduleCatalog: Record<string, { name: string; description: string } | undefined> = copy.modules.catalog;
  const contractedModules = platform.modules.items
    .filter((moduleItem) => moduleItem.code !== 'CORE_PLATFORM' && moduleItem.moduleEnabled)
    .map<WorkspaceConfigurationModule>((moduleItem) => ({
      code: moduleItem.code,
      name: moduleCatalog[moduleItem.code]?.name ?? moduleItem.name,
      description: moduleCatalog[moduleItem.code]?.description ?? moduleItem.description,
      availabilityLabel: moduleItem.available ? copy.modules.available : copy.modules.pending,
      availabilityDescription: moduleItem.available
        ? copy.modules.availableDescription
        : copy.modules.pendingDescription,
      availabilityStatus: moduleItem.available ? 'active' : 'pending',
      exposureLabel: moduleItem.featureFlagEnabled ? copy.modules.exposureEnabled : copy.modules.exposurePending,
      exposureDescription: moduleItem.featureFlagEnabled
        ? copy.modules.exposureEnabledDescription
        : copy.modules.exposurePendingDescription,
      exposureStatus: moduleItem.featureFlagEnabled ? 'active' : 'warn'
    }));
  const plan = resolveWorkspacePlan(variant, contractedModules.length, copy);
  const status = resolveWorkspaceStatus(platform, contractedModules, copy);
  const visibility = resolveVisibilityField(variant, copy);

  return {
    variant,
    pageDescription: copy.pageDescription[variantKey].replace('{name}', scopeName),
    identityEyebrow: copy.identityEyebrow[variantKey],
    identityTitle: scopeName,
    identityDescription: copy.identityDescription[variantKey],
    identityFields: [
      {
        label: copy.fields.workspaceLabel,
        value: resolveWorkspaceLabel(platform, copy),
        description: copy.fields.workspaceLabelDescription
      },
      {
        label: copy.fields.accessScope,
        value: resolveAccessLabel(platform, variant, copy),
        description: copy.fields.accessScopeDescription
      },
      {
        label: copy.fields.tenantCode,
        value: platform.branding.tenantCode ?? copy.fields.notAssigned,
        description: copy.fields.tenantCodeDescription
      },
      {
        label: copy.fields.sessionRole,
        value: resolveRoleLabel(platform.user?.role, copy),
        description: platform.user?.fullName
          ? copy.fields.sessionUser.replace('{name}', platform.user.fullName)
          : copy.fields.sessionUserUnknown
      }
    ],
    brandingDescription: copy.branding.description[variantKey].replace('{name}', scopeName),
    brandingPolicy: copy.branding.policy,
    brandingFields: [
      {
        label: copy.branding.primaryLabel,
        value: primaryColor,
        description: copy.branding.primaryDescription
      },
      {
        label: copy.branding.accentLabel,
        value: accentColor,
        description: copy.branding.accentDescription
      },
      {
        label: copy.branding.logoLabel,
        value: hasLogo ? copy.branding.logoCustom : copy.branding.logoMonogram,
        description: hasLogo ? copy.branding.logoCustomDescription : copy.branding.logoMonogramDescription
      }
    ],
    themeDescription: copy.theme.description[variantKey],
    themeFields: [
      {
        label: copy.theme.currentLabel,
        value: copy.theme.modes[platform.theme.mode],
        description: copy.theme.currentDescription
      },
      {
        label: copy.theme.tenantDefaultLabel,
        value: copy.theme.modes[platform.theme.tenantDefaultMode],
        description: platform.theme.canOverride
          ? copy.theme.tenantDefaultOverridable
          : copy.theme.tenantDefaultEnforced
      },
      {
        label: copy.theme.overrideLabel,
        value: platform.theme.canOverride ? copy.theme.overrideEnabled : copy.theme.overrideManaged,
        description: platform.theme.canOverride
          ? copy.theme.overrideEnabledDescription
          : copy.theme.overrideManagedDescription,
        badgeStatus: platform.theme.canOverride ? 'active' : 'neutral'
      }
    ],
    modulesDescription:
      variant === 'platform-owner' ? copy.modules.description.platformOwner : copy.modules.description.other,
    modulesEmptyDescription: copy.modules.empty,
    contractedModules,
    coreAccessNote: copy.modules.coreAccessNote,
    planFields: [
      {
        label: copy.plan.label,
        value: plan.value,
        description: plan.description
      },
      {
        label: copy.status.label,
        value: status.value,
        description: status.description,
        badgeStatus: status.badgeStatus
      },
      {
        label: copy.visibility.label,
        value: visibility.value,
        description: visibility.description,
        badgeStatus: visibility.badgeStatus
      }
    ]
  };
}
