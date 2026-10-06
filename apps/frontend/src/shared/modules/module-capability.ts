import type { AppLocale } from '@/shared/i18n/app-i18n-provider';
import { getAppMessages } from '@/shared/i18n/messages';
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

function withModuleCode(template: string, moduleCode: string) {
  return template.replace('{moduleCode}', moduleCode);
}

export function readyCapability(status?: string | null, locale: AppLocale = 'pt-BR'): ModuleCapability {
  return {
    kind: 'ready',
    interactive: true,
    status: status ?? null,
    actionLabel: getAppMessages(locale).moduleCapability.openWorkspaceFlow
  };
}

export function permissionCapability(input: CapabilityInput, locale: AppLocale = 'pt-BR'): ModuleCapability {
  const copy = getAppMessages(locale).moduleCapability;
  const { title, description, actionLabel = copy.unavailableForRole, status = copy.status.noPermission } = input;
  return {
    kind: 'no-permission',
    interactive: false,
    title,
    description,
    actionLabel,
    status
  };
}

export function featureDisabledCapability(input: CapabilityInput, locale: AppLocale = 'pt-BR'): ModuleCapability {
  const copy = getAppMessages(locale).moduleCapability;
  const { title, description, interactive = false, actionLabel = interactive ? copy.openWorkspaceFlow : copy.featureDisabledAction, status = copy.status.featureDisabled } = input;
  return {
    kind: 'feature-disabled',
    interactive,
    title,
    description,
    actionLabel,
    status
  };
}

export function notConfiguredCapability(input: CapabilityInput, locale: AppLocale = 'pt-BR'): ModuleCapability {
  const copy = getAppMessages(locale).moduleCapability;
  const { title, description, interactive = true, actionLabel = interactive ? copy.openSetupFlow : copy.unavailableInWorkspace, status = copy.status.setupRequired } = input;
  return {
    kind: 'not-configured',
    interactive,
    title,
    description,
    actionLabel,
    status
  };
}

export function noDataCapability(input: CapabilityInput, locale: AppLocale = 'pt-BR'): ModuleCapability {
  const copy = getAppMessages(locale).moduleCapability;
  const { title, description, interactive = true, actionLabel = copy.openWorkspaceFlow, status = copy.status.noData } = input;
  return {
    kind: 'no-data',
    interactive,
    title,
    description,
    actionLabel,
    status
  };
}

export function unavailableCapability(input: CapabilityInput, locale: AppLocale = 'pt-BR'): ModuleCapability {
  const copy = getAppMessages(locale).moduleCapability;
  const { title, description, interactive = false, actionLabel = copy.unavailableInWorkspace, status = copy.status.unavailable } = input;
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
  moduleItem?: ModuleBoundaryModule | null,
  locale: AppLocale = 'pt-BR'
): ModuleCapability {
  const copy = getAppMessages(locale).moduleCapability;
  if (!moduleItem || !moduleItem.moduleEnabled) {
    return {
      kind: 'not-contracted',
      interactive: false,
      status: copy.status.unavailable,
      title: withModuleCode(copy.notContractedTitle, moduleCode),
      description: withModuleCode(copy.notContractedDescription, moduleCode),
      actionLabel: copy.unavailableInWorkspace
    };
  }

  if (!moduleItem.featureFlagEnabled) {
    return featureDisabledCapability({
      title: withModuleCode(copy.featureDisabledTitle, moduleCode),
      description: copy.featureDisabledDescription
    }, locale);
  }

  if (!moduleItem.available) {
    return unavailableCapability({
      title: withModuleCode(copy.unavailableTitle, moduleCode),
      description: copy.unavailableDescription
    }, locale);
  }

  return readyCapability(undefined, locale);
}

export function isCapabilityReady(capability?: ModuleCapability | null) {
  return !capability || capability.kind === 'ready';
}
