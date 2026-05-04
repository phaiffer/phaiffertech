import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Sidebar } from '@/shared/components/sidebar';
import { AuthenticatedUser } from '@/shared/types/auth';

const { navigationState, signOutMock, currentUser } = vi.hoisted(() => ({
  navigationState: { pathname: '/pet/follow-up' },
  signOutMock: vi.fn(),
  currentUser: {
    userId: 'user-1',
    fullName: 'Jane Operator',
    email: 'jane@phaiffer.test',
    role: 'PLATFORM_ADMIN',
    tenantId: '11111111-1111-1111-1111-111111111111',
    tenantName: 'PhaifferTech',
    tenantCode: 'default',
    tenantPlanCode: 'BANHO_TOSA_CLINICA',
    tenantLogoUrl: null,
    tenantPrimaryColor: '#0f172a',
    tenantAccentColor: '#2563eb',
    tenantDefaultThemeMode: 'SYSTEM',
    tenantAllowUserThemeOverride: true,
    platformOwner: true,
    platformAdmin: true,
    permissions: [],
    featureEntitlements: ['crm.full', 'pet.full']
  } as AuthenticatedUser
}));

vi.mock('next/navigation', () => ({
  usePathname: () => navigationState.pathname
}));

vi.mock('@/shared/auth/use-auth', () => ({
  useAuth: () => ({
    signOut: signOutMock
  })
}));

