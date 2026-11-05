import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TenantsPage from '@/app/(app)/tenants/page';
import { featureFlagService } from '@/shared/services/feature-flag-service';
import { supportImpersonationService } from '@/shared/services/support-impersonation-service';
import { tenantService } from '@/shared/services/tenant-service';
import { Tenant } from '@/shared/types/tenant';

const { hasPermissionMock, currentUser, signInMock, pushMock, setImpersonationBackupSessionMock } = vi.hoisted(() => ({
  hasPermissionMock: vi.fn<(permission: string) => boolean>(),
  signInMock: vi.fn(),
  pushMock: vi.fn(),
  setImpersonationBackupSessionMock: vi.fn(),
  currentUser: {
    userId: 'user-1',
    email: 'admin@phaiffer.test',
    fullName: 'Platform Admin',
    tenantId: 'tenant-1',
    tenantName: 'PhaifferTech',
    tenantCode: 'default',
    tenantLogoUrl: null,
    tenantPrimaryColor: '#0f172a',
    tenantAccentColor: '#2563eb',
    tenantDefaultThemeMode: 'SYSTEM' as 'SYSTEM',
    tenantAllowUserThemeOverride: true,
    platformOwner: true,
    platformAdmin: true,
    role: 'PLATFORM_ADMIN',
    permissions: ['TENANT_READ', 'TENANT_WRITE']
  }
}));

vi.mock('@/shared/auth/use-auth', () => ({
  useAuth: () => ({
    session: {
      accessToken: 'platform-token',
      user: currentUser
    },
    signIn: signInMock
  })
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/tenants',
  useRouter: () => ({
    push: pushMock
  })
}));

vi.mock('@/shared/auth/usePermissions', () => ({
  usePermissions: () => ({
    hasPermission: hasPermissionMock,
    hasAnyPermission: vi.fn().mockReturnValue(false)
  })
}));

vi.mock('@/shared/modules/use-module-catalog', () => ({
  useModuleCatalog: () => ({
    modules: [
      { code: 'CORE_PLATFORM', name: 'Core Platform', available: true },
      { code: 'PET', name: 'Pet Suite', available: true }
    ],
    loading: false,
    error: null
  })
}));

vi.mock('@/shared/services/tenant-service', () => ({
  tenantService: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    listUsageMetrics: vi.fn()
  }
}));

vi.mock('@/shared/services/feature-flag-service', () => ({
  featureFlagService: {
    listForTenant: vi.fn(),
    setTenantOverride: vi.fn(),
    clearTenantOverride: vi.fn()
  }
}));

vi.mock('@/shared/services/support-impersonation-service', () => ({
  supportImpersonationService: {
    start: vi.fn(),
    stop: vi.fn()
  }
}));

vi.mock('@/shared/lib/session', () => ({
  setImpersonationBackupSession: setImpersonationBackupSessionMock
}));

const clinicNorth: Tenant = {
  id: 'tenant-2',
  name: 'Clinic North',
  code: 'clinic-north',
  status: 'ACTIVE',
  planCode: 'BANHO_TOSA_CLINICA',
  featureEntitlements: ['beta.dashboard'],
  platformOwner: false,
  logoUrl: null,
  primaryColor: '#1e3a8a',
  accentColor: '#0ea5e9',
  defaultThemeMode: 'DARK',
  allowUserThemeOverride: false,
  contractedModules: ['CORE_PLATFORM', 'PET', 'CRM'],
  moduleOverrides: ['CRM']
};

function mockTenantList(items: Tenant[]) {
  vi.mocked(tenantService.list).mockResolvedValue({
    items,
    totalItems: items.length,
    totalPages: items.length > 0 ? 1 : 0,
    page: 0,
    size: 14
  });
}

async function openNewTenantEditor() {
  mockTenantList([]);
  render(<TenantsPage />);
  fireEvent.click((await screen.findAllByRole('button', { name: 'New workspace' }))[0]);
}

async function openEditor() {
  mockTenantList([clinicNorth]);
  render(<TenantsPage />);
  await screen.findByText('Clinic North');
  fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
}

