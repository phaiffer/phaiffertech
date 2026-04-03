import { describe, expect, it } from 'vitest';
import {
  describePetServiceCatalogItem,
  resolveAllowedPetServiceCategories
} from '@/modules/pet/pet-service-catalog-policy';
import type { AuthenticatedUser } from '@/shared/types/auth';

function createUser(featureEntitlements: string[]): AuthenticatedUser {
  return {
    userId: 'user-1',
    email: 'operator@tenant.test',
    fullName: 'Tenant Operator',
    tenantId: 'tenant-1',
    tenantName: 'Tenant One',
    tenantCode: 'tenant-one',
    tenantPlanCode: 'BANHO_TOSA',
    tenantLogoUrl: null,
    tenantPrimaryColor: '#0f172a',
    tenantAccentColor: '#2563eb',
    tenantDefaultThemeMode: 'SYSTEM',
    tenantAllowUserThemeOverride: true,
    platformOwner: false,
    platformAdmin: false,
    role: 'TENANT_ADMIN',
    roles: ['TENANT_ADMIN'],
    permissions: [],
    featureEntitlements
  };
}

describe('pet service catalog policy', () => {
  it('resolves grooming-only tenants to grooming services', () => {
    expect(resolveAllowedPetServiceCategories(createUser(['pet.aesthetics', 'pet.retail']))).toEqual(['GROOMING']);
  });

  it('resolves clinical tenants to clinical services', () => {
    expect(resolveAllowedPetServiceCategories(createUser(['pet.clinic', 'pet.veterinary']))).toEqual(['CLINICAL']);
  });

  it('resolves hybrid and wildcard access to both service categories', () => {
    expect(resolveAllowedPetServiceCategories(createUser(['pet.aesthetics', 'pet.clinic']))).toEqual(['GROOMING', 'CLINICAL']);
    expect(resolveAllowedPetServiceCategories(createUser(['*']))).toEqual(['GROOMING', 'CLINICAL']);
  });

  it('describes service catalog items with category, duration, and price context', () => {
    expect(describePetServiceCatalogItem({
      id: 'service-1',
      name: 'Vaccination',
      category: 'CLINICAL',
      active: true,
      basePrice: 95,
      durationMinutes: 30,
      commissionEligible: false,
      allowInPlans: false,
      allowStandaloneBooking: true,
      createdAt: '2026-04-03T00:00:00Z',
      updatedAt: '2026-04-03T00:00:00Z'
    }, 'en-US')).toContain('Vaccination · Clinical · 30 min');
  });
});
