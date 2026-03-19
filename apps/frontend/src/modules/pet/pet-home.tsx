'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { petMedicalRoutePermissions } from '@/modules/pet/pet-medical-permissions';
import { usePermissions } from '@/shared/auth/usePermissions';
import { DashboardContextCardGrid } from '@/shared/dashboard/dashboard-context-card-grid';
import type { DashboardContextCard } from '@/shared/dashboard/contextual-dashboard';
import { DashboardSection } from '@/shared/dashboard/dashboard-section';
import { EmptyStateCard } from '@/shared/dashboard/empty-state-card';
import {
  hasAnyTenantEntitlement,
  petClinicalEntitlements,
  petOperationalEntitlements,
  petRetailEntitlements,
  petSubmoduleEntitlements
} from '@/shared/entitlements/tenant-entitlements';
import { MetricGrid } from '@/shared/dashboard/metric-grid';
import { ApiClientError } from '@/shared/lib/http';
import { getAppThemeModeLabel } from '@/shared/lib/tenant-branding';
import type { VisualProfileKey } from '@/shared/lib/visual-profile';
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
import { resolveModuleWorkspaceVisualState } from '@/shared/modules/module-workspace-visual';
import { GettingStartedChecklist } from '@/shared/onboarding/getting-started';
import { useFrontendPlatform } from '@/shared/platform/use-frontend-platform';
import { petService } from '@/shared/services/pet-service';
import { PetDashboardSummary } from '@/shared/types/pet';

type PetWorkspaceMode = 'clinic' | 'grooming';

type PetPrimaryAction = {
  title: string;
  description: string;
  href: string;
};

type PetWorkspaceCopy = {
  heroEyebrow: string;
  overviewAppointmentsLabel: string;
  overviewAppointmentsDescription: string;
  overviewUpcomingLabel: string;
  overviewUpcomingDescription: string;
  attentionLabel: string;
  attentionDescription: string;
  contextTitle: string;
  contextDescription: string;
  snapshotTitle: string;
  snapshotDescription: string;
  restrictedTitle: string;
  restrictedDescription: string;
  loadingTitle: string;
  loadingDescription: string;
  errorGuidanceTitle: string;
  errorGuidanceDescription: string;
  onboardingEyebrow: string;
  onboardingTitle: string;
  onboardingDescription: string;
  emptyActivityTitle: string;
  emptyActivityDescription: string;
  emptyGuidanceTitle: string;
  emptyGuidanceDescription: string;
  emptySummaryTitle: string;
  emptySummaryDescription: string;
  moduleSurfaceDescription: string;
};

function resolvePetWorkspaceMode(key: VisualProfileKey): PetWorkspaceMode {
  return key === 'pet-grooming' ? 'grooming' : 'clinic';
}