describe('TenantsPage access model', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hasPermissionMock.mockImplementation((permission) => permission === 'TENANT_READ' || permission === 'TENANT_WRITE');
    currentUser.platformAdmin = true;
    vi.mocked(featureFlagService.listForTenant).mockResolvedValue([]);
    vi.mocked(tenantService.listUsageMetrics).mockResolvedValue([]);
  });

  it('does not call tenantService.list without TENANT_READ', async () => {
    hasPermissionMock.mockReturnValue(false);

    render(<TenantsPage />);

    await waitFor(() => {
      expect(screen.getByText('You do not have permission to view workspaces.')).toBeInTheDocument();
    });

    expect(tenantService.list).not.toHaveBeenCalled();
  });

  it('blocks tenant administration UI for non-platform admins even with TENANT_READ', async () => {
    currentUser.platformAdmin = false;
    render(<TenantsPage />);

    await waitFor(() => {
      expect(screen.getByText('Workspace administration is restricted to platform owner administrators.')).toBeInTheDocument();
    });

    expect(tenantService.list).not.toHaveBeenCalled();
  });

  it('lists workspaces with package and visible modules, keeping the editor closed', async () => {
    mockTenantList([clinicNorth]);

    render(<TenantsPage />);

    expect(await screen.findByText('Clinic North')).toBeInTheDocument();
    expect(screen.getByText('Grooming plus clinic')).toBeInTheDocument();
    expect(screen.getByText('BANHO_TOSA_CLINICA')).toBeInTheDocument();
    expect(screen.queryByText(/CRM/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Workspace name')).not.toBeInTheDocument();
  });

  it('shows every supported package and the entitlements each one grants', async () => {
    await openNewTenantEditor();

    ['PETSHOP', 'BANHO_TOSA', 'CLINICA_VETERINARIA', 'PETSHOP_BANHO_TOSA', 'BANHO_TOSA_CLINICA'].forEach((code) => {
      expect(screen.getByDisplayValue(code)).toBeInTheDocument();
    });

    expect(screen.getByText('Included by package')).toBeInTheDocument();

    const groomingPackage = screen.getByDisplayValue('BANHO_TOSA');
    fireEvent.click(groomingPackage);
    expect(groomingPackage).toBeChecked();
    expect(groomingPackage.closest('label')).toHaveTextContent('pet.aesthetics');
    expect(groomingPackage.closest('label')).not.toHaveTextContent('pet.retail');
    expect(screen.getByText(/PET, pet\.aesthetics$/)).toBeInTheDocument();
  });

  it('keeps the initial admin credential fields protected from autofill interference', async () => {
    await openNewTenantEditor();

    const emailInput = screen.getByLabelText('Initial admin email');
    const passwordInput = screen.getByLabelText('Temporary password');

    expect(emailInput).toHaveAttribute('name', 'initialAdminEmail');
    expect(emailInput).toHaveAttribute('autocomplete', 'section-workspace-admin email');
    expect(emailInput).toHaveAttribute('data-lpignore', 'true');
    expect(emailInput).toHaveAttribute('data-1p-ignore', 'true');
    expect(passwordInput).toHaveAttribute('name', 'temporaryPassword');
    expect(passwordInput).toHaveAttribute('autocomplete', 'section-workspace-admin new-password');
    expect(passwordInput).toHaveAttribute('data-lpignore', 'true');
    expect(passwordInput).toHaveAttribute('data-1p-ignore', 'true');
  });

  it('submits tenant creation with initial admin access details', async () => {
    vi.mocked(tenantService.create).mockResolvedValue({ ...clinicNorth, id: 'tenant-new', name: 'Clinic East' });

    await openNewTenantEditor();

    fireEvent.change(screen.getByLabelText('Workspace name'), { target: { value: ' Clinic East ' } });
    fireEvent.change(screen.getByLabelText('Workspace code'), { target: { value: ' CLINIC-EAST ' } });
    fireEvent.change(screen.getByLabelText('Trial end date'), { target: { value: '2026-09-30' } });
    fireEvent.change(screen.getByLabelText('Initial admin full name'), { target: { value: ' Jordan East ' } });
    fireEvent.change(screen.getByLabelText('Initial admin email'), { target: { value: ' ADMIN@Clinic-East.test ' } });
    fireEvent.change(screen.getByLabelText('Temporary password'), { target: { value: 'TempClinicEast@123' } });

    fireEvent.click(screen.getByRole('button', { name: 'Create workspace' }));

    await waitFor(() => {
      expect(tenantService.create).toHaveBeenCalledWith({
        name: 'Clinic East',
        code: 'clinic-east',
        status: 'ACTIVE',
        logoUrl: null,
        primaryColor: '#0f172a',
        accentColor: '#2563eb',
        defaultThemeMode: 'SYSTEM',
        allowUserThemeOverride: true,
        contractedModules: ['PET'],
        planCode: 'PETSHOP',
        featureEntitlements: [],
        trialEndDate: '2026-09-30',
        initialAdminFullName: 'Jordan East',
        initialAdminEmail: 'admin@clinic-east.test',
        temporaryPassword: 'TempClinicEast@123',
        requirePasswordChangeOnFirstAccess: true
      });
    });

    expect(await screen.findByText(/Workspace Clinic East created/)).toBeInTheDocument();
    expect(screen.queryByLabelText('Workspace name')).not.toBeInTheDocument();
  });

  it('loads feature flags and usage when editing, hiding legacy sources', async () => {
    vi.mocked(featureFlagService.listForTenant).mockResolvedValue([
      { key: 'crm.enabled', enabled: true, scope: 'GLOBAL' },
      { key: 'pet.enabled', enabled: true, scope: 'GLOBAL' }
    ]);
    vi.mocked(tenantService.listUsageMetrics).mockResolvedValue([
      { metricKey: 'api.request', source: 'crm', quantity: 4, unit: 'COUNT', metricDate: '2026-03-19', lastRecordedAt: '2026-03-19T12:00:00Z' },
      { metricKey: 'api.request', source: 'pet', quantity: 2, unit: 'COUNT', metricDate: '2026-03-19', lastRecordedAt: '2026-03-19T12:05:00Z' }
    ]);

    await openEditor();

    await waitFor(() => {
      expect(featureFlagService.listForTenant).toHaveBeenCalledWith('tenant-2');
      expect(tenantService.listUsageMetrics).toHaveBeenCalledWith('tenant-2');
    });

    expect(await screen.findByText('pet.enabled')).toBeInTheDocument();
    expect(screen.queryByText('crm.enabled')).not.toBeInTheDocument();
    expect(await screen.findByText('Api Request')).toBeInTheDocument();
    expect(screen.getByText('Pet')).toBeInTheDocument();
    expect(screen.queryByText('Crm')).not.toBeInTheDocument();
  });

  it('submits normalized feature entitlements when updating a tenant', async () => {
    vi.mocked(tenantService.update).mockResolvedValue(clinicNorth);

    await openEditor();

    fireEvent.change(screen.getByPlaceholderText('beta.dashboard'), { target: { value: ' Usage.Billing.Preview ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add entitlement' }));
    fireEvent.click(screen.getByRole('button', { name: 'Update workspace' }));

    await waitFor(() => {
      expect(tenantService.update).toHaveBeenCalledWith('tenant-2', expect.objectContaining({
        featureEntitlements: ['beta.dashboard', 'usage.billing.preview'],
        contractedModules: ['PET', 'CRM']
      }));
    });
  });

  it('requires a reason before starting a support session', async () => {
    await openEditor();

    fireEvent.click(screen.getByRole('button', { name: 'Start support session' }));

    expect(await screen.findByText('Enter a reason with at least 10 characters.')).toBeInTheDocument();
    expect(supportImpersonationService.start).not.toHaveBeenCalled();
  });

  it('starts a support session for the selected customer workspace', async () => {
    vi.mocked(supportImpersonationService.start).mockResolvedValue({
      accessToken: 'impersonated-token',
      expiresInSeconds: 900,
      user: {
        ...currentUser,
        tenantId: 'tenant-2',
        tenantName: 'Clinic North',
        tenantCode: 'clinic-north',
        platformOwner: false,
        platformAdmin: false,
        impersonation: {
          sessionId: 'session-1',
          sourceTenantId: 'tenant-1',
          sourceTenantName: 'PhaifferTech',
          sourceTenantCode: 'default',
          startedAt: '2026-03-19T12:00:00Z',
          expiresAt: '2026-03-19T12:15:00Z'
        }
      }
    });

    await openEditor();

    fireEvent.change(screen.getByPlaceholderText('Describe why support access is needed for this workspace.'), {
      target: { value: 'Investigate records for onboarding review' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Start support session' }));

    await waitFor(() => {
      expect(supportImpersonationService.start).toHaveBeenCalledWith({
        targetTenantId: 'tenant-2',
        reason: 'Investigate records for onboarding review',
        durationMinutes: 15
      });
      expect(setImpersonationBackupSessionMock).toHaveBeenCalledWith({
        accessToken: 'platform-token',
        user: currentUser
      });
      expect(signInMock).toHaveBeenCalledWith({
        accessToken: 'impersonated-token',
        user: expect.objectContaining({ tenantId: 'tenant-2' })
      });
      expect(pushMock).toHaveBeenCalledWith('/dashboard');
    });
  });
});
