import type { AuthenticatedUser } from '@/shared/types/auth';

export const tenantEntitlementKeys = {
  any: '*',
  crmBasic: 'crm.basic',
  crmFull: 'crm.full',
  petBasic: 'pet.basic',
  petFull: 'pet.full',
  petAesthetics: 'pet.aesthetics',
  petClinic: 'pet.clinic',
  petRetail: 'pet.retail',
  petVeterinary: 'pet.veterinary',
  iotBasic: 'iot.basic'
} as const;

export const petSubmoduleEntitlements = [
  tenantEntitlementKeys.petAesthetics,
  tenantEntitlementKeys.petClinic,
  tenantEntitlementKeys.petRetail,
  tenantEntitlementKeys.petVeterinary
] as const;

export const petOperationalEntitlements = [
  tenantEntitlementKeys.petAesthetics,
  tenantEntitlementKeys.petClinic
] as const;

export const petRetailEntitlements = [tenantEntitlementKeys.petRetail] as const;
export const petClinicalEntitlements = [tenantEntitlementKeys.petVeterinary] as const;
export const iotMonitorEntitlements = [tenantEntitlementKeys.iotBasic] as const;

export function hasTenantEntitlement(
  user: AuthenticatedUser | null | undefined,
  requiredEntitlement: string
): boolean {
  if (!user || !requiredEntitlement) {
    return false;
  }

  const grantedEntitlements = user.featureEntitlements ?? [];
  return grantedEntitlements.some((grantedEntitlement) => matchesTenantEntitlement(grantedEntitlement, requiredEntitlement));
}

export function hasAnyTenantEntitlement(
  user: AuthenticatedUser | null | undefined,
  requiredEntitlements: readonly string[]
): boolean {
  if (!requiredEntitlements.length) {
    return true;
  }

  return requiredEntitlements.some((requiredEntitlement) => hasTenantEntitlement(user, requiredEntitlement));
}

function matchesTenantEntitlement(grantedEntitlement: string, requiredEntitlement: string) {
  if (grantedEntitlement === tenantEntitlementKeys.any || grantedEntitlement === requiredEntitlement) {
    return true;
  }

  return matchesNamespaceGrant(grantedEntitlement, requiredEntitlement, '.full')
    || matchesNamespaceGrant(grantedEntitlement, requiredEntitlement, '.basic');
}

function matchesNamespaceGrant(grantedEntitlement: string, requiredEntitlement: string, suffix: '.basic' | '.full') {
  if (!grantedEntitlement.endsWith(suffix)) {
    return false;
  }

  const namespace = grantedEntitlement.slice(0, -suffix.length);
  return requiredEntitlement.startsWith(`${namespace}.`);
}