function getPetWorkspaceActions(mode: PetWorkspaceMode): ModuleWorkspaceAction[] {
  const grooming = mode === 'grooming';

  return [
    {
      href: '/pet/dashboard',
      eyebrow: 'Overview',
      title: 'Open dashboard',
      description: grooming
        ? 'Review service throughput, today bookings, and the current operational backlog.'
        : 'Review clinic throughput, today appointments, and the current commercial backlog.',
      permission: 'pet.dashboard.read',
      anyEntitlements: petSubmoduleEntitlements,
      restrictionTitle: 'Dashboard permission required',
      restrictionDescription: 'This workspace pulse becomes available when your role includes PetFlow dashboard access.'
    },
    {
      href: '/pet/clients',
      eyebrow: grooming ? 'Reception' : 'Front desk',
      title: 'Manage clients',
      description: 'Work through the client base attached to the current tenant workspace.',
      permission: 'pet.client.read',
      anyEntitlements: petSubmoduleEntitlements,
      restrictionTitle: 'Client access required',
      restrictionDescription: 'Client management appears here when your workspace role can read PetFlow clients.'
    },
    {
      href: '/pet/pets',
      eyebrow: grooming ? 'Care' : 'Clinical',
      title: 'Review pet profiles',
      description: grooming
        ? 'Inspect pet identity, service notes, and linked customer context.'
        : 'Inspect patient identity, species, breed, and linked customer context.',
      permission: 'pet.profile.read',
      anyEntitlements: petClinicalEntitlements,
      restrictionTitle: 'Pet profile access required',
      restrictionDescription: 'Patient profiles stay unavailable until your workspace role can read PetFlow pet records.'
    },
    {
      href: '/pet/appointments',
      eyebrow: grooming ? 'Schedule' : 'Clinical',
      title: 'Open appointments',
      description: grooming
        ? 'Handle bookings, service assignment, and attendance flow for the current workspace.'
        : 'Handle scheduling, service assignment, and clinical attendance flow.',
      permission: 'pet.appointment.read',
      anyEntitlements: petOperationalEntitlements,
      restrictionTitle: 'Appointment access required',
      restrictionDescription: 'Appointment flow becomes available when your workspace role can read PetFlow appointments.'
    },
    {
      href: '/pet/services',
      eyebrow: grooming ? 'Service menu' : 'Commercial',
      title: 'Inspect services',
      description: 'Review the service catalog currently sold through this workspace.',
      permission: 'pet.service.read',
      anyEntitlements: petOperationalEntitlements,
      restrictionTitle: 'Service access required',
      restrictionDescription: 'Service catalog access appears here when your workspace role can read PetFlow services.'
    },
    {
      href: '/pet/professionals',
      eyebrow: grooming ? 'Operations' : 'Clinical',
      title: 'Review professionals',
      description: grooming
        ? 'Keep groomers, attendants, and operational staff visible for the current tenant.'
        : 'Keep the medical and operational team context visible for the current tenant.',
      permission: 'pet.professional.read',
      anyEntitlements: petOperationalEntitlements,
      restrictionTitle: 'Professional access required',
      restrictionDescription: 'Team management stays hidden until your workspace role can read PetFlow professionals.'
    },
    {
      href: '/pet/medical-records',
      eyebrow: grooming ? 'Care records' : 'Medical',
      title: 'Open medical records',
      description: grooming
        ? 'Access care records, prescriptions, vaccinations, and longitudinal context when medical permissions apply.'
        : 'Access patient records, vaccinations, prescriptions, and clinical timeline context.',
      anyOf: petMedicalRoutePermissions,
      anyEntitlements: petClinicalEntitlements,
      restrictionTitle: 'Medical access required',
      restrictionDescription: 'Medical records, vaccinations, and prescriptions appear here when your workspace role includes at least one medical read permission.'
    },
    {
      href: '/pet/products',
      eyebrow: 'Commercial',
      title: 'Review products',
      description: 'Inspect SKUs, pricing, and items linked to the PetFlow commercial workspace.',
      permission: 'pet.product.read',
      anyEntitlements: petRetailEntitlements,
      restrictionTitle: 'Product access required',
      restrictionDescription: 'Product management appears here when your workspace role can read PetFlow products.'
    },
    {
      href: '/pet/inventory',
      eyebrow: 'Inventory',
      title: 'Track inventory',
      description: 'Follow stock movement and operational traceability for tenant inventory.',
      permission: 'pet.inventory.read',
      anyEntitlements: petRetailEntitlements,
      restrictionTitle: 'Inventory access required',
      restrictionDescription: 'Inventory flow becomes available when your workspace role can read PetFlow inventory.'
    },
    {
      href: '/pet/invoices',
      eyebrow: 'Billing',
      title: 'Open invoices',
      description: 'Review invoice issuance and pending payment signals for current clients.',
      permission: 'pet.invoice.read',
      anyEntitlements: petRetailEntitlements,
      restrictionTitle: 'Invoice access required',
      restrictionDescription: 'Billing signals appear here when your workspace role can read PetFlow invoices.'
    }
  ];
}

