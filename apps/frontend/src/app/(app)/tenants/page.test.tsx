import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TenantsPage from '@/app/(app)/tenants/page';
import { featureFlagService } from '@/shared/services/feature-flag-service';
import { supportImpersonationService } from '@/shared/services/support-impersonation-service';
import { tenantService } from '@/shared/services/tenant-service';

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
      { code: 'PET', name: 'PetFlow', available: true }
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

  it('renders tenant branding and contracted modules for platform admins', async () => {
    vi.mocked(tenantService.list).mockResolvedValue({
      items: [
        {
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
          contractedModules: ['CORE_PLATFORM', 'PET', 'CRM']
        }
      ],
      totalItems: 1,
      totalPages: 1,
      page: 0,
      size: 20
    });

    render(<TenantsPage />);

    await waitFor(() => {
      expect(tenantService.list).toHaveBeenCalledTimes(1);
    });

    expect(await screen.findByText('Clinic North')).toBeInTheDocument();
    expect(screen.getAllByText(/active/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText('BANHO_TOSA_CLINICA').length).toBeGreaterThan(0);
    expect(screen.getByText('beta.dashboard')).toBeInTheDocument();
    expect(screen.getAllByText('CORE_PLATFORM').length).toBeGreaterThan(0);
    expect(screen.getAllByText('PET').length).toBeGreaterThan(0);
    expect(screen.queryByText('CRM')).not.toBeInTheDocument();
  });

  it('shows the selected package defaults as a read-only hint', async () => {
    vi.mocked(tenantService.list).mockResolvedValue({
      items: [],
      totalItems: 0,
      totalPages: 0,
      page: 0,
      size: 20
    });

    render(<TenantsPage />);

    await waitFor(() => {
      expect(tenantService.list).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText('Package defines default modules and features.')).toBeInTheDocument();
    expect(screen.getAllByText('PET').length).toBeGreaterThan(0);
    expect(screen.getAllByText('pet.retail').length).toBeGreaterThan(0);
    expect(screen.getByText('Included by package')).toBeInTheDocument();
  });

  it('shows every supported commercial package and keeps the preview aligned with the selected option', async () => {
    vi.mocked(tenantService.list).mockResolvedValue({
      items: [],
      totalItems: 0,
      totalPages: 0,
      page: 0,
      size: 20
    });

    render(<TenantsPage />);

    await waitFor(() => {
      expect(tenantService.list).toHaveBeenCalledTimes(1);
    });

    ['PETSHOP', 'BANHO_TOSA', 'CLINICA_VETERINARIA', 'PETSHOP_BANHO_TOSA', 'BANHO_TOSA_CLINICA'].forEach((code) => {
      expect(screen.getAllByText(code).length).toBeGreaterThan(0);
    });

    const packagePreview = screen.getByText(/Selected package:/);
    expect(packagePreview).toHaveTextContent('PETSHOP');

    const groomingPackage = screen.getByDisplayValue('BANHO_TOSA');
    fireEvent.click(groomingPackage);
    expect(groomingPackage).toBeChecked();
    expect(groomingPackage.closest('label')).toHaveTextContent('pet.aesthetics');
    expect(groomingPackage.closest('label')).not.toHaveTextContent('pet.retail');
    expect(packagePreview.parentElement).toHaveTextContent('pet.aesthetics');
    expect(packagePreview.parentElement).not.toHaveTextContent('pet.retail');

    const retailPackage = screen.getByDisplayValue('PETSHOP');
    fireEvent.click(retailPackage);
    expect(retailPackage.closest('label')).toHaveTextContent('pet.retail');

    const combinedPackage = screen.getByDisplayValue('PETSHOP_BANHO_TOSA');
    fireEvent.click(combinedPackage);
    expect(combinedPackage.closest('label')).toHaveTextContent('pet.aesthetics');
    expect(combinedPackage.closest('label')).toHaveTextContent('pet.retail');

    const hybridPackage = screen.getByRole('radio', { name: /BANHO_TOSA_CLINICA/i });
    fireEvent.click(hybridPackage);

    expect(hybridPackage).toBeChecked();
    expect(packagePreview).toHaveTextContent('BANHO_TOSA_CLINICA');
  });

  it('keeps the initial admin credential fields stable and protected from autofill interference', async () => {
    vi.mocked(tenantService.list).mockResolvedValue({
      items: [],
      totalItems: 0,
      totalPages: 0,
      page: 0,
      size: 20
    });

    render(<TenantsPage />);

    await waitFor(() => {
      expect(tenantService.list).toHaveBeenCalledTimes(1);
    });

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

    fireEvent.change(emailInput, { target: { value: 'a' } });
    expect(screen.getByLabelText('Initial admin email')).toBe(emailInput);

    fireEvent.change(emailInput, { target: { value: 'admin@tenant.test' } });
    expect(screen.getByLabelText('Initial admin email')).toBe(emailInput);
    expect(emailInput).toHaveValue('admin@tenant.test');
  });

  it('submits tenant creation with initial admin access details', async () => {
    vi.mocked(tenantService.list).mockResolvedValue({
      items: [],
      totalItems: 0,
      totalPages: 0,
      page: 0,
      size: 20
    });
    vi.mocked(tenantService.create).mockResolvedValue({
      id: 'tenant-new',
      name: 'Clinic East',
      code: 'clinic-east',
      status: 'ACTIVE',
      planCode: 'PETSHOP',
      trialEndDate: '2026-09-30',
      featureEntitlements: [],
      platformOwner: false,
      logoUrl: null,
      primaryColor: '#0f172a',
      accentColor: '#2563eb',
      defaultThemeMode: 'SYSTEM',
      allowUserThemeOverride: true,
      contractedModules: ['CORE_PLATFORM', 'PET']
    });

    render(<TenantsPage />);

    await waitFor(() => {
      expect(tenantService.list).toHaveBeenCalledTimes(1);
    });

    fireEvent.change(screen.getByLabelText('Workspace name'), {
      target: { value: ' Clinic East ' }
    });
    fireEvent.change(screen.getByLabelText('Workspace code'), {
      target: { value: ' CLINIC-EAST ' }
    });
    fireEvent.change(screen.getByLabelText('Trial end date'), {
      target: { value: '2026-09-30' }
    });
    fireEvent.change(screen.getByLabelText('Initial admin full name'), {
      target: { value: ' Jordan East ' }
    });
    fireEvent.change(screen.getByLabelText('Initial admin email'), {
      target: { value: ' ADMIN@Clinic-East.test ' }
    });
    fireEvent.change(screen.getByLabelText('Temporary password'), {
      target: { value: 'TempClinicEast@123' }
    });

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
  });

  it('loads feature flags and usage telemetry when editing an existing tenant', async () => {
    vi.mocked(tenantService.list).mockResolvedValue({
      items: [
        {
          id: 'tenant-2',
          name: 'Clinic North',
          code: 'clinic-north',
          status: 'ACTIVE',
          planCode: 'BANHO_TOSA_CLINICA',
          featureEntitlements: ['beta.dashboard'],
          effectiveFeatureEntitlements: ['pet.aesthetics', 'pet.clinic', 'pet.veterinary', 'pet.retail', 'beta.dashboard'],
          platformOwner: false,
          logoUrl: null,
          primaryColor: '#1e3a8a',
          accentColor: '#0ea5e9',
          defaultThemeMode: 'DARK',
          allowUserThemeOverride: false,
          contractedModules: ['CORE_PLATFORM', 'PET', 'CRM'],
          moduleOverrides: ['CRM']
        }
      ],
      totalItems: 1,
      totalPages: 1,
      page: 0,
      size: 20
    });
    vi.mocked(featureFlagService.listForTenant).mockResolvedValue([
      { key: 'crm.enabled', enabled: true, scope: 'GLOBAL' },
      { key: 'pet.enabled', enabled: true, scope: 'GLOBAL' }
    ]);
    vi.mocked(tenantService.listUsageMetrics).mockResolvedValue([
      {
        metricKey: 'api.request',
        source: 'crm',
        quantity: 4,
        unit: 'COUNT',
        metricDate: '2026-03-19',
        lastRecordedAt: '2026-03-19T12:00:00Z'
      },
      {
        metricKey: 'api.request',
        source: 'pet',
        quantity: 2,
        unit: 'COUNT',
        metricDate: '2026-03-19',
        lastRecordedAt: '2026-03-19T12:05:00Z'
      }
    ]);

    render(<TenantsPage />);

    expect(await screen.findByText('Clinic North')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));

    await waitFor(() => {
      expect(featureFlagService.listForTenant).toHaveBeenCalledWith('tenant-2');
      expect(tenantService.listUsageMetrics).toHaveBeenCalledWith('tenant-2');
    });

    expect(await screen.findByText('pet.enabled')).toBeInTheDocument();
    expect(screen.queryByText('crm.enabled')).not.toBeInTheDocument();
    expect(screen.getByText('Api Request')).toBeInTheDocument();
    expect(screen.getByText('Pet')).toBeInTheDocument();
    expect(screen.queryByText('Crm')).not.toBeInTheDocument();
    expect(screen.getByText('Tracked signals')).toBeInTheDocument();
    expect(screen.getByText('Observed activity')).toBeInTheDocument();
  });

  it('shows package baseline, manual overrides, and effective access when editing a tenant', async () => {
    vi.mocked(tenantService.list).mockResolvedValue({
      items: [
        {
          id: 'tenant-2',
          name: 'Clinic North',
          code: 'clinic-north',
          status: 'ACTIVE',
          planCode: 'PETSHOP',
          featureEntitlements: ['usage.billing.preview'],
          effectiveFeatureEntitlements: ['pet.retail', 'usage.billing.preview'],
          platformOwner: false,
          logoUrl: null,
          primaryColor: '#1e3a8a',
          accentColor: '#0ea5e9',
          defaultThemeMode: 'DARK',
          allowUserThemeOverride: false,
          contractedModules: ['CORE_PLATFORM', 'CRM', 'PET'],
          moduleOverrides: ['CRM']
        }
      ],
      totalItems: 1,
      totalPages: 1,
      page: 0,
      size: 20
    });

    render(<TenantsPage />);

    expect(await screen.findByText('Clinic North')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));

    expect(screen.getAllByText('Package baseline').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Manual module overrides').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Effective access').length).toBeGreaterThan(0);
    expect(screen.getAllByText('No visible manual module overrides are active for this workspace.').length).toBeGreaterThan(0);
    expect(screen.getAllByText('usage.billing.preview').length).toBeGreaterThan(0);
    expect(screen.queryByText('CRM')).not.toBeInTheDocument();
  });

  it('submits normalized feature entitlements when updating a tenant', async () => {
    vi.mocked(tenantService.list).mockResolvedValue({
      items: [
        {
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
          contractedModules: ['CORE_PLATFORM', 'CRM']
        }
      ],
      totalItems: 1,
      totalPages: 1,
      page: 0,
      size: 20
    });
    vi.mocked(tenantService.update).mockResolvedValue({
      id: 'tenant-2',
      name: 'Clinic North',
      code: 'clinic-north',
      status: 'ACTIVE',
      planCode: 'BANHO_TOSA_CLINICA',
      featureEntitlements: ['beta.dashboard', 'usage.billing.preview'],
      platformOwner: false,
      logoUrl: null,
      primaryColor: '#1e3a8a',
      accentColor: '#0ea5e9',
      defaultThemeMode: 'DARK',
      allowUserThemeOverride: false,
      contractedModules: ['CORE_PLATFORM', 'CRM']
    });

    render(<TenantsPage />);

    expect(await screen.findByText('Clinic North')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByPlaceholderText('beta.dashboard'), {
      target: { value: ' Usage.Billing.Preview ' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add entitlement' }));
    fireEvent.click(screen.getByRole('button', { name: 'Update workspace' }));

    await waitFor(() => {
      expect(tenantService.update).toHaveBeenCalledWith('tenant-2', expect.objectContaining({
        featureEntitlements: ['beta.dashboard', 'usage.billing.preview'],
        contractedModules: ['PET', 'CRM']
      }));
    });
  });

  it('starts support impersonation for the selected customer tenant', async () => {
    vi.mocked(tenantService.list).mockResolvedValue({
      items: [
        {
          id: 'tenant-2',
          name: 'Clinic North',
          code: 'clinic-north',
          status: 'ACTIVE',
          planCode: 'BANHO_TOSA_CLINICA',
          featureEntitlements: [],
          platformOwner: false,
          logoUrl: null,
          primaryColor: '#1e3a8a',
          accentColor: '#0ea5e9',
          defaultThemeMode: 'DARK',
          allowUserThemeOverride: false,
          contractedModules: ['CORE_PLATFORM', 'CRM']
        }
      ],
      totalItems: 1,
      totalPages: 1,
      page: 0,
      size: 20
    });
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

    render(<TenantsPage />);

    expect(await screen.findByText('Clinic North')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByPlaceholderText('Describe why support access is needed for this workspace.'), {
      target: { value: 'Investigate CRM records for onboarding review' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Start support impersonation' }));

    await waitFor(() => {
      expect(supportImpersonationService.start).toHaveBeenCalledWith({
        targetTenantId: 'tenant-2',
        reason: 'Investigate CRM records for onboarding review',
        durationMinutes: 15
      });
      expect(setImpersonationBackupSessionMock).toHaveBeenCalledWith({
        accessToken: 'platform-token',
        user: currentUser
      });
      expect(signInMock).toHaveBeenCalledWith({
        accessToken: 'impersonated-token',
        user: expect.objectContaining({
          tenantId: 'tenant-2',
          impersonation: expect.objectContaining({
            sessionId: 'session-1'
          })
        })
      });
      expect(pushMock).toHaveBeenCalledWith('/dashboard');
    });
  });
});
