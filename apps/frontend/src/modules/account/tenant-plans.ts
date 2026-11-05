import { filterVisibleProductModuleCodes } from '@/shared/modules/visible-product-modules';
import { TenantCreateInput, TenantFormInput, TenantUpdateInput } from '@/shared/services/tenant-service';
import { Tenant } from '@/shared/types/tenant';

/** Commercial packages available to platform administrators. */
export const PLAN_CODES = ['PETSHOP', 'BANHO_TOSA', 'CLINICA_VETERINARIA', 'PETSHOP_BANHO_TOSA', 'BANHO_TOSA_CLINICA'] as const;

export type ProductPackageCode = typeof PLAN_CODES[number];

type PlanDefaults = {
  defaultModules: string[];
  defaultEntitlements: string[];
};

const PLAN_DEFAULTS: Record<ProductPackageCode, PlanDefaults> = {
  PETSHOP: { defaultModules: ['PET'], defaultEntitlements: ['pet.retail'] },
  BANHO_TOSA: { defaultModules: ['PET'], defaultEntitlements: ['pet.aesthetics'] },
  CLINICA_VETERINARIA: { defaultModules: ['PET'], defaultEntitlements: ['pet.clinic', 'pet.veterinary', 'pet.retail'] },
  PETSHOP_BANHO_TOSA: { defaultModules: ['PET'], defaultEntitlements: ['pet.aesthetics', 'pet.retail'] },
  BANHO_TOSA_CLINICA: { defaultModules: ['PET'], defaultEntitlements: ['pet.aesthetics', 'pet.clinic', 'pet.veterinary', 'pet.retail'] }
};

export const emptyTenantForm: TenantFormInput = {
  name: '',
  code: '',
  status: 'ACTIVE',
  logoUrl: '',
  primaryColor: '#0f172a',
  accentColor: '#2563eb',
  defaultThemeMode: 'SYSTEM',
  allowUserThemeOverride: true,
  contractedModules: [],
  planCode: 'PETSHOP',
  featureEntitlements: [],
  trialEndDate: '',
  initialAdminFullName: '',
  initialAdminEmail: '',
  temporaryPassword: '',
  requirePasswordChangeOnFirstAccess: true
};

export function resolvePlanCode(planCode?: string): ProductPackageCode {
  const normalized = (planCode ?? 'PETSHOP').toUpperCase() as ProductPackageCode;
  return PLAN_DEFAULTS[normalized] ? normalized : 'PETSHOP';
}

export function resolvePlanDefaults(planCode?: string) {
  return PLAN_DEFAULTS[resolvePlanCode(planCode)];
}

export function resolveEffectiveModuleSelection(planCode: string | undefined, moduleOverrides: string[]) {
  return Array.from(new Set([...resolvePlanDefaults(planCode).defaultModules, ...moduleOverrides]));
}

export function resolveManualModuleOverrides(tenant: Tenant) {
  return tenant.moduleOverrides
    ?? tenant.contractedModules.filter((moduleCode) => (
      moduleCode !== 'CORE_PLATFORM'
      && !resolvePlanDefaults(tenant.planCode).defaultModules.includes(moduleCode)
    ));
}

export function resolveVisibleEffectiveModules(planCode: string | undefined, moduleOverrides: string[]) {
  return filterVisibleProductModuleCodes(resolveEffectiveModuleSelection(planCode, moduleOverrides));
}

function normalizeTenantInput(form: TenantFormInput): TenantFormInput {
  const planDefaults = resolvePlanDefaults(form.planCode);
  const manualOverrides = Array.from(new Set(
    form.contractedModules
      .map((moduleCode) => moduleCode.trim().toUpperCase())
      .filter(Boolean)
      .filter((moduleCode) => !planDefaults.defaultModules.includes(moduleCode))
  ));

  return {
    ...form,
    name: form.name.trim(),
    code: form.code.trim().toLowerCase(),
    status: form.status || 'ACTIVE',
    logoUrl: form.logoUrl?.trim() ? form.logoUrl.trim() : null,
    primaryColor: form.primaryColor?.trim() ? form.primaryColor.trim() : null,
    accentColor: form.accentColor?.trim() ? form.accentColor.trim() : null,
    trialEndDate: form.trialEndDate.trim(),
    initialAdminFullName: form.initialAdminFullName.trim(),
    initialAdminEmail: form.initialAdminEmail.trim().toLowerCase(),
    requirePasswordChangeOnFirstAccess: Boolean(form.requirePasswordChangeOnFirstAccess),
    contractedModules: resolveEffectiveModuleSelection(form.planCode, manualOverrides),
    featureEntitlements: Array.from(new Set(
      (form.featureEntitlements ?? [])
        .map((featureKey) => featureKey.trim().toLowerCase())
        .filter(Boolean)
    ))
  };
}

export function toTenantUpdateInput(form: TenantFormInput): TenantUpdateInput {
  const normalized = normalizeTenantInput(form);

  return {
    name: normalized.name,
    code: normalized.code,
    status: normalized.status,
    logoUrl: normalized.logoUrl,
    primaryColor: normalized.primaryColor,
    accentColor: normalized.accentColor,
    defaultThemeMode: normalized.defaultThemeMode,
    allowUserThemeOverride: normalized.allowUserThemeOverride,
    contractedModules: normalized.contractedModules,
    planCode: normalized.planCode,
    featureEntitlements: normalized.featureEntitlements,
    trialEndDate: normalized.trialEndDate || null
  };
}

export function toTenantCreateInput(form: TenantFormInput): TenantCreateInput {
  const normalized = normalizeTenantInput(form);

  return {
    ...toTenantUpdateInput(normalized),
    trialEndDate: normalized.trialEndDate,
    initialAdminFullName: normalized.initialAdminFullName,
    initialAdminEmail: normalized.initialAdminEmail,
    temporaryPassword: normalized.temporaryPassword,
    requirePasswordChangeOnFirstAccess: normalized.requirePasswordChangeOnFirstAccess
  };
}

export function formatTokenLabel(value: string) {
  return value
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
