import type { ModuleItem } from '@/shared/types/module';

export type ModuleCapabilityKind =
  | 'ready'
  | 'no-permission'
  | 'feature-disabled'
  | 'not-configured'
  | 'no-data'
  | 'not-contracted'
  | 'unavailable';

export type ModuleCapability = {
  kind: ModuleCapabilityKind;
  interactive: boolean;
  status?: string | null;
  title?: string;
  description?: string;
  actionLabel: string;
};

type CapabilityInput = {
  title: string;
  description: string;
  interactive?: boolean;
  actionLabel?: string;
  status?: string | null;
};

type ModuleBoundaryModule = Pick<ModuleItem, 'moduleEnabled' | 'featureFlagEnabled' | 'available'>;

const defaultActionLabel = 'Open workspace flow';
const defaultLockedActionLabel = 'Unavailable in current workspace';
const defaultRoleLockedActionLabel = 'Unavailable in current workspace role';
const defaultSetupActionLabel = 'Open setup flow';

export function readyCapability(status?: string | null): ModuleCapability {
  return {
    kind: 'ready',
    interactive: true,
    status: status ?? null,
    actionLabel: defaultActionLabel
  };
}

export function permissionCapability({
  title,
  description,
  actionLabel = defaultRoleLockedActionLabel,
  status = 'no permission'
}: CapabilityInput): ModuleCapability {
  return {
    kind: 'no-permission',
    interactive: false,
    title,
    description,
    actionLabel,
    status
  };
}

export function featureDisabledCapability({
  title,
  description,
  interactive = false,
  actionLabel = interactive ? defaultActionLabel : 'Feature disabled in workspace',
  status = 'feature disabled'
}: CapabilityInput): ModuleCapability {
  return {
    kind: 'feature-disabled',
    interactive,
    title,
    description,
    actionLabel,
    status
  };
}

export function notConfiguredCapability({
  title,
  description,
  interactive = true,
  actionLabel = interactive ? defaultSetupActionLabel : defaultLockedActionLabel,
  status = 'setup required'
}: CapabilityInput): ModuleCapability {
  return {
    kind: 'not-configured',
    interactive,
    title,
    description,
    actionLabel,
    status
  };
}

export function noDataCapability({
  title,
  description,
  interactive = true,
  actionLabel = defaultActionLabel,
  status = 'no data'
}: CapabilityInput): ModuleCapability {
  return {
    kind: 'no-data',
    interactive,
    title,
    description,
    actionLabel,
    status
  };
}

export function unavailableCapability({
  title,
  description,
  interactive = false,
  actionLabel = defaultLockedActionLabel,
  status = 'unavailable'
}: CapabilityInput): ModuleCapability {
  return {
    kind: 'unavailable',
    interactive,
    title,
    description,
    actionLabel,
    status
  };
}

export function resolveModuleBoundaryCapability(
  moduleCode: string,
  moduleItem?: ModuleBoundaryModule | null
): ModuleCapability {
  if (!moduleItem || !moduleItem.moduleEnabled) {
    return {
      kind: 'not-contracted',
      interactive: false,
      status: 'unavailable',
      title: `${moduleCode} is not contracted for this workspace`,
      description: `This tenant does not currently expose the ${moduleCode} module. Ask your tenant administrator to add it to the workspace contract before trying again.`,
      actionLabel: defaultLockedActionLabel
    };
  }

  if (!moduleItem.featureFlagEnabled) {
    return featureDisabledCapability({
      title: `${moduleCode} is disabled in the current workspace`,
      description: 'The module is contracted, but feature exposure is currently disabled for this workspace. Navigation stays blocked until the feature flag is re-enabled.'
    });
  }

  if (!moduleItem.available) {
    return unavailableCapability({
      title: `${moduleCode} is unavailable in the current workspace`,
      description: 'The module is contracted, but the current workspace context is not ready to open it yet. Access remains blocked until workspace availability is restored.'
    });
  }

  return readyCapability();
}

export function isCapabilityReady(capability?: ModuleCapability | null) {
  return !capability || capability.kind === 'ready';
}
