import { getAppThemeModeLabel } from '@/shared/lib/tenant-branding';
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

const DEFAULT_PRIMARY_COLOR = '#0f172a';
const DEFAULT_ACCENT_COLOR = '#2563eb';

function humanizeToken(value: string) {
  return value
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
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
  contractedModuleCount: number
) {
  if (variant === 'platform-owner') {
    return {
      value: 'Platform owner tenant',
      description: 'This workspace belongs to the PhaifferTech tenant that anchors shared platform governance.'
    };
  }

  if (variant === 'internal-support') {
    return {
      value: 'Internal support session',
      description: 'Platform-oriented support context is active, but the workspace remains bounded by the customer tenant.'
    };
  }

  if (contractedModuleCount > 1) {
    return {
      value: 'Multi-product workspace',
      description: `${contractedModuleCount} contracted product workspaces are attached to this tenant.`
    };
  }

  if (contractedModuleCount === 1) {
    return {
      value: 'Single-product workspace',
      description: 'One contracted product workspace is attached to this tenant alongside shared core services.'
    };
  }

  return {
    value: 'Core workspace',
    description: 'Only the shared core platform services are currently active for this tenant.'
  };
}

function resolveWorkspaceStatus(
  platform: FrontendPlatformState,
  contractedModules: WorkspaceConfigurationModule[]
) {
  if (platform.modules.error) {
    return {
      value: 'Attention required',
      description: 'Workspace contract data could not be verified from the module catalog.',
      badgeStatus: 'alert' as const
    };
  }

  if (platform.modules.loading) {
    return {
      value: 'Syncing',
      description: 'Module contract and exposure data is still loading for this workspace.',
      badgeStatus: 'info' as const
    };
  }

  if (contractedModules.length === 0) {
    return {
      value: 'Core only',
      description: 'No product modules are contracted yet, so the workspace stays on shared core services.',
      badgeStatus: 'neutral' as const
    };
  }

  if (contractedModules.some((moduleItem) => moduleItem.availabilityStatus !== 'active')) {
    return {
      value: 'Provisioning',
      description: 'At least one contracted module is still pending final workspace exposure.',
      badgeStatus: 'pending' as const
    };
  }

  return {
    value: 'Active',
    description: 'All contracted modules are available in the current workspace.',
    badgeStatus: 'active' as const
  };
}

function resolveVisibilityField(variant: WorkspaceConfigurationVariant) {
  if (variant === 'platform-owner') {
    return {
      value: 'Full platform visibility',
      description: 'Only the PhaifferTech platform-owner tenant may expose the shared platform control plane.',
      badgeStatus: 'active' as const
    };
  }

  if (variant === 'internal-support') {
    return {
      value: 'Tenant boundary active',
      description: 'SYS_ADMIN support context does not upgrade this customer tenant into a platform-owner workspace.',
      badgeStatus: 'info' as const
    };
  }

  return {
    value: 'Tenant-scoped visibility',
    description: 'This workspace is limited to the current tenant contract, permissions, and exposed modules.',
    badgeStatus: 'neutral' as const
  };
}

function resolveBrandingDescription(variant: WorkspaceConfigurationVariant, scopeName: string) {
  if (variant === 'platform-owner') {
    return `${scopeName} represents the platform-owner tenant. Branding remains constrained to controlled accent surfaces even here.`;
  }

  if (variant === 'internal-support') {
    return `${scopeName} is being reviewed through an internal support lens, but the customer workspace identity stays intact.`;
  }

  return `${scopeName} is presented as a customer workspace with controlled accent branding applied to shared shell surfaces.`;
}

function resolveThemeDescription(variant: WorkspaceConfigurationVariant) {
  if (variant === 'platform-owner') {
    return 'Theme defaults here describe the shared platform-owner workspace experience and its tenant policy.';
  }

  if (variant === 'internal-support') {
    return 'Theme data is read from the active customer tenant while keeping the workspace boundary explicit.';
  }

  return 'Theme resolution follows the current tenant defaults plus the local override policy exposed to workspace users.';
}

