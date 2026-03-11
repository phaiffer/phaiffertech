import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PetHome } from '@/modules/pet/pet-home';
import type { FrontendPlatformState } from '@/shared/platform/frontend-platform.types';

const { currentPlatformState, currentPermissions } = vi.hoisted(() => ({
  currentPlatformState: {
    user: {
      userId: 'user-1',
      email: 'pet@tenant.test',
      fullName: 'Pet Operator',
      tenantId: 'tenant-1',
      tenantName: 'Clinic North',
      tenantCode: 'clinic-north',
      tenantLogoUrl: null,
      tenantPrimaryColor: '#0f172a',
      tenantAccentColor: '#2563eb',
      tenantDefaultThemeMode: 'LIGHT',
      tenantAllowUserThemeOverride: true,
      platformOwner: false,
      platformAdmin: false,
      role: 'TENANT_ADMIN',
      permissions: []
    },
    theme: {
      mode: 'light',
      setMode: vi.fn(),
      tenantDefaultMode: 'light',
      canOverride: true
    },
    branding: {
      logoUrl: null,
      scopeName: 'Clinic North',
      tenantCode: 'clinic-north',
      style: {}
    },
    workspace: {
      workspaceLabel: 'Tenant workspace',
      accessLabel: 'Contracted SaaS workspace',
      isPlatformOwnerTenant: false,
      hasSystemAdminRole: false,
      hasFullPlatformVisibility: false,
      canManagePlatformAdministration: false
    },
    modules: {
      items: [],
      loading: false,
      error: null,
      availableCodes: ['PET'],
      contractedProducts: []
    }
  } as FrontendPlatformState,
  currentPermissions: ['pet.dashboard.read', 'pet.appointment.read', 'pet.medical-record.read']
}));

vi.mock('@/shared/platform/use-frontend-platform', () => ({
  useFrontendPlatform: () => currentPlatformState
}));

vi.mock('@/shared/auth/usePermissions', () => ({
  usePermissions: () => ({
    hasPermission: (permission: string) => currentPermissions.includes(permission),
    hasAnyPermission: (permissions: string[]) => permissions.some((permission) => currentPermissions.includes(permission))
  })
}));

vi.mock('@/shared/services/pet-service', () => ({
  petService: {
    getDashboardSummary: vi.fn()
  }
}));

import { petService } from '@/shared/services/pet-service';

describe('PetHome', () => {
  beforeEach(() => {
    currentPermissions.splice(0, currentPermissions.length, 'pet.dashboard.read', 'pet.appointment.read', 'pet.medical-record.read');
    vi.clearAllMocks();
  });

  it('renders a tenant-scoped PetFlow workspace with medical access and summary pulse', async () => {
    vi.mocked(petService.getDashboardSummary).mockResolvedValue({
      totalClients: 28,
      totalPets: 43,
      appointmentsToday: 9,
      upcomingAppointments: 14,
      totalServices: 12,
      lowStockProducts: 2,
      pendingInvoices: 3,
      summaryCards: [
        { key: 'clients', label: 'Clients', value: 28, status: 'ok' },
        { key: 'pets', label: 'Pets', value: 43, status: 'info' },
        { key: 'appointments', label: 'Appointments', value: 9, status: 'active' },
        { key: 'invoices', label: 'Invoices', value: 3, status: 'pending' }
      ],
      sections: [
        {
          key: 'clinical-feed',
          title: 'Clinical Feed',
          description: 'Recent patient movement',
          cards: [],
          metrics: [],
          items: [
            {
              id: 'appt-1',
              label: 'Bella · Vaccination',
              sublabel: 'Scheduled with Dr. Silva',
              status: 'scheduled',
              timestamp: '2026-03-10T11:00:00Z'
            }
          ],
          timeSeries: []
        }
      ]
    });

    render(<PetHome />);

    await waitFor(() => {
      expect(petService.getDashboardSummary).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByRole('heading', { name: 'Clinic North · PetFlow' })).toBeInTheDocument();
    expect(screen.getByText('Open appointments')).toBeInTheDocument();
    expect(screen.getByText('Open medical records')).toBeInTheDocument();
    expect(screen.getByText('Review products')).toBeInTheDocument();
    expect(screen.getByText('Product access required')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /review products/i })).not.toBeInTheDocument();
    expect(screen.getByText('Clinic Snapshot')).toBeInTheDocument();
    expect(screen.getByText('Clinical Feed')).toBeInTheDocument();
  });

  it('shows guided first-use messaging when the PetFlow workspace has no records yet', async () => {
    vi.mocked(petService.getDashboardSummary).mockResolvedValue({
      totalClients: 0,
      totalPets: 0,
      appointmentsToday: 0,
      upcomingAppointments: 0,
      totalServices: 0,
      lowStockProducts: 0,
      pendingInvoices: 0,
      summaryCards: [],
      sections: []
    });

    render(<PetHome />);

    await waitFor(() => {
      expect(petService.getDashboardSummary).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText('Set up the PetFlow workspace')).toBeInTheDocument();
    expect(screen.getByText('PetFlow workspace not configured yet')).toBeInTheDocument();
    expect(screen.getByText(/does not have the first clinic entities in place yet/i)).toBeInTheDocument();
    expect(screen.getAllByText('Open appointments').length).toBeGreaterThan(0);
  });

  it('keeps PetFlow metrics capability-aware when dashboard permission is missing', () => {
    currentPermissions.splice(0, currentPermissions.length, 'pet.appointment.read', 'pet.medical-record.read');

    render(<PetHome />);

    expect(petService.getDashboardSummary).not.toHaveBeenCalled();
    expect(screen.getAllByText('Dashboard visibility required').length).toBeGreaterThan(0);
    expect(screen.getAllByText('No Permission').length).toBeGreaterThan(0);
    expect(screen.getByText(/clinic snapshot requires `pet.dashboard.read`/i)).toBeInTheDocument();
  });
});
