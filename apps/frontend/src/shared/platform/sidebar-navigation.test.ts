import { describe, expect, it } from 'vitest';
import { petSubmoduleEntitlements, tenantEntitlementKeys } from '@/shared/entitlements/tenant-entitlements';
import { filterSidebarItems } from '@/shared/platform/sidebar-navigation';
import type { AuthenticatedUser } from '@/shared/types/auth';

type NavigationItem = {
  href: string;
  label: string;
  anyOf?: string[];
  anyEntitlements?: readonly string[];
  moduleCode?: 'CRM' | 'IOT' | 'PET';
  group: 'core' | 'crm' | 'pet' | 'iot';
  platformOnly?: boolean;
};

const items: NavigationItem[] = [
  { href: '/dashboard', label: 'Overview', group: 'core' },
  { href: '/tenants', label: 'Tenants', group: 'core', anyOf: ['TENANT_READ'], platformOnly: true },
  { href: '/crm/dashboard', label: 'CRM Dashboard', group: 'crm', moduleCode: 'CRM', anyOf: ['crm.dashboard.read'] },
  {
    href: '/pet/dashboard',
    label: 'Pet Dashboard',
    group: 'pet',
    moduleCode: 'PET',
    anyOf: ['pet.dashboard.read'],
    anyEntitlements: petSubmoduleEntitlements
  },
  {
    href: '/iot/dashboard',
    label: 'IoT Dashboard',
    group: 'iot',
    moduleCode: 'IOT',
    anyOf: ['iot.dashboard.read'],
    anyEntitlements: [tenantEntitlementKeys.iotBasic]
  }
];

function createUser(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    userId: 'user-1',
    email: 'operator@tenant.test',
    fullName: 'Tenant Operator',
    tenantId: 'tenant-1',
    tenantName: 'Tenant One',
    tenantCode: 'tenant-one',
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
    featureEntitlements: [],
    ...overrides
  };
}

function visibleHrefs(user: AuthenticatedUser, availableCodes: string[], canManagePlatformAdministration = false) {
  return filterSidebarItems(items, {
    user,
    modules: {
      availableCodes,
      loading: false
    },
    workspace: {
      canManagePlatformAdministration
    }
  }).map((item) => item.href);
}

describe('filterSidebarItems contract scenarios', () => {
  it('keeps CRM-only workspaces isolated from Pet and IoT navigation', () => {
    const hrefs = visibleHrefs(
      createUser({
        permissions: ['crm.dashboard.read'],
        featureEntitlements: [tenantEntitlementKeys.crmBasic]
      }),
      ['CORE_PLATFORM', 'CRM']
    );

    expect(hrefs).toEqual(['/dashboard', '/crm/dashboard']);
  });

  it('keeps Pet-only workspaces isolated from CRM and IoT navigation', () => {
    const hrefs = visibleHrefs(
      createUser({
        permissions: ['pet.dashboard.read'],
        featureEntitlements: [tenantEntitlementKeys.petVeterinary]
      }),
      ['CORE_PLATFORM', 'PET']
    );

    expect(hrefs).toEqual(['/dashboard', '/pet/dashboard']);
  });

  it('keeps IoT-only workspaces isolated from CRM and Pet navigation', () => {
    const hrefs = visibleHrefs(
      createUser({
        permissions: ['iot.dashboard.read'],
        featureEntitlements: [tenantEntitlementKeys.iotBasic]
      }),
      ['CORE_PLATFORM', 'IOT']
    );

    expect(hrefs).toEqual(['/dashboard', '/iot/dashboard']);
  });

  it('shows both CRM and Pet navigation for combined contracts without leaking IoT', () => {
    const hrefs = visibleHrefs(
      createUser({
        permissions: ['crm.dashboard.read', 'pet.dashboard.read'],
        featureEntitlements: [tenantEntitlementKeys.crmFull, tenantEntitlementKeys.petFull]
      }),
      ['CORE_PLATFORM', 'CRM', 'PET']
    );

    expect(hrefs).toEqual(['/dashboard', '/crm/dashboard', '/pet/dashboard']);
  });

  it('removes downgraded modules even when stale entitlements remain on the session', () => {
    const hrefs = visibleHrefs(
      createUser({
        permissions: ['crm.dashboard.read', 'pet.dashboard.read', 'iot.dashboard.read'],
        featureEntitlements: [tenantEntitlementKeys.crmFull, tenantEntitlementKeys.petFull, tenantEntitlementKeys.iotBasic]
      }),
      ['CORE_PLATFORM', 'CRM']
    );

    expect(hrefs).toEqual(['/dashboard', '/crm/dashboard']);
  });

  it('shows all contracted navigation for wildcard access and keeps platform administration restricted to platform admins', () => {
    const tenantUserHrefs = visibleHrefs(
      createUser({
        permissions: ['crm.dashboard.read', 'pet.dashboard.read', 'iot.dashboard.read'],
        featureEntitlements: [tenantEntitlementKeys.any]
      }),
      ['CORE_PLATFORM', 'CRM', 'PET', 'IOT']
    );

    const platformAdminHrefs = visibleHrefs(
      createUser({
        platformAdmin: true,
        platformOwner: true,
        role: 'PLATFORM_ADMIN',
        roles: ['PLATFORM_ADMIN'],
        permissions: ['TENANT_READ'],
        featureEntitlements: [tenantEntitlementKeys.any]
      }),
      ['CORE_PLATFORM', 'CRM', 'PET', 'IOT'],
      true
    );

    expect(tenantUserHrefs).toEqual(['/dashboard', '/crm/dashboard', '/pet/dashboard', '/iot/dashboard']);
    expect(platformAdminHrefs).toEqual(['/dashboard', '/tenants', '/crm/dashboard', '/pet/dashboard', '/iot/dashboard']);
  });
});