export function buildWorkspaceConfigurationOverview(
  platform: FrontendPlatformState
): WorkspaceConfigurationOverviewModel {
  const variant = resolveVariant(platform);
  const primaryColor = platform.user?.tenantPrimaryColor?.toUpperCase() ?? DEFAULT_PRIMARY_COLOR;
  const accentColor = platform.user?.tenantAccentColor?.toUpperCase() ?? DEFAULT_ACCENT_COLOR;
  const logoState = platform.branding.logoUrl ? 'Custom logo active' : 'Monogram fallback';
  const contractedModules = platform.modules.items
    .filter((moduleItem) => moduleItem.code !== 'CORE_PLATFORM' && moduleItem.moduleEnabled)
    .map<WorkspaceConfigurationModule>((moduleItem) => ({
      code: moduleItem.code,
      name: moduleItem.name,
      description: moduleItem.description,
      availabilityLabel: moduleItem.available ? 'Available in workspace' : 'Pending workspace exposure',
      availabilityDescription: moduleItem.available
        ? 'The contracted module is already exposed to this authenticated workspace.'
        : 'The contract is active, but final workspace exposure is not complete yet.',
      availabilityStatus: moduleItem.available ? 'active' : 'pending',
      exposureLabel: moduleItem.featureFlagEnabled ? 'Feature exposure enabled' : 'Feature exposure pending',
      exposureDescription: moduleItem.featureFlagEnabled
        ? 'Feature flags currently allow this module surface to appear in the workspace.'
        : 'Feature flags still restrict this module surface for the current workspace.',
      exposureStatus: moduleItem.featureFlagEnabled ? 'active' : 'warn'
    }));
  const plan = resolveWorkspacePlan(variant, contractedModules.length);
  const status = resolveWorkspaceStatus(platform, contractedModules);
  const visibility = resolveVisibilityField(variant);
  const workspaceAccess = variant === 'internal-support'
    ? 'Internal support on customer contract'
    : platform.workspace.accessLabel;

  return {
    variant,
    pageDescription:
      variant === 'platform-owner'
        ? 'Review platform-owner identity, controlled branding, theme policy, contracted modules, and workspace readiness.'
        : variant === 'internal-support'
          ? 'Review customer workspace configuration with internal support context while keeping platform-owner administration out of scope.'
          : `Review tenant identity, controlled branding, theme policy, contracted modules, and workspace readiness for ${platform.branding.scopeName}.`,
    identityEyebrow:
      variant === 'platform-owner'
        ? 'Platform Owner Workspace'
        : variant === 'internal-support'
          ? 'Internal Support Context'
          : 'Customer Workspace',
    identityTitle: platform.branding.scopeName,
    identityDescription:
      variant === 'platform-owner'
        ? 'This authenticated session is inside the PhaifferTech platform-owner tenant, where shared platform context and tenant governance converge.'
        : variant === 'internal-support'
          ? 'This authenticated session belongs to an internal SYS_ADMIN user inside a customer tenant. The session stays tenant-scoped even though support context is visible.'
          : 'This authenticated session is scoped to the active customer tenant and should reflect only its contract, branding policy, and exposed module surfaces.',
    identityFields: [
      {
        label: 'Workspace label',
        value: platform.workspace.workspaceLabel,
        description: 'Presentation label derived from the authenticated frontend platform context.'
      },
      {
        label: 'Access scope',
        value: workspaceAccess,
        description: 'Current workspace scope after tenant and role context are applied.'
      },
      {
        label: 'Tenant code',
        value: platform.branding.tenantCode ?? 'Not assigned',
        description: 'Stable tenant identifier used to anchor the active workspace.'
      },
      {
        label: 'Session role',
        value: platform.user?.role ? humanizeToken(platform.user.role) : 'Unknown role',
        description: platform.user?.fullName
          ? `Current authenticated user: ${platform.user.fullName}.`
          : 'Authenticated user details are not available in the current session.'
      }
    ],
    brandingDescription: resolveBrandingDescription(variant, platform.branding.scopeName),
    brandingPolicy:
      'Tenant branding stays limited to controlled accent surfaces. Structural layout, neutral panels, and system tokens remain owned by the platform design system.',
    brandingFields: [
      {
        label: 'Primary accent',
        value: primaryColor,
        description: 'Used for controlled highlights and soft branded surfaces.'
      },
      {
        label: 'Accent highlight',
        value: accentColor,
        description: 'Used for focused actions, emphasis, and lightweight callouts.'
      },
      {
        label: 'Logo state',
        value: logoState,
        description: platform.branding.logoUrl
          ? 'A tenant-provided logo is available for shared shell accent areas.'
          : 'The workspace currently falls back to a generated monogram.'
      }
    ],
    themeDescription: resolveThemeDescription(variant),
    themeFields: [
      {
        label: 'Current shell theme',
        value: getAppThemeModeLabel(platform.theme.mode),
        description: 'Effective theme mode in the current browser session.'
      },
      {
        label: 'Tenant default theme',
        value: getAppThemeModeLabel(platform.theme.tenantDefaultMode),
        description: platform.theme.canOverride
          ? 'Applied when the user has not stored a local preference.'
          : 'Enforced for every user because local overrides are disabled.'
      },
      {
        label: 'Override policy',
        value: platform.theme.canOverride ? 'User override enabled' : 'Tenant managed',
        description: platform.theme.canOverride
          ? 'Users may store a personal shell theme without changing tenant defaults.'
          : 'Theme resolution is centrally controlled by the tenant policy.',
        badgeStatus: platform.theme.canOverride ? 'active' : 'neutral'
      }
    ],
    modulesDescription:
      variant === 'platform-owner'
        ? 'This view separates contracted tenant bindings, feature exposure, and final workspace availability without turning Settings into a tenant editing flow.'
        : 'Only modules bound to the active tenant contract are shown here, with availability kept explicit before deeper navigation.',
    modulesEmptyDescription:
      'No contracted product modules are currently exposed for this workspace. Shared core platform services remain active.',
    contractedModules,
    coreAccessNote:
      'CORE_PLATFORM remains implicit for every tenant workspace and is treated as foundational access rather than a separately managed product.',
    planFields: [
      {
        label: 'Workspace plan',
        value: plan.value,
        description: plan.description
      },
      {
        label: 'Workspace status',
        value: status.value,
        description: status.description,
        badgeStatus: status.badgeStatus
      },
      {
        label: 'Visibility model',
        value: visibility.value,
        description: visibility.description,
        badgeStatus: visibility.badgeStatus
      }
    ]
  };
}
