import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CrmHome } from '@/modules/crm/crm-home';
import type { FrontendPlatformState } from '@/shared/platform/frontend-platform.types';

const { currentPlatformState, currentPermissions } = vi.hoisted(() => ({
  currentPlatformState: {
    user: {
      userId: 'user-1',
      email: 'crm@tenant.test',
      fullName: 'CRM Operator',
      tenantId: 'tenant-1',
      tenantName: 'Clinic North',
      tenantCode: 'clinic-north',
      tenantLogoUrl: null,
      tenantPrimaryColor: '#0f172a',
      tenantAccentColor: '#2563eb',
      tenantDefaultThemeMode: 'SYSTEM',
      tenantAllowUserThemeOverride: true,
      platformOwner: false,
      platformAdmin: false,
      role: 'TENANT_ADMIN',
      permissions: []
    },
    theme: {
      mode: 'system',
      setMode: vi.fn(),
      tenantDefaultMode: 'system',
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
      availableCodes: ['CRM'],
      contractedProducts: []
    }
  } as FrontendPlatformState,
  currentPermissions: ['crm.dashboard.read', 'crm.company.read', 'crm.task.read']
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

vi.mock('@/shared/services/crm-service', () => ({
  crmService: {
    getDashboardSummary: vi.fn()
  }
}));

import { crmService } from '@/shared/services/crm-service';

describe('CrmHome', () => {
  beforeEach(() => {
    currentPermissions.splice(0, currentPermissions.length, 'crm.dashboard.read', 'crm.company.read', 'crm.task.read');
    vi.clearAllMocks();
  });

  it('renders a tenant-scoped CRM workspace with filtered actions and summary pulse', async () => {
    vi.mocked(crmService.getDashboardSummary).mockResolvedValue({
      totalContacts: 42,
      totalLeads: 12,
      totalCompanies: 8,
      totalDeals: 5,
      dealsPorStatus: {
        OPEN: 3,
        WON: 2
      },
      tasksPendentes: 4,
      leadsPorStatus: {
        NEW: 6,
        QUALIFIED: 6
      },
      summaryCards: [
        { key: 'contacts', label: 'Contacts', value: 42, status: 'ok' },
        { key: 'leads', label: 'Leads', value: 12, status: 'info' },
        { key: 'deals', label: 'Deals', value: 5, status: 'active' },
        { key: 'tasks', label: 'Tasks', value: 4, status: 'pending' }
      ],
      sections: [
        {
          key: 'pipeline-watch',
          title: 'Pipeline Watch',
          description: 'Recent commercial items',
          cards: [],
          metrics: [],
          items: [
            {
              id: 'lead-1',
              label: 'Lead · ACME Expansion',
              sublabel: 'Needs qualification follow-up',
              status: 'pending',
              timestamp: '2026-03-10T10:00:00Z'
            }
          ],
          timeSeries: []
        }
      ]
    });

    render(<CrmHome />);

    await waitFor(() => {
      expect(crmService.getDashboardSummary).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByRole('heading', { name: 'Clinic North · CRM' })).toBeInTheDocument();
    expect(screen.getByText('Tenant workspace')).toBeInTheDocument();
    expect(screen.getByText('Manage companies')).toBeInTheDocument();
    expect(screen.getByText('Handle tasks')).toBeInTheDocument();
    expect(screen.getByText('Check activity')).toBeInTheDocument();
    expect(screen.getByText('Activity access required')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /check activity/i })).not.toBeInTheDocument();
    expect(screen.getByText('Commercial Pulse')).toBeInTheDocument();
    expect(screen.getByText('Pipeline Watch')).toBeInTheDocument();
  });

  it('shows guided first-use messaging when the CRM workspace has no records yet', async () => {
    vi.mocked(crmService.getDashboardSummary).mockResolvedValue({
      totalContacts: 0,
      totalLeads: 0,
      totalCompanies: 0,
      totalDeals: 0,
      dealsPorStatus: {},
      tasksPendentes: 0,
      leadsPorStatus: {},
      summaryCards: [],
      sections: []
    });

    render(<CrmHome />);

    await waitFor(() => {
      expect(crmService.getDashboardSummary).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText('CRM Onboarding')).toBeInTheDocument();
    expect(screen.getByText('Set up the CRM workspace')).toBeInTheDocument();
    expect(screen.getByText(/does not have the first CRM records in place yet/i)).toBeInTheDocument();
    expect(screen.getAllByText('Manage companies').length).toBeGreaterThan(0);
  });

  it('keeps CRM metrics capability-aware when dashboard permission is missing', () => {
    currentPermissions.splice(0, currentPermissions.length, 'crm.company.read', 'crm.task.read');

    render(<CrmHome />);

    expect(crmService.getDashboardSummary).not.toHaveBeenCalled();
    expect(screen.getAllByText('Dashboard visibility required').length).toBeGreaterThan(0);
    expect(screen.getAllByText('No Permission').length).toBeGreaterThan(0);
    expect(screen.getByText(/commercial pulse requires `crm.dashboard.read`/i)).toBeInTheDocument();
  });
});
