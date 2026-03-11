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
  ModuleWorkspaceGuidance,
  ModuleWorkspaceGuidanceStep,
  ModuleWorkspaceHero,
  ModuleWorkspaceOverviewGrid,
  ModuleWorkspaceQuickActionGrid,
  ModuleWorkspaceSection,
  ModuleWorkspaceState
} from '@/shared/modules/module-workspace';
import {
  noDataCapability,
  notConfiguredCapability,
  permissionCapability,
  readyCapability
} from '@/shared/modules/module-capability';
import { GettingStartedChecklist } from '@/shared/onboarding/getting-started';
import { useFrontendPlatform } from '@/shared/platform/use-frontend-platform';
import { petService } from '@/shared/services/pet-service';
import { PetDashboardSummary } from '@/shared/types/pet';

const petWorkspaceActions: ModuleWorkspaceAction[] = [
  {
    href: '/pet/dashboard',
    eyebrow: 'Overview',
    title: 'Open dashboard',
    description: 'Review clinic throughput, today appointments, and the current commercial backlog.',
    permission: 'pet.dashboard.read',
    restrictionTitle: 'Dashboard permission required',
    restrictionDescription: 'This workspace pulse becomes available when your role includes PetFlow dashboard access.'
  },
  {
    href: '/pet/clients',
    eyebrow: 'Front desk',
    title: 'Manage clients',
    description: 'Work through the client base attached to the current tenant workspace.',
    permission: 'pet.client.read',
    restrictionTitle: 'Client access required',
    restrictionDescription: 'Client management appears here when your workspace role can read PetFlow clients.'
  },
  {
    href: '/pet/pets',
    eyebrow: 'Clinical',
    title: 'Review pet profiles',
    description: 'Inspect patient identity, species, breed, and linked customer context.',
    permission: 'pet.profile.read',
    restrictionTitle: 'Pet profile access required',
    restrictionDescription: 'Patient profiles stay unavailable until your workspace role can read PetFlow pet records.'
  },
  {
    href: '/pet/appointments',
    eyebrow: 'Clinical',
    title: 'Open appointments',
    description: 'Handle scheduling, service assignment, and clinical attendance flow.',
    permission: 'pet.appointment.read',
    restrictionTitle: 'Appointment access required',
    restrictionDescription: 'Appointment flow becomes available when your workspace role can read PetFlow appointments.'
  },
  {
    href: '/pet/services',
    eyebrow: 'Commercial',
    title: 'Inspect services',
    description: 'Review the service catalog currently sold through this workspace.',
    permission: 'pet.service.read',
    restrictionTitle: 'Service access required',
    restrictionDescription: 'Service catalog access appears here when your workspace role can read PetFlow services.'
  },
  {
    href: '/pet/professionals',
    eyebrow: 'Clinical',
    title: 'Review professionals',
    description: 'Keep the medical and operational team context visible for the current tenant.',
    permission: 'pet.professional.read',
    restrictionTitle: 'Professional access required',
    restrictionDescription: 'Team management stays hidden until your workspace role can read PetFlow professionals.'
  },
  {
    href: '/pet/medical-records',
    eyebrow: 'Medical',
    title: 'Open medical records',
    description: 'Access patient records, vaccinations, prescriptions, and clinical timeline context.',
    anyOf: petMedicalRoutePermissions,
    restrictionTitle: 'Medical access required',
    restrictionDescription: 'Medical records, vaccinations, and prescriptions appear here when your workspace role includes at least one medical read permission.'
  },
  {
    href: '/pet/products',
    eyebrow: 'Commercial',
    title: 'Review products',
    description: 'Inspect SKUs, pricing, and items linked to the PetFlow commercial workspace.',
    permission: 'pet.product.read',
    restrictionTitle: 'Product access required',
    restrictionDescription: 'Product management appears here when your workspace role can read PetFlow products.'
  },
  {
    href: '/pet/inventory',
    eyebrow: 'Inventory',
    title: 'Track inventory',
    description: 'Follow stock movement and operational traceability for tenant inventory.',
    permission: 'pet.inventory.read',
    restrictionTitle: 'Inventory access required',
    restrictionDescription: 'Inventory flow becomes available when your workspace role can read PetFlow inventory.'
  },
  {
    href: '/pet/invoices',
    eyebrow: 'Billing',
    title: 'Open invoices',
    description: 'Review invoice issuance and pending payment signals for current clients.',
    permission: 'pet.invoice.read',
    restrictionTitle: 'Invoice access required',
    restrictionDescription: 'Billing signals appear here when your workspace role can read PetFlow invoices.'
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

function isPetFirstUse(summary: PetDashboardSummary) {
  return summary.totalClients === 0
    && summary.totalPets === 0
    && summary.appointmentsToday === 0
    && summary.upcomingAppointments === 0
    && summary.totalServices === 0
    && summary.lowStockProducts === 0
    && summary.pendingInvoices === 0;
}

function buildPetGuidanceSteps(actions: ModuleWorkspaceAction[], keys: string[]): ModuleWorkspaceGuidanceStep[] {
  return keys
    .map((key) => actions.find((action) => action.href === key))
    .filter((action): action is ModuleWorkspaceAction => Boolean(action))
    .map((action) => {
      const capability = action.capability ?? readyCapability(action.status);

      return {
        key: action.href,
        eyebrow: action.eyebrow,
        title: action.title,
        description: capability.kind === 'ready'
          ? action.description
          : capability.description ?? action.description,
        href: capability.interactive ? action.href : undefined,
        status: capability.status ?? action.status ?? null,
        capability
      };
    });
}

export function PetHome() {
  const platform = useFrontendPlatform();
  const { hasPermission, hasAnyPermission } = usePermissions();
  const [summary, setSummary] = useState<PetDashboardSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canReadDashboard = hasPermission('pet.dashboard.read');
  const featuredSection = summary?.sections.find((section) => (
    section.cards.length > 0
    || section.metrics.length > 0
    || section.items.length > 0
    || section.timeSeries.length > 0
  )) ?? null;
  const firstUse = summary ? isPetFirstUse(summary) : false;
  const actionStates = petWorkspaceActions
    .map((action) => {
      const allowed = action.permission
        ? hasPermission(action.permission)
        : action.anyOf
          ? hasAnyPermission(action.anyOf)
          : true;
      const capability = allowed
        ? readyCapability(action.status)
        : permissionCapability({
            title: action.restrictionTitle ?? 'Permission required',
            description: action.restrictionDescription ?? action.description
          });

      return {
        ...action,
        available: capability.interactive,
        status: capability.status ?? action.status ?? null,
        capability
      };
    })
    .map((action) => {
      if (action.capability?.kind !== 'ready' || !summary) {
        return action;
      }

      if (firstUse && action.href === '/pet/appointments') {
        const capability = notConfiguredCapability({
          title: 'Appointment flow not configured yet',
          description: 'Create the first clients and pet profiles before appointment scheduling can surface live clinic workload.'
        });

        return { ...action, capability, status: capability.status };
      }

      if (firstUse && action.href === '/pet/medical-records') {
        const capability = notConfiguredCapability({
          title: 'Medical records not configured yet',
          description: 'Clinical records start after the first patients and appointments exist in this PetFlow workspace.'
        });

        return { ...action, capability, status: capability.status };
      }

      if (!firstUse && !featuredSection && action.href === '/pet/appointments') {
        const capability = noDataCapability({
          title: 'No recent appointment activity yet',
          description: 'The workspace has PetFlow records, but no compact recent clinic activity block is available right now.'
        });

        return { ...action, capability, status: capability.status };
      }

      return action;
    });
  const themePolicy = platform.theme.canOverride
    ? `${getAppThemeModeLabel(platform.theme.tenantDefaultMode)} with user override`
    : `${getAppThemeModeLabel(platform.theme.tenantDefaultMode)} tenant-managed`;
  const setupGuidance = buildPetGuidanceSteps(actionStates, ['/pet/clients', '/pet/pets', '/pet/appointments']);
  const restrictedGuidance = buildPetGuidanceSteps(actionStates, ['/pet/appointments', '/pet/medical-records', '/pet/invoices']);

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
            value: canReadDashboard ? resolveOverviewValue(summary?.appointmentsToday) : '--',
            description: 'Scheduled attendances expected during the current operating day.',
            status: !canReadDashboard ? 'no permission' : summary && firstUse ? 'setup required' : null,
            capability: !canReadDashboard
              ? permissionCapability({
                  title: 'Dashboard visibility required',
                  description: 'Grant `pet.dashboard.read` to surface clinic appointment counts on this workspace landing page.'
                })
              : summary && firstUse
                ? notConfiguredCapability({
                    title: 'Appointments not configured yet',
                    description: 'Create the first clients and pet profiles before this workspace can schedule and surface clinic throughput.'
                  })
                : undefined
          },
          {
            label: 'Upcoming care',
            value: canReadDashboard ? resolveOverviewValue(summary?.upcomingAppointments) : '--',
            description: 'Near-term appointments already queued for the current tenant.',
            status: !canReadDashboard ? 'no permission' : summary && firstUse ? 'setup required' : null,
            capability: !canReadDashboard
              ? permissionCapability({
                  title: 'Clinic forecast requires dashboard access',
                  description: 'Grant `pet.dashboard.read` to surface upcoming appointment load from the workspace overview.'
                })
              : summary && firstUse
                ? notConfiguredCapability({
                    title: 'Upcoming care not configured yet',
                    description: 'Near-term care appears after the first appointments are booked inside this tenant workspace.'
                  })
                : undefined
          },
          {
            label: 'Attention queue',
            value: canReadDashboard
              ? summary
                ? `${summary.lowStockProducts} low-stock / ${summary.pendingInvoices} invoices`
                : 'Loading...'
              : '--',
            description: 'Commercial and inventory signals that still need action in this workspace.',
            status: !canReadDashboard
              ? 'no permission'
              : summary && firstUse
                ? 'setup required'
                : summary && (summary.lowStockProducts > 0 || summary.pendingInvoices > 0)
                  ? 'pending'
                  : summary
                    ? 'active'
                    : null,
            capability: !canReadDashboard
              ? permissionCapability({
                  title: 'Operational queue requires dashboard access',
                  description: 'Grant `pet.dashboard.read` to surface low-stock and billing attention signals from this landing page.'
                })
              : summary && firstUse
                ? notConfiguredCapability({
                    title: 'Operational queue not configured yet',
                    description: 'Inventory and billing attention signals appear after services, products, and invoices begin moving through the workspace.'
                  })
                : undefined
          }
        ]}
      />

      <ModuleWorkspaceQuickActionGrid
        title="Workspace Actions"
        description="Open the PetFlow surfaces currently permitted in the tenant role and keep restricted clinical or billing flows explicit."
        actions={actionStates}
        emptyTitle="No PetFlow actions available"
        emptyDescription="This tenant has the PetFlow module enabled, but the current user does not have PetFlow read permissions yet."
      />

      <ModuleWorkspaceSection
        title="Clinic Snapshot"
        description="Keep a compact view of clinical throughput and commercial pressure before navigating into the deeper PetFlow surfaces."
      >
        {!canReadDashboard ? (
          <div className="space-y-4">
            <ModuleWorkspaceState
              tone="neutral"
              title="Clinic summary restricted"
              description="This PetFlow workspace is available, but the clinic snapshot requires `pet.dashboard.read`. Continue through the permitted client, appointment, and medical flows below."
            />
            <ModuleWorkspaceGuidance
              title="Continue with the PetFlow workspace"
              description="These next steps stay available even while dashboard visibility is restricted."
              steps={restrictedGuidance}
            />
          </div>
        ) : loadingSummary ? (
          <ModuleWorkspaceState
            tone="neutral"
            title="Loading PetFlow summary"
            description="Collecting the latest clinic and commercial overview for this tenant workspace."
          />
        ) : error ? (
          <div className="space-y-4">
            <ModuleWorkspaceState tone="error" title="PetFlow summary unavailable" description={error} />
            <ModuleWorkspaceGuidance
              title="Keep the clinic workspace moving"
              description="Use the permitted PetFlow flows below while the summary feed recovers."
              steps={restrictedGuidance}
            />
          </div>
        ) : summary && firstUse ? (
          <GettingStartedChecklist
            eyebrow="PetFlow Onboarding"
            title="Set up the PetFlow workspace"
            description="This tenant does not have the first clinic entities in place yet. Work through the checklist below to establish clients, patient records, and appointment flow."
            steps={setupGuidance}
          />
        ) : summary ? (
          <div className="space-y-4">
            <MetricGrid cards={summary.summaryCards.slice(0, 4)} columns="md:grid-cols-2 xl:grid-cols-4" />
            {featuredSection ? (
              <DashboardSection section={featuredSection} />
            ) : (
              <div className="space-y-4">
                <ModuleWorkspaceState
                  tone="neutral"
                  title="No recent PetFlow activity yet"
                  description="The workspace already has PetFlow records, but the summary returned no compact recent clinic activity block right now."
                />
                <ModuleWorkspaceGuidance
                  title="Keep working the PetFlow workspace"
                  description="Continue through the core PetFlow flows below while the next clinic signal is still building."
                  steps={restrictedGuidance}
                />
              </div>
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