vi.mock('@/shared/platform/use-frontend-platform', () => ({
  useFrontendPlatform: () => ({
    user: currentUser,
    theme: {
      mode: 'system',
      setMode: vi.fn(),
      tenantDefaultMode: 'system',
      canOverride: true
    },
    branding: {
      logoUrl: null,
      scopeName: currentUser.tenantName,
      tenantCode: currentUser.tenantCode,
      style: {}
    },
    workspace: {
      workspaceLabel: currentUser.platformAdmin ? 'Platform control plane' : 'Tenant workspace',
      accessLabel: currentUser.platformAdmin ? 'Platform owner tenant' : 'Contracted SaaS workspace',
      isPlatformOwnerTenant: currentUser.platformOwner,
      hasSystemAdminRole: false,
      hasFullPlatformVisibility: currentUser.platformAdmin || currentUser.platformOwner,
      canManagePlatformAdministration: currentUser.platformAdmin
    },
    modules: {
      items: [
        { code: 'CORE_PLATFORM', name: 'Core Platform', description: 'Core', enabled: true, moduleEnabled: true, featureFlagEnabled: true, available: true },
        { code: 'CRM', name: 'CRM', description: 'CRM', enabled: true, moduleEnabled: true, featureFlagEnabled: true, available: true },
        { code: 'PET', name: 'PetFlow', description: 'Pet', enabled: true, moduleEnabled: true, featureFlagEnabled: true, available: true }
      ],
      loading: false,
      error: null,
      availableCodes: ['CORE_PLATFORM', 'CRM', 'PET'],
      contractedProducts: [
        { code: 'CRM', name: 'CRM', description: 'CRM', enabled: true, moduleEnabled: true, featureFlagEnabled: true, available: true },
        { code: 'PET', name: 'PetFlow', description: 'Pet', enabled: true, moduleEnabled: true, featureFlagEnabled: true, available: true }
      ]
    }
  })
}));

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigationState.pathname = '/pet/follow-up';
    currentUser.email = 'jane@phaiffer.test';
    currentUser.role = 'PLATFORM_ADMIN';
    currentUser.platformAdmin = true;
    currentUser.platformOwner = true;
    currentUser.tenantPlanCode = 'BANHO_TOSA_CLINICA';
    currentUser.permissions = ['TENANT_READ', 'USER_READ', 'crm.task.read', 'crm.deal.read', 'pet.appointment.read', 'crm.dashboard.read', 'pet.dashboard.read'];
    currentUser.featureEntitlements = ['crm.full', 'pet.full'];
  });

  it('renders the reduced PetFlow-first navigation and keeps platform framing visible for admins', () => {
    const { container, getAllByText } = render(<Sidebar />);

    expect(container.textContent).toContain('PhaifferTech');
    expect(getAllByText('PetFlow').length).toBeGreaterThan(0);
    expect(container.querySelector('a[href="/dashboard"]')).not.toBeNull();
    expect(container.querySelector('a[href="/pet/appointments"]')).not.toBeNull();
    expect(container.querySelector('a[href="/pet/follow-up"]')).not.toBeNull();
    expect(container.querySelector('a[href="/pet/commercial"]')).not.toBeNull();
    expect(container.querySelector('a[href="/crm"]')).toBeNull();
    expect(container.querySelector('a[href="/tenants"]')).toBeNull();
  });

  it('hides platform-only tenant administration for regular tenant users', () => {
    currentUser.role = 'TENANT_ADMIN';
    currentUser.platformAdmin = false;
    currentUser.platformOwner = false;

    const { container } = render(<Sidebar />);

    expect(container.querySelector('a[href="/tenants"]')).toBeNull();
    expect(container.querySelector('a[href="/dashboard"]')).not.toBeNull();
    expect(container.querySelector('a[href="/crm"]')).toBeNull();
  });

  it('does not expose non-Pet product navigation even when those products are contracted internally', () => {
    currentUser.permissions = ['crm.task.read', 'crm.deal.read', 'pet.appointment.read'];
    currentUser.featureEntitlements = ['crm.full', 'pet.full'];
    navigationState.pathname = '/dashboard';

    const { container } = render(<Sidebar />);

    expect(container.querySelector('a[href="/dashboard"]')).not.toBeNull();
    expect(container.querySelector('a[href="/pet/appointments"]')).not.toBeNull();
    expect(container.querySelector('a[href="/pet/follow-up"]')).not.toBeNull();
    expect(container.querySelector('a[href="/pet/commercial"]')).not.toBeNull();
    expect(container.querySelector('a[href="/crm"]')).toBeNull();
  });

  it('keeps grooming-only PetFlow navigation visible while filtering generic and veterinary areas', () => {
    currentUser.role = 'TENANT_ADMIN';
    currentUser.platformAdmin = false;
    currentUser.platformOwner = false;
    currentUser.tenantPlanCode = 'BANHO_TOSA';
    currentUser.permissions = [
      'pet.dashboard.read',
      'pet.client.read',
      'pet.profile.read',
      'pet.appointment.read',
      'pet.service.read',
      'pet.medical-record.read',
      'finance.read',
      'pet.plan.read',
      'pet.product.read',
      'pet.invoice.read',
      'pet.professional.read'
    ];
    currentUser.featureEntitlements = ['pet.aesthetics', 'pet.retail'];
    navigationState.pathname = '/pet/dashboard';

    const { container } = render(<Sidebar />);

    expect(container.querySelector('a[href="/dashboard"]')).not.toBeNull();
    expect(container.querySelector('a[href="/pet/clients"]')).not.toBeNull();
    expect(container.querySelector('a[href="/pet/pets"]')).not.toBeNull();
    expect(container.querySelector('a[href="/pet/appointments"]')).not.toBeNull();
    expect(container.querySelector('a[href="/pet/services"]')).not.toBeNull();
    expect(container.querySelector('a[href="/pet/plans"]')).not.toBeNull();
    expect(container.querySelector('a[href="/pet/inventory"]')).not.toBeNull();
    expect(container.querySelector('a[href="/pet/invoices"]')).not.toBeNull();
    expect(container.querySelector('a[href="/pet/professionals"]')).not.toBeNull();
    expect(container.querySelector('a[href="/pet/commissions"]')).not.toBeNull();
    expect(container.querySelector('a[href="/pet/follow-up"]')).toBeNull();
    expect(container.querySelector('a[href="/pet/commercial"]')).toBeNull();
    expect(container.querySelector('a[href="/pet/clinic"]')).toBeNull();
    expect(container.querySelector('a[href="/pet/pos"]')).toBeNull();
    expect(container.querySelector('a[href="/pet/finance"]')).toBeNull();
  });

  it('keeps grooming package exclusions even for wildcard local access', () => {
    currentUser.email = 'admin@local.test';
    currentUser.role = 'TENANT_ADMIN';
    currentUser.platformAdmin = false;
    currentUser.platformOwner = false;
    currentUser.tenantPlanCode = 'BANHO_TOSA';
    currentUser.permissions = ['pet.medical-record.read', 'pet.product.read', 'pet.invoice.write'];
    currentUser.featureEntitlements = ['*'];
    navigationState.pathname = '/pet/dashboard';

    const { container } = render(<Sidebar />);

    expect(container.querySelector('a[href="/pet/clinic"]')).toBeNull();
    expect(container.querySelector('a[href="/pet/pos"]')).toBeNull();
  });
});
