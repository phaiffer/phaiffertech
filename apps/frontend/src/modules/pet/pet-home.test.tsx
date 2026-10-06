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
      permissions: [],
      featureEntitlements: ['pet.aesthetics', 'pet.clinic', 'pet.retail', 'pet.veterinary']
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
    visualProfile: {
      key: 'pet-clinic',
      label: 'Pet Clinic',
      accentFallback: '#0f766e',
      primaryFallback: '#164e63',
      accentColor: '#2563eb',
      primaryColor: '#0f172a',
      accentTone: { emphasis: 'clinical', softAlpha: 0.18, highlightAlpha: 0.14 },
      backgroundMood: { softness: 'soft', accentOpacity: 0.11, supportOpacity: 0.09, accentAnchor: 'top left', supportAnchor: 'bottom center' },
      surfaceNuance: { tintOpacity: 0.15, borderOpacity: 0.17, elevation: 'quiet' },
      iconTone: { emphasisOpacity: 0.16, mutedOpacity: 0.08 },
      chartHighlightTone: { accentOpacity: 0.22, supportOpacity: 0.12 },
      dashboardHighlightTone: { accentOpacity: 0.12, supportOpacity: 0.09 },
      loginVisualContext: { accentOpacity: 0.11, supportOpacity: 0.1, cardTintOpacity: 0.05, cardBorderOpacity: 0.16, brandMarkOpacity: 0.15 },
      illustrationPreset: 'clinical-care'
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
    currentPlatformState.user!.featureEntitlements = ['pet.aesthetics', 'pet.clinic', 'pet.retail', 'pet.veterinary'];
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
              label: 'Bella · Vacinacao',
              sublabel: 'Agendado com Dra. Silva',
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
    expect(screen.getByText('Fluxos centrais da demo PetFlow')).toBeInTheDocument();
    expect(screen.getByText('Revisar clientes')).toBeInTheDocument();
    expect(screen.getByText('Agendar atendimentos')).toBeInTheDocument();
    expect(screen.getByText('Gerir cobranca')).toBeInTheDocument();
    expect(screen.getAllByText('Abrir dashboard do PetFlow').length).toBeGreaterThan(0);
    expect(screen.getByText('Operacao ao vivo')).toBeInTheDocument();
    expect(screen.getByText('Fluxo clinico')).toBeInTheDocument();
  }, 10000);

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

    expect(screen.getByText('Configuracao PetFlow')).toBeInTheDocument();
    expect(screen.getByText('Configure o seu ambiente PetFlow')).toBeInTheDocument();
    expect(screen.getByText(/comece com clientes e pets/i)).toBeInTheDocument();
    expect(screen.getAllByText('Comece por clientes').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Agendar atendimentos').length).toBeGreaterThan(0);
  });

  it('keeps PetFlow metrics capability-aware when dashboard permission is missing', () => {
    currentPermissions.splice(0, currentPermissions.length, 'pet.appointment.read', 'pet.medical-record.read');

    render(<PetHome />);

    expect(petService.getDashboardSummary).not.toHaveBeenCalled();
    expect(screen.getByText('Resumo operacional restrito')).toBeInTheDocument();
    expect(screen.getAllByText('No Permission').length).toBeGreaterThan(0);
    expect(screen.getByText(/panorama operacional exige `pet.dashboard.read`/i)).toBeInTheDocument();
  });

  it('adapts the workspace copy when the resolved profile is pet grooming', async () => {
    currentPlatformState.visualProfile = {
      key: 'pet-grooming',
      label: 'Pet Grooming',
      accentFallback: '#d97706',
      primaryFallback: '#7c2d12',
      accentColor: '#d97706',
      primaryColor: '#7c2d12',
      accentTone: { emphasis: 'care', softAlpha: 0.2, highlightAlpha: 0.16 },
      backgroundMood: { softness: 'soft', accentOpacity: 0.12, supportOpacity: 0.08, accentAnchor: 'top center', supportAnchor: 'bottom left' },
      surfaceNuance: { tintOpacity: 0.16, borderOpacity: 0.18, elevation: 'quiet' },
      iconTone: { emphasisOpacity: 0.18, mutedOpacity: 0.08 },
      chartHighlightTone: { accentOpacity: 0.24, supportOpacity: 0.1 },
      dashboardHighlightTone: { accentOpacity: 0.14, supportOpacity: 0.08 },
      loginVisualContext: { accentOpacity: 0.12, supportOpacity: 0.08, cardTintOpacity: 0.05, cardBorderOpacity: 0.18, brandMarkOpacity: 0.16 },
      illustrationPreset: 'grooming-rhythm'
    };

    vi.mocked(petService.getDashboardSummary).mockResolvedValue({
      totalClients: 10,
      totalPets: 16,
      appointmentsToday: 5,
      upcomingAppointments: 7,
      totalServices: 8,
      lowStockProducts: 1,
      pendingInvoices: 2,
      summaryCards: [
        { key: 'clients', label: 'Clients', value: 10, status: 'ok' }
      ],
      sections: []
    });

    render(<PetHome />);

    await waitFor(() => {
      expect(petService.getDashboardSummary).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText('Ambiente PetFlow Grooming')).toBeInTheDocument();
    expect(screen.getByText('Fluxos centrais da demo PetFlow')).toBeInTheDocument();
    expect(screen.getByText('Panorama vivo de servicos')).toBeInTheDocument();

    currentPlatformState.visualProfile = {
      key: 'pet-clinic',
      label: 'Pet Clinic',
      accentFallback: '#0f766e',
      primaryFallback: '#164e63',
      accentColor: '#2563eb',
      primaryColor: '#0f172a',
      accentTone: { emphasis: 'clinical', softAlpha: 0.18, highlightAlpha: 0.14 },
      backgroundMood: { softness: 'soft', accentOpacity: 0.11, supportOpacity: 0.09, accentAnchor: 'top left', supportAnchor: 'bottom center' },
      surfaceNuance: { tintOpacity: 0.15, borderOpacity: 0.17, elevation: 'quiet' },
      iconTone: { emphasisOpacity: 0.16, mutedOpacity: 0.08 },
      chartHighlightTone: { accentOpacity: 0.22, supportOpacity: 0.12 },
      dashboardHighlightTone: { accentOpacity: 0.12, supportOpacity: 0.09 },
      loginVisualContext: { accentOpacity: 0.11, supportOpacity: 0.1, cardTintOpacity: 0.05, cardBorderOpacity: 0.16, brandMarkOpacity: 0.15 },
      illustrationPreset: 'clinical-care'
    };
  });

  it('filters veterinary features out of the workspace when the tenant contract only includes aesthetics and retail', async () => {
    currentPermissions.splice(
      0,
      currentPermissions.length,
      'pet.dashboard.read',
      'pet.appointment.read',
      'pet.medical-record.read',
      'pet.product.read'
    );
    currentPlatformState.user!.featureEntitlements = ['pet.aesthetics', 'pet.retail'];

    vi.mocked(petService.getDashboardSummary).mockResolvedValue({
      totalClients: 12,
      totalPets: 18,
      appointmentsToday: 4,
      upcomingAppointments: 6,
      totalServices: 5,
      lowStockProducts: 2,
      pendingInvoices: 1,
      summaryCards: [],
      sections: []
    });

    render(<PetHome />);

    await waitFor(() => {
      expect(petService.getDashboardSummary).toHaveBeenCalledTimes(1);
    });

    expect(screen.getAllByText('Agendar atendimentos').length).toBeGreaterThan(0);
    expect(screen.queryByText('Abrir prontuarios')).not.toBeInTheDocument();
    expect(screen.queryByText('Revisar produtos')).not.toBeInTheDocument();
  });
});
