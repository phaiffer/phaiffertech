'use client';

import { useEffect, useState } from 'react';
import { DashboardSection } from '@/shared/dashboard/dashboard-section';
import { EmptyStateCard } from '@/shared/dashboard/empty-state-card';
import { MetricGrid } from '@/shared/dashboard/metric-grid';
import { ApiClientError } from '@/shared/lib/http';
import { getAppThemeModeLabel } from '@/shared/lib/tenant-branding';
import {
  ModuleWorkspaceAction,
  ModuleWorkspaceFactList,
  ModuleWorkspaceHero,
  ModuleWorkspaceOverviewGrid,
  ModuleWorkspaceQuickActionGrid,
  ModuleWorkspaceSection,
  ModuleWorkspaceState
} from '@/shared/modules/module-workspace';
import { useFrontendPlatform } from '@/shared/platform/use-frontend-platform';
import { crmService } from '@/shared/services/crm-service';
import { usePermissions } from '@/shared/auth/usePermissions';
import { CrmDashboardSummary } from '@/shared/types/crm';

const crmWorkspaceActions: ModuleWorkspaceAction[] = [
  {
    href: '/crm/dashboard',
    eyebrow: 'Overview',
    title: 'Open dashboard',
    description: 'Review pipeline health, conversion signals, and recent commercial activity.',
    permission: 'crm.dashboard.read'
  },
  {
    href: '/crm/companies',
    eyebrow: 'Records',
    title: 'Manage companies',
    description: 'Work through account records tied to contacts, leads, and active deals.',
    permission: 'crm.company.read'
  },
  {
    href: '/crm/contacts',
    eyebrow: 'Records',
    title: 'Review contacts',
    description: 'Inspect the people currently linked to the tenant commercial workspace.',
    permission: 'crm.contact.read'
  },
  {
    href: '/crm/leads',
    eyebrow: 'Pipeline',
    title: 'Qualify leads',
    description: 'Handle intake, source attribution, and early qualification inside this workspace.',
    permission: 'crm.lead.read'
  },
  {
    href: '/crm/deals',
    eyebrow: 'Pipeline',
    title: 'Track deals',
    description: 'Follow open opportunities, commercial value, and closing expectations.',
    permission: 'crm.deal.read'
  },
  {
    href: '/crm/pipeline',
    eyebrow: 'Pipeline',
    title: 'Inspect stages',
    description: 'Keep stage order, defaults, and commercial flow visible for the tenant.',
    permission: 'crm.pipeline.read'
  },
  {
    href: '/crm/tasks',
    eyebrow: 'Execution',
    title: 'Handle tasks',
    description: 'Work through follow-up commitments linked to companies, leads, contacts, and deals.',
    permission: 'crm.task.read'
  },
  {
    href: '/crm/notes',
    eyebrow: 'Signals',
    title: 'Review notes',
    description: 'Read and capture operational context tied to the CRM records in this workspace.',
    permission: 'crm.note.read'
  },
  {
    href: '/crm/activity',
    eyebrow: 'Signals',
    title: 'Check activity',
    description: 'Read the recent audit trail for commercial work happening in the current tenant.',
    permission: 'crm.activity.read'
  }
];

function resolveCrmWorkspaceDescription(scopeName: string, workspaceLabel: string, isPlatformOwnerTenant: boolean, hasSystemAdminRole: boolean) {
  if (isPlatformOwnerTenant) {
    return 'Use this CRM workspace to inspect the product surface from the PhaifferTech platform-owner tenant without leaving the authenticated shell context.';
  }

  if (hasSystemAdminRole) {
    return `This CRM workspace remains tenant-scoped to ${scopeName} while an internal support role is active in the current session.`;
  }

  return `Commercial records, follow-up, and opportunity management are scoped to ${scopeName} through the current ${workspaceLabel.toLowerCase()}.`;
}

function resolveOverviewValue(value?: number) {
  return value === undefined ? 'Loading...' : value.toString();
}

