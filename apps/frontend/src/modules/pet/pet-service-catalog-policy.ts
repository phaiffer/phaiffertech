import { hasAnyTenantEntitlement, tenantEntitlementKeys } from '@/shared/entitlements/tenant-entitlements';
import type { AuthenticatedUser } from '@/shared/types/auth';
import type { PetServiceCatalog, PetServiceCategory } from '@/shared/types/pet';

export type PetServiceBookingMode = 'FLEXIBLE' | 'PLAN_ONLY' | 'STANDALONE_ONLY' | 'UNAVAILABLE';

export const petServiceCategoryLabels: Record<PetServiceCategory, string> = {
  GROOMING: 'Banho e Tosa',
  CLINICAL: 'Clinica'
};

const petServiceCategoryLabelsEnUs: Record<PetServiceCategory, string> = {
  GROOMING: 'Grooming',
  CLINICAL: 'Clinical'
};

export function resolveAllowedPetServiceCategories(
  user: AuthenticatedUser | null | undefined
): PetServiceCategory[] {
  const categories: PetServiceCategory[] = [];

  if (hasAnyTenantEntitlement(user, [tenantEntitlementKeys.petAesthetics])) {
    categories.push('GROOMING');
  }

  if (hasAnyTenantEntitlement(user, [tenantEntitlementKeys.petClinic, tenantEntitlementKeys.petVeterinary])) {
    categories.push('CLINICAL');
  }

  return categories;
}

export function formatPetServiceCategory(category: PetServiceCategory, locale = 'pt-BR') {
  return locale === 'en-US' ? petServiceCategoryLabelsEnUs[category] : petServiceCategoryLabels[category];
}

export function resolvePetServiceBookingMode(service: Pick<PetServiceCatalog, 'allowInPlans' | 'allowStandaloneBooking'>): PetServiceBookingMode {
  if (service.allowInPlans && service.allowStandaloneBooking) {
    return 'FLEXIBLE';
  }

  if (service.allowInPlans) {
    return 'PLAN_ONLY';
  }

  if (service.allowStandaloneBooking) {
    return 'STANDALONE_ONLY';
  }

  return 'UNAVAILABLE';
}

export function describePetServiceCatalogItem(service: PetServiceCatalog, locale: string) {
  const priceLabel = service.basePrice.toLocaleString(locale === 'pt-BR' ? 'pt-BR' : 'en-US', {
    style: 'currency',
    currency: 'BRL'
  });

  return `${service.name} - ${formatPetServiceCategory(service.category, locale)} - ${service.durationMinutes} min - ${priceLabel}`;
}
