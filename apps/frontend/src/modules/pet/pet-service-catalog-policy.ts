import { hasAnyTenantEntitlement, tenantEntitlementKeys } from '@/shared/entitlements/tenant-entitlements';
import type { AuthenticatedUser } from '@/shared/types/auth';
import type { PetServiceCatalog, PetServiceCategory } from '@/shared/types/pet';

export const petServiceCategoryLabels: Record<PetServiceCategory, string> = {
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

export function formatPetServiceCategory(category: PetServiceCategory) {
  return petServiceCategoryLabels[category];
}

export function describePetServiceCatalogItem(service: PetServiceCatalog, locale: string) {
  const priceLabel = service.basePrice.toLocaleString(locale === 'pt-BR' ? 'pt-BR' : 'en-US', {
    style: 'currency',
    currency: 'BRL'
  });

  return `${service.name} · ${formatPetServiceCategory(service.category)} · ${service.durationMinutes} min · ${priceLabel}`;
}