export function CrmHome() {
  const platform = useFrontendPlatform();
  const { hasPermission } = usePermissions();
  const [summary, setSummary] = useState<CrmDashboardSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canReadDashboard = hasPermission('crm.dashboard.read');
  const visibleActions = crmWorkspaceActions.filter((action) => !action.permission || hasPermission(action.permission));
  const featuredSection = summary?.sections.find((section) => (
    section.cards.length > 0
    || section.metrics.length > 0
    || section.items.length > 0
    || section.timeSeries.length > 0
  )) ?? null;
  const themePolicy = platform.theme.canOverride
    ? `${getAppThemeModeLabel(platform.theme.tenantDefaultMode)} with user override`
    : `${getAppThemeModeLabel(platform.theme.tenantDefaultMode)} tenant-managed`;

  useEffect(() => {
    let active = true;

    if (!canReadDashboard) {
      setSummary(null);
      setError(null);
      setLoadingSummary(false);
      return () => {
        active = false;
      };
    }

    setLoadingSummary(true);

    crmService
      .getDashboardSummary()
      .then((result) => {
        if (!active) {
          return;
        }

        setSummary(result);
        setError(null);
        setLoadingSummary(false);
      })
      .catch((err) => {
        if (!active) {
          return;
        }

        setSummary(null);
        setError(err instanceof ApiClientError ? err.message : 'Unable to load the CRM workspace summary.');
        setLoadingSummary(false);
      });

    return () => {
      active = false;
    };
  }, [canReadDashboard]);

  return (
    <div className="space-y-6">
      <ModuleWorkspaceHero
        eyebrow="CRM Workspace"
        title={`${platform.branding.scopeName} · CRM`}
        description={resolveCrmWorkspaceDescription(
          platform.branding.scopeName,
          platform.workspace.workspaceLabel,
          platform.workspace.isPlatformOwnerTenant,
          platform.workspace.hasSystemAdminRole
        )}
        chips={[
          { label: 'Workspace', value: platform.workspace.workspaceLabel },
          { label: 'Access', value: platform.workspace.accessLabel, tone: 'neutral' },
          { label: 'Theme', value: themePolicy, tone: 'neutral' }
        ]}
        aside={(
          <ModuleWorkspaceFactList
            facts={[
              {
                label: 'Tenant code',
                value: platform.branding.tenantCode ?? 'Not assigned',
                description: 'Stable tenant identifier for this CRM workspace.'
              },
              {
                label: 'Role context',
                value: platform.user?.role ?? 'Unknown role',
                description: platform.user?.fullName
                  ? `Authenticated as ${platform.user.fullName}.`
                  : 'Authenticated user details are not available.'
              },
              {
                label: 'Module surface',
                value: 'Contracted CRM workspace',
                description: 'Only tenant-contracted CRM routes remain exposed from this landing page.',
                status: 'active'
              }
            ]}
          />
        )}
      />

      <ModuleWorkspaceOverviewGrid
        cards={[
          {
            label: 'Workspace scope',
            value: platform.branding.scopeName,
            description: 'Commercial records remain anchored to the active tenant workspace.'
          },
          {
            label: 'Total contacts',
            value: resolveOverviewValue(summary?.totalContacts),
            description: 'Contacts currently tracked inside this CRM tenant surface.'
          },
          {
            label: 'Pipeline load',
            value: summary ? `${summary.totalLeads} leads / ${summary.totalDeals} deals` : 'Loading...',
            description: 'Lead intake and active deal flow visible in the current workspace.'
          },
          {
            label: 'Pending follow-up',
            value: resolveOverviewValue(summary?.tasksPendentes),
            description: 'Tasks still waiting for execution in the commercial workflow.',
            status: summary && summary.tasksPendentes > 0 ? 'pending' : summary ? 'active' : null
          }
        ]}
      />

      <ModuleWorkspaceQuickActionGrid
        title="Workspace Actions"
        description="Open the CRM surfaces that are both contracted for this tenant and permitted for the current user."
        actions={visibleActions}
        emptyTitle="No CRM actions available"
        emptyDescription="This tenant has the CRM module enabled, but the current user does not have CRM read permissions yet."
      />

      <ModuleWorkspaceSection
        title="Commercial Pulse"
        description="Keep a compact operational slice visible before navigating into the deeper CRM dashboards and record lists."
      >
        {!canReadDashboard ? (
          <EmptyStateCard
            title="Dashboard summary unavailable"
            description="The CRM workspace is available, but the dashboard snapshot requires `crm.dashboard.read`."
          />
        ) : loadingSummary ? (
          <ModuleWorkspaceState
            tone="neutral"
            title="Loading CRM summary"
            description="Collecting the latest commercial overview for this tenant workspace."
          />
        ) : error ? (
          <ModuleWorkspaceState tone="error" title="CRM summary unavailable" description={error} />
        ) : summary ? (
          <div className="space-y-4">
            <MetricGrid cards={summary.summaryCards.slice(0, 4)} columns="md:grid-cols-2 xl:grid-cols-4" />
            {featuredSection ? (
              <DashboardSection section={featuredSection} />
            ) : (
              <EmptyStateCard
                title="No CRM activity snapshot"
                description="The dashboard summary returned no compact activity section for the current tenant."
              />
            )}
          </div>
        ) : (
          <EmptyStateCard
            title="No CRM summary available"
            description="No CRM dashboard data was returned for the current tenant workspace."
          />
        )}
      </ModuleWorkspaceSection>
    </div>
  );
}
