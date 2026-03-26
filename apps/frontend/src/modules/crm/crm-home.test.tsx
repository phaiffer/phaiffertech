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
      key: 'crm-corporate',
      label: 'CRM Corporate',
      accentFallback: '#4f46e5',
      primaryFallback: '#111827',
      accentColor: '#2563eb',
      primaryColor: '#0f172a',
      accentTone: { emphasis: 'corporate', softAlpha: 0.16, highlightAlpha: 0.16 },
      backgroundMood: { softness: 'soft', accentOpacity: 0.1, supportOpacity: 0.08, accentAnchor: 'top center', supportAnchor: 'bottom right' },
      surfaceNuance: { tintOpacity: 0.14, borderOpacity: 0.16, elevation: 'quiet' },
      iconTone: { emphasisOpacity: 0.16, mutedOpacity: 0.08 },
      chartHighlightTone: { accentOpacity: 0.24, supportOpacity: 0.12 },
      dashboardHighlightTone: { accentOpacity: 0.12, supportOpacity: 0.08 },
      loginVisualContext: { accentOpacity: 0.1, supportOpacity: 0.1, cardTintOpacity: 0.04, cardBorderOpacity: 0.16, brandMarkOpacity: 0.14 },
      illustrationPreset: 'corporate-flow'
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
      overdueTasks: 2,
      leadsPorStatus: {
        NEW: 6,
        QUALIFIED: 6
      },
      summaryCards: [
        { key: 'pipeline-value', label: 'Pipeline Value (BRL)', value: 180000, status: 'info' },
        { key: 'active-deals', label: 'Active Deals', value: 5, status: 'active' },
        { key: 'overdue-tasks', label: 'Overdue Tasks', value: 2, status: 'alert' },
        { key: 'pending-tasks', label: 'Pending Tasks', value: 4, status: 'pending' }
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
    expect(screen.getByText('Core CRM flows')).toBeInTheDocument();
    expect(screen.getByText('Manage companies')).toBeInTheDocument();
    expect(screen.getByText('Qualify leads')).toBeInTheDocument();
    expect(screen.getByText('Track deals')).toBeInTheDocument();
    expect(screen.getAllByText('Review overdue tasks').length).toBeGreaterThan(0);
    expect(screen.getByText('Commercial Pulse')).toBeInTheDocument();
    expect(screen.getByText('Pipeline Watch')).toBeInTheDocument();
    expect(screen.queryByText('Commercial Operating Context')).not.toBeInTheDocument();
  });

  it('shows guided first-use messaging when the CRM workspace has no records yet', async () => {
    vi.mocked(crmService.getDashboardSummary).mockResolvedValue({
      totalContacts: 0,
      totalLeads: 0,
      totalCompanies: 0,
      totalDeals: 0,
      dealsPorStatus: {},
      tasksPendentes: 0,
      overdueTasks: 0,
      leadsPorStatus: {},
      summaryCards: [],
      sections: []
    });

    render(<CrmHome />);

    await waitFor(() => {
      expect(crmService.getDashboardSummary).toHaveBeenCalledTimes(1);
    });

    expect(await screen.findByText('CRM Onboarding')).toBeInTheDocument();
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
