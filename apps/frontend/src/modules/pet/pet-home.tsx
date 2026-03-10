'use client';

import { useEffect, useState } from 'react';
import { petMedicalRoutePermissions } from '@/modules/pet/pet-medical-permissions';
import { usePermissions } from '@/shared/auth/usePermissions';
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
import { petService } from '@/shared/services/pet-service';
import { PetDashboardSummary } from '@/shared/types/pet';

const petWorkspaceActions: ModuleWorkspaceAction[] = [
  {
    href: '/pet/dashboard',
    eyebrow: 'Overview',
    title: 'Open dashboard',
    description: 'Review clinic throughput, today appointments, and the current commercial backlog.',
    permission: 'pet.dashboard.read'
  },
  {
    href: '/pet/clients',
    eyebrow: 'Front desk',
    title: 'Manage clients',
    description: 'Work through the client base attached to the current tenant workspace.',
    permission: 'pet.client.read'
  },
  {
    href: '/pet/pets',
    eyebrow: 'Clinical',
    title: 'Review pet profiles',
    description: 'Inspect patient identity, species, breed, and linked customer context.',
    permission: 'pet.profile.read'
  },
  {
    href: '/pet/appointments',
    eyebrow: 'Clinical',
    title: 'Open appointments',
    description: 'Handle scheduling, service assignment, and clinical attendance flow.',
    permission: 'pet.appointment.read'
  },
  {
    href: '/pet/services',
    eyebrow: 'Commercial',
    title: 'Inspect services',
    description: 'Review the service catalog currently sold through this workspace.',
    permission: 'pet.service.read'
  },
  {
    href: '/pet/professionals',
    eyebrow: 'Clinical',
    title: 'Review professionals',
    description: 'Keep the medical and operational team context visible for the current tenant.',
    permission: 'pet.professional.read'
  },
  {
    href: '/pet/medical-records',
    eyebrow: 'Medical',
    title: 'Open medical records',
    description: 'Access patient records, vaccinations, prescriptions, and clinical timeline context.',
    anyOf: petMedicalRoutePermissions
  },
  {
    href: '/pet/products',
    eyebrow: 'Commercial',
    title: 'Review products',
    description: 'Inspect SKUs, pricing, and items linked to the PetFlow commercial workspace.',
    permission: 'pet.product.read'
  },
  {
    href: '/pet/inventory',
    eyebrow: 'Inventory',
    title: 'Track inventory',
    description: 'Follow stock movement and operational traceability for tenant inventory.',
    permission: 'pet.inventory.read'
  },
  {
    href: '/pet/invoices',
    eyebrow: 'Billing',
    title: 'Open invoices',
    description: 'Review invoice issuance and pending payment signals for current clients.',
    permission: 'pet.invoice.read'
  }
];

function resolvePetWorkspaceDescription(scopeName: string, workspaceLabel: string, isPlatformOwnerTenant: boolean, hasSystemAdminRole: boolean) {
  if (isPlatformOwnerTenant) {
    return 'Use this PetFlow workspace to inspect the clinical and operational product surface from the PhaifferTech platform-owner tenant.';
  }

  if (hasSystemAdminRole) {
    return `This PetFlow workspace stays tenant-scoped to ${scopeName} while an internal support role is active in the current session.`;
  }

  return `Clinical operations, appointments, and customer follow-through remain scoped to ${scopeName} through the current ${workspaceLabel.toLowerCase()}.`;
}

function resolveOverviewValue(value?: number) {
  return value === undefined ? 'Loading...' : value.toString();
}

export function PetHome() {
  const platform = useFrontendPlatform();
  const { hasPermission, hasAnyPermission } = usePermissions();
  const [summary, setSummary] = useState<PetDashboardSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canReadDashboard = hasPermission('pet.dashboard.read');
  const visibleActions = petWorkspaceActions.filter((action) => {
    if (action.permission) {
      return hasPermission(action.permission);
    }

    if (action.anyOf) {
      return hasAnyPermission(action.anyOf);
    }

    return true;
  });
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

    petService
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
        setError(err instanceof ApiClientError ? err.message : 'Unable to load the PetFlow workspace summary.');
        setLoadingSummary(false);
      });

    return () => {
      active = false;
    };
  }, [canReadDashboard]);

  return (
    <div className="space-y-6">
      <ModuleWorkspaceHero
        eyebrow="PetFlow Workspace"
        title={`${platform.branding.scopeName} · PetFlow`}
        description={resolvePetWorkspaceDescription(
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
                description: 'Stable tenant identifier for the PetFlow workspace.'
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
                value: 'Contracted PetFlow workspace',
                description: 'Clinical, commercial, and medical flows stay bounded to the active tenant contract.',
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
            description: 'PetFlow operations stay anchored to the active tenant workspace.'
          },
          {
            label: 'Appointments today',
            value: resolveOverviewValue(summary?.appointmentsToday),
            description: 'Scheduled attendances expected during the current operating day.'
          },
          {
            label: 'Upcoming care',
            value: resolveOverviewValue(summary?.upcomingAppointments),
            description: 'Near-term appointments already queued for the current tenant.'
          },
          {
            label: 'Attention queue',
            value: summary
              ? `${summary.lowStockProducts} low-stock / ${summary.pendingInvoices} invoices`
              : 'Loading...',
            description: 'Commercial and inventory signals that still need action in this workspace.',
            status: summary && (summary.lowStockProducts > 0 || summary.pendingInvoices > 0) ? 'pending' : summary ? 'active' : null
          }
        ]}
      />

      <ModuleWorkspaceQuickActionGrid
        title="Workspace Actions"
        description="Open the PetFlow surfaces currently exposed to the tenant contract and current user permissions."
        actions={visibleActions}
        emptyTitle="No PetFlow actions available"
        emptyDescription="This tenant has the PetFlow module enabled, but the current user does not have PetFlow read permissions yet."
      />

      <ModuleWorkspaceSection
        title="Clinic Snapshot"
        description="Keep a compact view of clinical throughput and commercial pressure before navigating into the deeper PetFlow surfaces."
      >
        {!canReadDashboard ? (
          <EmptyStateCard
            title="Dashboard summary unavailable"
            description="The PetFlow workspace is available, but the summary snapshot requires `pet.dashboard.read`."
          />
        ) : loadingSummary ? (
          <ModuleWorkspaceState
            tone="neutral"
            title="Loading PetFlow summary"
            description="Collecting the latest clinic and commercial overview for this tenant workspace."
          />
        ) : error ? (
          <ModuleWorkspaceState tone="error" title="PetFlow summary unavailable" description={error} />
        ) : summary ? (
          <div className="space-y-4">
            <MetricGrid cards={summary.summaryCards.slice(0, 4)} columns="md:grid-cols-2 xl:grid-cols-4" />
            {featuredSection ? (
              <DashboardSection section={featuredSection} />
            ) : (
              <EmptyStateCard
                title="No PetFlow activity snapshot"
                description="The dashboard summary returned no compact clinical or commercial activity section for the current tenant."
              />
            )}
          </div>
        ) : (
          <EmptyStateCard
            title="No PetFlow summary available"
            description="No PetFlow dashboard data was returned for the current tenant workspace."
          />
        )}
      </ModuleWorkspaceSection>
    </div>
  );
}