function resolvePetWorkspaceDescription(
  scopeName: string,
  workspaceLabel: string,
  isPlatformOwnerTenant: boolean,
  hasSystemAdminRole: boolean,
  mode: PetWorkspaceMode
) {
  if (isPlatformOwnerTenant) {
    return mode === 'grooming'
      ? 'Use this PetFlow workspace to inspect the service and operational product surface from the PhaifferTech platform-owner tenant.'
      : 'Use this PetFlow workspace to inspect the clinical and operational product surface from the PhaifferTech platform-owner tenant.';
  }

  if (hasSystemAdminRole) {
    return `This PetFlow workspace stays tenant-scoped to ${scopeName} while an internal support role is active in the current session.`;
  }

  return mode === 'grooming'
    ? `Service bookings, pet care routines, and customer follow-through remain scoped to ${scopeName} through the current ${workspaceLabel.toLowerCase()}.`
    : `Clinical operations, appointments, and customer follow-through remain scoped to ${scopeName} through the current ${workspaceLabel.toLowerCase()}.`;
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

function getPetWorkspaceCopy(mode: PetWorkspaceMode): PetWorkspaceCopy {
  if (mode === 'grooming') {
    return {
      heroEyebrow: 'PetFlow Grooming Workspace',
      overviewAppointmentsLabel: 'Services today',
      overviewAppointmentsDescription: 'Booked services expected during the current operating day.',
      overviewUpcomingLabel: 'Booked visits',
      overviewUpcomingDescription: 'Near-term service bookings already queued for the current tenant.',
      attentionLabel: 'Operations queue',
      attentionDescription: 'Inventory and billing signals that still need action in this workspace.',
      contextTitle: 'Service Operating Context',
      contextDescription: 'Keep service rhythm, customer coverage, and operational attention readable before entering deeper PetFlow flows.',
      snapshotTitle: 'Service Snapshot',
      snapshotDescription: 'Keep a compact view of booked service flow and operational attention before navigating into deeper PetFlow surfaces.',
      restrictedTitle: 'Service summary restricted',
      restrictedDescription: 'This PetFlow workspace is available, but the service snapshot requires `pet.dashboard.read`. Continue through the permitted client, schedule, and care flows below.',
      loadingTitle: 'Loading PetFlow summary',
      loadingDescription: 'Collecting the latest service and operational overview for this tenant workspace.',
      errorGuidanceTitle: 'Keep the service workspace moving',
      errorGuidanceDescription: 'Use the permitted PetFlow flows below while the summary feed recovers.',
      onboardingEyebrow: 'PetFlow Setup',
      onboardingTitle: 'Set up the PetFlow service workspace',
      onboardingDescription: 'This tenant does not have the first PetFlow service records in place yet. Work through the checklist below to establish clients, pet profiles, and booked services.',
      emptyActivityTitle: 'No recent PetFlow service activity yet',
      emptyActivityDescription: 'The workspace already has PetFlow records, but the summary returned no compact recent service activity block right now.',
      emptyGuidanceTitle: 'Keep working the PetFlow workspace',
      emptyGuidanceDescription: 'Continue through the core PetFlow flows below while the next service signal is still building.',
      emptySummaryTitle: 'No PetFlow summary available',
      emptySummaryDescription: 'No PetFlow operational data was returned for the current tenant workspace.',
      moduleSurfaceDescription: 'Scheduling, care, commercial, and inventory flows stay bounded to the active tenant contract.'
    };
  }

  return {
    heroEyebrow: 'PetFlow Workspace',
    overviewAppointmentsLabel: 'Appointments today',
    overviewAppointmentsDescription: 'Scheduled attendances expected during the current operating day.',
    overviewUpcomingLabel: 'Upcoming care',
    overviewUpcomingDescription: 'Near-term appointments already queued for the current tenant.',
    attentionLabel: 'Attention queue',
    attentionDescription: 'Commercial and inventory signals that still need action in this workspace.',
    contextTitle: 'Clinical Operating Context',
    contextDescription: 'Keep care rhythm, patient coverage, and operational attention readable before entering deeper PetFlow flows.',
    snapshotTitle: 'Clinic Snapshot',
    snapshotDescription: 'Keep a compact view of clinical throughput and commercial pressure before navigating into the deeper PetFlow surfaces.',
    restrictedTitle: 'Clinic summary restricted',
    restrictedDescription: 'This PetFlow workspace is available, but the clinic snapshot requires `pet.dashboard.read`. Continue through the permitted client, appointment, and medical flows below.',
    loadingTitle: 'Loading PetFlow summary',
    loadingDescription: 'Collecting the latest clinic and commercial overview for this tenant workspace.',
    errorGuidanceTitle: 'Keep the clinic workspace moving',
    errorGuidanceDescription: 'Use the permitted PetFlow flows below while the summary feed recovers.',
    onboardingEyebrow: 'PetFlow Onboarding',
    onboardingTitle: 'Set up the PetFlow workspace',
    onboardingDescription: 'This tenant does not have the first clinic entities in place yet. Work through the checklist below to establish clients, patient records, and appointment flow.',
    emptyActivityTitle: 'No recent PetFlow activity yet',
    emptyActivityDescription: 'The workspace already has PetFlow records, but the summary returned no compact recent clinic activity block right now.',
    emptyGuidanceTitle: 'Keep working the PetFlow workspace',
    emptyGuidanceDescription: 'Continue through the core PetFlow flows below while the next clinic signal is still building.',
    emptySummaryTitle: 'No PetFlow summary available',
    emptySummaryDescription: 'No PetFlow dashboard data was returned for the current tenant workspace.',
    moduleSurfaceDescription: 'Clinical, commercial, and medical flows stay bounded to the active tenant contract.'
  };
}

function buildPetContextCards({
  canReadDashboard,
  summary,
  firstUse,
  scopeName,
  accessLabel,
  mode
}: {
  canReadDashboard: boolean;
  summary: PetDashboardSummary | null;
  firstUse: boolean;
  scopeName: string;
  accessLabel: string;
  mode: PetWorkspaceMode;
}): DashboardContextCard[] {
  const throughputValue = !canReadDashboard
    ? 'Restricted'
    : summary
      ? `${summary.appointmentsToday} today / ${summary.upcomingAppointments} upcoming`
      : 'Loading...';
  const coverageValue = !canReadDashboard
    ? 'Permission-bound'
    : summary
      ? `${summary.totalClients} clients / ${summary.totalPets} pets`
      : 'Loading...';
  const queueValue = !canReadDashboard
    ? accessLabel
    : summary
      ? `${summary.lowStockProducts} stock / ${summary.pendingInvoices} billing`
      : 'Loading...';

  return [
    {
      key: 'pet-throughput',
      label: mode === 'grooming' ? 'Service rhythm' : 'Care rhythm',
      value: throughputValue,
      description: firstUse
        ? 'The workspace is still establishing the first scheduled services, pet profiles, and customer cadence.'
        : mode === 'grooming'
          ? 'Daily bookings and near-term visits stay visible before drilling into service schedules and customer records.'
          : 'Daily appointments and near-term care stay visible before drilling into clinic schedules and patient records.',
      tone: 'accent'
    },
    {
      key: 'pet-coverage',
      label: mode === 'grooming' ? 'Customer coverage' : 'Patient coverage',
      value: coverageValue,
      description: mode === 'grooming'
        ? 'Client and pet visibility keep reception, groomers, and service history aligned inside the same workspace.'
        : 'Client and patient visibility keep clinical intake, attendance, and medical follow-through aligned in the same workspace.',
      tone: 'primary'
    },
    {
      key: 'pet-operations',
      label: 'Operational attention',
      value: queueValue,
      description: `PetFlow remains scoped to ${scopeName} with billing, inventory, and access boundaries explicit for the current tenant.`,
      tone: 'neutral'
    }
  ];
}

function resolvePetActionHref(actions: ModuleWorkspaceAction[], href: string, fallbackHref: string) {
  const action = actions.find((candidate) => candidate.href === href && candidate.capability?.interactive !== false);
  return action?.href ?? fallbackHref;
}

function resolveFallbackPetAction(actions: ModuleWorkspaceAction[]) {
  const interactiveAction = actions.find((candidate) => candidate.capability?.interactive !== false);
  if (!interactiveAction) {
    return null;
  }

  return {
    title: interactiveAction.title,
    description: interactiveAction.capability?.kind === 'ready'
      ? interactiveAction.description
      : interactiveAction.capability?.description ?? interactiveAction.description,
    href: interactiveAction.href
  } satisfies PetPrimaryAction;
}

function findPetPulseCard(summary: PetDashboardSummary | null, key: string) {
  return summary?.summaryCards.find((card) => card.key === key) ?? null;
}

function resolvePetPrimaryAction(actions: ModuleWorkspaceAction[], summary: PetDashboardSummary | null, firstUse: boolean, mode: PetWorkspaceMode) {
  const fallbackAction = resolveFallbackPetAction(actions);

  if (!fallbackAction) {
    return null;
  }

  if (firstUse) {
    return {
      title: mode === 'grooming' ? 'Register first client' : 'Register first client',
      description: mode === 'grooming'
        ? 'Start the service workspace by creating the first client and pet profile.'
        : 'Start the clinic workspace by creating the first client and patient profile.',
      href: resolvePetActionHref(actions, '/pet/clients', fallbackAction.href)
    } satisfies PetPrimaryAction;
  }

  if ((summary?.appointmentsToday ?? 0) > 0) {
    return {
      title: mode === 'grooming' ? 'Review today\'s services' : 'Review today\'s appointments',
      description: `${summary?.appointmentsToday ?? 0} scheduled item(s) are already queued for the current operating day.`,
      href: resolvePetActionHref(actions, '/pet/appointments', fallbackAction.href)
    } satisfies PetPrimaryAction;
  }

  if ((summary?.pendingInvoices ?? 0) > 0) {
    return {
      title: 'Review pending invoices',
      description: `${summary?.pendingInvoices ?? 0} invoice(s) still need billing follow-through in PetFlow.`,
      href: resolvePetActionHref(actions, '/pet/invoices', fallbackAction.href)
    } satisfies PetPrimaryAction;
  }

  if ((summary?.lowStockProducts ?? 0) > 0) {
    return {
      title: 'Check low stock items',
      description: `${summary?.lowStockProducts ?? 0} product SKU(s) are approaching stock pressure.`,
      href: resolvePetActionHref(actions, '/pet/products', fallbackAction.href)
    } satisfies PetPrimaryAction;
  }

  return {
    title: 'Open PetFlow dashboard',
    description: mode === 'grooming'
      ? 'Review service throughput, upcoming visits, and the operational backlog.'
      : 'Review clinic throughput, recent records, and the current operational backlog.',
    href: resolvePetActionHref(actions, '/pet/dashboard', fallbackAction.href)
  } satisfies PetPrimaryAction;
}

export function PetHome() {
  const platform = useFrontendPlatform();
  const { hasPermission, hasAnyPermission } = usePermissions();
  const [summary, setSummary] = useState<PetDashboardSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canReadDashboard = hasPermission('pet.dashboard.read')
    && hasAnyTenantEntitlement(platform.user, petSubmoduleEntitlements);
  const petVisual = useMemo(
    () => resolveModuleWorkspaceVisualState(platform, {
      moduleContext: 'pet',
      defaultProfile: platform.visualProfile.key === 'pet-grooming' ? 'pet-grooming' : 'pet-clinic'
    }),
    [platform]
  );
  const petMode = resolvePetWorkspaceMode(petVisual.visualProfile.key);
  const petCopy = useMemo(() => getPetWorkspaceCopy(petMode), [petMode]);
  const petWorkspaceActions = useMemo(
    () => getPetWorkspaceActions(petMode).filter((action) => (
      !action.anyEntitlements || hasAnyTenantEntitlement(platform.user, action.anyEntitlements)
    )),
    [petMode, platform.user]
  );
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
  const primaryAction = useMemo(
    () => resolvePetPrimaryAction(actionStates, summary, firstUse, petMode),
    [actionStates, firstUse, petMode, summary]
  );
  const pulseCards = useMemo(() => {
    if (!summary) {
      return [];
    }

    return ['appointments-today', 'pets', 'pending-invoices', 'low-stock-products']
      .map((key) => findPetPulseCard(summary, key))
      .filter((card): card is NonNullable<ReturnType<typeof findPetPulseCard>> => Boolean(card));
  }, [summary]);
  const contextCards = useMemo(
    () => buildPetContextCards({
      canReadDashboard,
      summary,
      firstUse,
      scopeName: platform.branding.scopeName,
      accessLabel: platform.workspace.accessLabel,
      mode: petMode
    }),
    [canReadDashboard, firstUse, petMode, platform.branding.scopeName, platform.workspace.accessLabel, summary]
  );

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
    <div
      className="space-y-6"
      style={petVisual.style}
      data-pet-profile={petVisual.visualProfile.key}
    >
      <ModuleWorkspaceHero
        eyebrow={petCopy.heroEyebrow}
        title={`${platform.branding.scopeName} · PetFlow`}
        description={resolvePetWorkspaceDescription(
          platform.branding.scopeName,
          platform.workspace.workspaceLabel,
          platform.workspace.isPlatformOwnerTenant,
          platform.workspace.hasSystemAdminRole,
          petMode
        )}
        action={primaryAction ? (
          <Link
            href={primaryAction.href}
            className="inline-flex rounded-full border border-[color:var(--tenant-accent)] bg-[color:var(--tenant-accent-soft)] px-4 py-2 text-sm font-semibold text-[color:var(--tenant-accent)] transition hover:-translate-y-0.5"
          >
            {primaryAction.title}
          </Link>
        ) : null}
        chips={[
          { label: 'Workspace', value: platform.workspace.workspaceLabel },
          { label: 'Access', value: platform.workspace.accessLabel, tone: 'neutral' },
          { label: 'Profile', value: petVisual.visualProfile.label, tone: 'neutral' },
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
                description: petCopy.moduleSurfaceDescription,
                status: 'active'
              },
              {
                label: 'Next action',
                value: primaryAction?.title ?? 'Open PetFlow workspace',
                description: primaryAction?.description ?? 'Use the workspace actions below to continue.',
                status: firstUse ? 'setup required' : summary && (summary.pendingInvoices > 0 || summary.lowStockProducts > 0) ? 'pending' : 'active'
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
            label: petCopy.overviewAppointmentsLabel,
            value: canReadDashboard ? resolveOverviewValue(summary?.appointmentsToday) : '--',
            description: petCopy.overviewAppointmentsDescription,
            status: !canReadDashboard ? 'no permission' : summary && firstUse ? 'setup required' : null,
            capability: !canReadDashboard
              ? permissionCapability({
                  title: 'Dashboard visibility required',
                  description: 'Grant `pet.dashboard.read` to surface clinic appointment counts on this workspace landing page.'
                })
              : summary && firstUse
                ? notConfiguredCapability({
                    title: 'Appointments not configured yet',
                    description: petMode === 'grooming'
                      ? 'Create the first clients and pet profiles before this workspace can schedule and surface service throughput.'
                      : 'Create the first clients and pet profiles before this workspace can schedule and surface clinic throughput.'
                  })
                : undefined
          },
          {
            label: petCopy.overviewUpcomingLabel,
            value: canReadDashboard ? resolveOverviewValue(summary?.upcomingAppointments) : '--',
            description: petCopy.overviewUpcomingDescription,
            status: !canReadDashboard ? 'no permission' : summary && firstUse ? 'setup required' : null,
            capability: !canReadDashboard
              ? permissionCapability({
                  title: 'Clinic forecast requires dashboard access',
                  description: 'Grant `pet.dashboard.read` to surface upcoming appointment load from the workspace overview.'
                })
              : summary && firstUse
                ? notConfiguredCapability({
                    title: petMode === 'grooming' ? 'Upcoming services not configured yet' : 'Upcoming care not configured yet',
                    description: petMode === 'grooming'
                      ? 'Near-term services appear after the first bookings are created inside this tenant workspace.'
                      : 'Near-term care appears after the first appointments are booked inside this tenant workspace.'
                  })
                : undefined
          },
          {
            label: petCopy.attentionLabel,
            value: canReadDashboard
              ? summary
                ? `${summary.lowStockProducts} low-stock / ${summary.pendingInvoices} invoices`
                : 'Loading...'
              : '--',
            description: petCopy.attentionDescription,
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
        title={petCopy.contextTitle}
        description={petCopy.contextDescription}
      >
        <DashboardContextCardGrid cards={contextCards} />
      </ModuleWorkspaceSection>

      <ModuleWorkspaceSection
        title={petCopy.snapshotTitle}
        description={petCopy.snapshotDescription}
        action={primaryAction ? (
          <Link
            href={primaryAction.href}
            className="inline-flex text-sm font-semibold text-[color:var(--tenant-accent)]"
          >
            {primaryAction.title}
          </Link>
        ) : null}
      >
        {!canReadDashboard ? (
          <div className="space-y-4">
            <ModuleWorkspaceState
              tone="neutral"
              title={petCopy.restrictedTitle}
              description={petCopy.restrictedDescription}
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
            title={petCopy.loadingTitle}
            description={petCopy.loadingDescription}
          />
        ) : error ? (
          <div className="space-y-4">
            <ModuleWorkspaceState tone="error" title="PetFlow summary unavailable" description={error} />
            <ModuleWorkspaceGuidance
              title={petCopy.errorGuidanceTitle}
              description={petCopy.errorGuidanceDescription}
              steps={restrictedGuidance}
            />
          </div>
        ) : summary && firstUse ? (
          <GettingStartedChecklist
            eyebrow={petCopy.onboardingEyebrow}
            title={petCopy.onboardingTitle}
            description={petCopy.onboardingDescription}
            steps={setupGuidance}
          />
        ) : summary ? (
          <div className="space-y-4">
            <MetricGrid cards={pulseCards} columns="md:grid-cols-2 xl:grid-cols-4" />
            {featuredSection ? (
              <DashboardSection section={featuredSection} />
            ) : (
              <div className="space-y-4">
                <ModuleWorkspaceState
                  tone="neutral"
                  title={petCopy.emptyActivityTitle}
                  description={petCopy.emptyActivityDescription}
                />
                <ModuleWorkspaceGuidance
                  title={petCopy.emptyGuidanceTitle}
                  description={petCopy.emptyGuidanceDescription}
                  steps={restrictedGuidance}
                />
              </div>
            )}
          </div>
        ) : (
          <EmptyStateCard
            title={petCopy.emptySummaryTitle}
            description={petCopy.emptySummaryDescription}
            actionLabel={primaryAction?.title}
            href={primaryAction?.href}
          />
        )}
      </ModuleWorkspaceSection>
    </div>
  );
}
