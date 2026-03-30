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

const defaultActionLabel = 'Abrir fluxo do ambiente';
const defaultLockedActionLabel = 'Indisponivel neste ambiente';
const defaultRoleLockedActionLabel = 'Indisponivel para este perfil';
const defaultSetupActionLabel = 'Abrir fluxo de configuracao';

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
  status = 'sem permissao'
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
  actionLabel = interactive ? defaultActionLabel : 'Recurso desativado neste ambiente',
  status = 'recurso desativado'
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
  status = 'configuracao necessaria'
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
  status = 'sem dados'
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
  status = 'indisponivel'
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
      status: 'indisponivel',
      title: `${moduleCode} nao esta contratado neste ambiente`,
      description: `Este ambiente nao expoe o modulo ${moduleCode} no momento. Peca ao administrador para incluir o modulo no contrato do ambiente antes de tentar novamente.`,
      actionLabel: defaultLockedActionLabel
    };
  }

  if (!moduleItem.featureFlagEnabled) {
    return featureDisabledCapability({
      title: `${moduleCode} esta desativado no ambiente atual`,
      description: 'O modulo esta contratado, mas sua exposicao esta desativada neste ambiente. A navegacao continua bloqueada ate a feature ser reativada.'
    });
  }

  if (!moduleItem.available) {
    return unavailableCapability({
      title: `${moduleCode} esta indisponivel no ambiente atual`,
      description: 'O modulo esta contratado, mas o contexto atual ainda nao esta pronto para abri-lo. O acesso segue bloqueado ate a disponibilidade do ambiente ser restaurada.'
    });
  }

  return readyCapability();
}

export function isCapabilityReady(capability?: ModuleCapability | null) {
  return !capability || capability.kind === 'ready';
}
