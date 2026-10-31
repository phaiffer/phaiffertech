'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { PetModuleSubnav } from '@/modules/pet/pet-module-subnav';
import { petMedicalRoutePermissions } from '@/modules/pet/pet-medical-permissions';
import { usePermissions } from '@/shared/auth/usePermissions';
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
import { useAppI18n, useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { GettingStartedChecklist } from '@/shared/onboarding/getting-started';
import { useFrontendPlatform } from '@/shared/platform/use-frontend-platform';
import { petService } from '@/shared/services/pet-service';
import { PetDashboardSummary } from '@/shared/types/pet';
import type { AppMessages } from '@/shared/i18n/messages/pt-br';
import { resolveApiErrorMessage } from '@/shared/lib/api-error-message';

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

function localizePetEnvironmentLabel(copy: AppMessages['screens']['petHome'], label?: string | null, fallback = copy.environmentActive) {
  if (!label) {
    return fallback;
  }

  const labels: Record<string, string> = {
    'tenant workspace': copy.environmentCustomer,
    'contracted saas workspace': copy.environmentContracted
  };
  return labels[label.trim().toLowerCase()] ?? label;
}

function getPetWorkspaceActions(copy: AppMessages['screens']['petHome'], mode: PetWorkspaceMode): ModuleWorkspaceAction[] {
  const grooming = mode === 'grooming';

  return [
    {
      href: '/pet/dashboard',
      eyebrow: copy.actionOverviewEyebrow,
      title: copy.actionOverviewTitle,
      description: grooming
        ? copy.actionOverviewDescriptionGrooming
        : copy.actionOverviewDescriptionClinic,
      permission: 'pet.dashboard.read',
      anyEntitlements: petSubmoduleEntitlements,
      restrictionTitle: copy.restrictionDashboardTitle,
      restrictionDescription: copy.restrictionDashboardDescription
    },
    {
      href: '/pet/clients',
      eyebrow: copy.actionClientsEyebrow,
      title: copy.actionClientsTitle,
      description: copy.actionClientsDescription,
      permission: 'pet.client.read',
      anyEntitlements: petSubmoduleEntitlements,
      restrictionTitle: copy.restrictionClientsTitle,
      restrictionDescription: copy.restrictionClientsDescription
    },
    {
      href: '/pet/pets',
      eyebrow: grooming ? copy.actionPetsEyebrowGrooming : copy.clinicalEyebrow,
      title: grooming ? copy.actionPetsTitleGrooming : copy.actionPetsTitleClinic,
      description: grooming
        ? copy.actionPetsDescriptionGrooming
        : copy.actionPetsDescriptionClinic,
      permission: 'pet.profile.read',
      anyEntitlements: petSubmoduleEntitlements,
      restrictionTitle: copy.restrictionPetsTitle,
      restrictionDescription: copy.restrictionPetsDescription
    },
    {
      href: '/pet/appointments',
      eyebrow: grooming ? copy.actionAppointmentsEyebrow : copy.clinicalEyebrow,
      title: copy.actionAppointmentsTitle,
      description: grooming
        ? copy.actionAppointmentsDescriptionGrooming
        : copy.actionAppointmentsDescriptionClinic,
      permission: 'pet.appointment.read',
      anyEntitlements: petOperationalEntitlements,
      restrictionTitle: copy.restrictionAppointmentsTitle,
      restrictionDescription: copy.restrictionAppointmentsDescription
    },
    {
      href: '/pet/plans',
      eyebrow: grooming ? copy.actionPlansEyebrowGrooming : copy.actionPlansEyebrowClinic,
      title: grooming ? copy.actionPlansTitleGrooming : copy.actionPlansTitleClinic,
      description: grooming
        ? copy.actionPlansDescriptionGrooming
        : copy.actionPlansDescriptionClinic,
      permission: 'pet.plan.read',
      anyEntitlements: petOperationalEntitlements,
      restrictionTitle: copy.restrictionPlansTitle,
      restrictionDescription: copy.restrictionPlansDescription
    },
    {
      href: '/pet/services',
      eyebrow: grooming ? copy.actionServicesEyebrowGrooming : copy.commercialEyebrow,
      title: copy.actionServicesTitle,
      description: copy.actionServicesDescription,
      permission: 'pet.service.read',
      anyEntitlements: petOperationalEntitlements,
      restrictionTitle: copy.restrictionServicesTitle,
      restrictionDescription: copy.restrictionServicesDescription
    },
    {
      href: '/pet/professionals',
      eyebrow: grooming ? copy.actionTeamEyebrowGrooming : copy.clinicalEyebrow,
      title: copy.actionTeamTitle,
      description: grooming
        ? copy.actionTeamDescriptionGrooming
        : copy.actionTeamDescriptionClinic,
      permission: 'pet.professional.read',
      anyEntitlements: petOperationalEntitlements,
      restrictionTitle: copy.restrictionTeamTitle,
      restrictionDescription: copy.restrictionTeamDescription
    },
    {
      href: '/pet/medical-records',
      eyebrow: grooming ? copy.actionRecordsEyebrowGrooming : copy.actionRecordsEyebrowClinic,
      title: copy.actionRecordsTitle,
      description: grooming
        ? copy.actionRecordsDescriptionGrooming
        : copy.actionRecordsDescriptionClinic,
      anyOf: petMedicalRoutePermissions,
      anyEntitlements: petClinicalEntitlements,
      restrictionTitle: copy.restrictionRecordsTitle,
      restrictionDescription: copy.restrictionRecordsDescription
    },
    {
      href: '/pet/products',
      eyebrow: copy.commercialEyebrow,
      title: copy.actionProductsTitle,
      description: copy.actionProductsDescription,
      permission: 'pet.product.read',
      anyEntitlements: petRetailEntitlements,
      restrictionTitle: copy.restrictionProductsTitle,
      restrictionDescription: copy.restrictionProductsDescription
    },
    {
      href: '/pet/inventory',
      eyebrow: copy.actionInventoryEyebrow,
      title: copy.actionInventoryTitle,
      description: copy.actionInventoryDescription,
      permission: 'pet.inventory.read',
      anyEntitlements: petRetailEntitlements,
      restrictionTitle: copy.restrictionInventoryTitle,
      restrictionDescription: copy.restrictionInventoryDescription
    },
    {
      href: '/pet/invoices',
      eyebrow: copy.actionBillingEyebrow,
      title: copy.actionBillingTitle,
      description: copy.actionBillingDescription,
      permission: 'pet.invoice.read',
      anyEntitlements: petRetailEntitlements,
      restrictionTitle: copy.restrictionBillingTitle,
      restrictionDescription: copy.restrictionBillingDescription
    },
    {
      href: '/pet/insights',
      eyebrow: copy.actionInsightsEyebrow,
      title: copy.actionInsightsTitle,
      description: grooming
        ? copy.actionInsightsDescriptionGrooming
        : copy.actionInsightsDescriptionClinic,
      permission: 'pet.dashboard.read',
      anyEntitlements: petSubmoduleEntitlements,
      restrictionTitle: copy.restrictionDashboardTitle,
      restrictionDescription: copy.restrictionInsightsDescription
    }
  ];
}

function resolvePetWorkspaceDescription(
  copy: AppMessages['screens']['petHome'], scopeName: string,
  workspaceLabel: string,
  isPlatformOwnerTenant: boolean,
  hasSystemAdminRole: boolean,
  mode: PetWorkspaceMode
) {
  if (isPlatformOwnerTenant) {
    return mode === 'grooming'
      ? copy.platformScopeGrooming
      : copy.platformScopeClinic;
  }

  if (hasSystemAdminRole) {
    return copy.supportScopeDescription.replace('{scope}', scopeName);
  }

  const template = mode === 'grooming' ? copy.groomingScopeDescription : copy.clinicScopeDescription;
  return template.replace('{scope}', scopeName).replace('{workspace}', workspaceLabel.toLowerCase());
}

function resolveOverviewValue(copy: AppMessages['screens']['petHome'], value?: number) {
  return value === undefined ? copy.loadingShort : value.toString();
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

function getPetWorkspaceCopy(copy: AppMessages['screens']['petHome'], mode: PetWorkspaceMode): PetWorkspaceCopy {
  if (mode === 'grooming') {
    return {
      heroEyebrow: copy.groomingWorkspaceTitle,
      overviewAppointmentsLabel: copy.groomingTodayLabel,
      overviewAppointmentsDescription: copy.groomingTodayDescription,
      overviewUpcomingLabel: copy.groomingUpcomingLabel,
      overviewUpcomingDescription: copy.groomingUpcomingDescription,
      attentionLabel: copy.attentionLabel,
      attentionDescription: copy.groomingAttentionDescription,
      contextTitle: copy.businessSummaryTitle,
      contextDescription: copy.businessSummaryDescription,
      snapshotTitle: copy.groomingSnapshotTitle,
      snapshotDescription: copy.snapshotDescription,
      restrictedTitle: copy.groomingRestrictedTitle,
      restrictedDescription: copy.groomingRestrictedDescription,
      loadingTitle: copy.summaryLoadingTitle,
      loadingDescription: copy.groomingSummaryLoadingDescription,
      errorGuidanceTitle: copy.continueOperationsTitle,
      errorGuidanceDescription: copy.continueOperationsDescription,
      onboardingEyebrow: copy.onboardingEyebrow,
      onboardingTitle: copy.onboardingTitle,
      onboardingDescription: copy.onboardingDescription,
      emptyActivityTitle: copy.groomingEmptyActivityTitle,
      emptyActivityDescription: copy.groomingEmptyActivityDescription,
      emptyGuidanceTitle: copy.continueWorkspaceTitle,
      emptyGuidanceDescription: copy.continueWorkspaceDescription,
      emptySummaryTitle: copy.emptySummaryTitle,
      emptySummaryDescription: copy.emptySummaryDescription,
      moduleSurfaceDescription: copy.groomingScopeNote
    };
  }

  return {
    heroEyebrow: copy.clinicWorkspaceTitle,
    overviewAppointmentsLabel: copy.clinicTodayLabel,
    overviewAppointmentsDescription: copy.clinicTodayDescription,
    overviewUpcomingLabel: copy.clinicUpcomingLabel,
    overviewUpcomingDescription: copy.clinicUpcomingDescription,
    attentionLabel: copy.attentionLabel,
    attentionDescription: copy.clinicAttentionDescription,
    contextTitle: copy.businessSummaryTitle,
    contextDescription: copy.businessSummaryDescription,
    snapshotTitle: copy.clinicSnapshotTitle,
    snapshotDescription: copy.snapshotDescription,
    restrictedTitle: copy.clinicRestrictedTitle,
    restrictedDescription: copy.clinicRestrictedDescription,
    loadingTitle: copy.summaryLoadingTitle,
    loadingDescription: copy.clinicSummaryLoadingDescription,
    errorGuidanceTitle: copy.continueOperationsTitle,
    errorGuidanceDescription: copy.continueOperationsDescription,
    onboardingEyebrow: copy.onboardingEyebrow,
    onboardingTitle: copy.onboardingTitle,
    onboardingDescription: copy.onboardingDescription,
    emptyActivityTitle: copy.clinicEmptyActivityTitle,
    emptyActivityDescription: copy.clinicEmptyActivityDescription,
    emptyGuidanceTitle: copy.continueWorkspaceTitle,
    emptyGuidanceDescription: copy.continueWorkspaceDescription,
    emptySummaryTitle: copy.emptySummaryTitle,
    emptySummaryDescription: copy.emptySummaryDescription,
    moduleSurfaceDescription: copy.clinicScopeNote
  };
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

function resolvePetPrimaryAction(copy: AppMessages['screens']['petHome'], actions: ModuleWorkspaceAction[], summary: PetDashboardSummary | null, firstUse: boolean, mode: PetWorkspaceMode) {
  const fallbackAction = resolveFallbackPetAction(actions);

  if (!fallbackAction) {
    return null;
  }

  if (firstUse) {
    return {
      title: copy.startWithClients,
      description: mode === 'grooming'
        ? copy.startWithClientsDescription
        : copy.startWithClientsDescription,
      href: resolvePetActionHref(actions, '/pet/clients', fallbackAction.href)
    } satisfies PetPrimaryAction;
  }

  if ((summary?.appointmentsToday ?? 0) > 0) {
    return {
      title: mode === 'grooming' ? copy.reviewTodayServices : copy.reviewTodayAppointments,
      description: copy.appointmentsTodayCount.replace('{count}', String(summary?.appointmentsToday ?? 0)),
      href: resolvePetActionHref(actions, '/pet/appointments', fallbackAction.href)
    } satisfies PetPrimaryAction;
  }

  if ((summary?.pendingInvoices ?? 0) > 0) {
    return {
      title: copy.reviewPendingBilling,
      description: copy.pendingInvoicesCount.replace('{count}', String(summary?.pendingInvoices ?? 0)),
      href: resolvePetActionHref(actions, '/pet/invoices', fallbackAction.href)
    } satisfies PetPrimaryAction;
  }

  if ((summary?.lowStockProducts ?? 0) > 0) {
    return {
      title: copy.checkLowStock,
      description: copy.lowStockCount.replace('{count}', String(summary?.lowStockProducts ?? 0)),
      href: resolvePetActionHref(actions, '/pet/products', fallbackAction.href)
    } satisfies PetPrimaryAction;
  }

  return {
    title: copy.actionOverviewTitle,
    description: mode === 'grooming'
      ? copy.reviewOperationsPulse
      : copy.reviewOperationsPulse,
    href: resolvePetActionHref(actions, '/pet/dashboard', fallbackAction.href)
  } satisfies PetPrimaryAction;
}

type PetHomeCopy = AppMessages['screens']['petHome'];

function petSectionTitle(copy: PetHomeCopy, key: string): string | undefined {
  const titles: Record<string, string> = {
    'clinical-feed': copy.clinicFlow,
    'service-feed': copy.groomingFlow
  };
  return titles[key];
}

function petSectionDescription(copy: PetHomeCopy, key: string): string | undefined {
  const descriptions: Record<string, string> = {
    'clinical-feed': copy.clinicRecentActivity,
    'service-feed': copy.groomingRecentActivity
  };
  return descriptions[key];
}

function localizePetStatus(copy: PetHomeCopy, status?: string | null) {
  if (!status) {
    return status;
  }

  const statuses: Record<string, string> = {
    active: copy.statusActive,
    pending: copy.statusPending,
    scheduled: copy.statusScheduled,
    'no permission': copy.noPermission,
    'setup required': copy.setupRequired,
    'no data': copy.noData
  };
  return statuses[status.toLowerCase()] ?? status;
}

function localizePetSummaryCard<T extends { key: string; label: string; status?: string | null }>(copy: PetHomeCopy, card: T): T {
  const labels: Record<string, string> = {
    clients: copy.summaryClients,
    pets: 'Pets',
    appointments: copy.summaryAppointments,
    'appointments-today': copy.clinicTodayLabel,
    invoices: copy.summaryInvoices,
    'pending-invoices': copy.pendingInvoices,
    'low-stock-products': copy.lowStock
  };
  return {
    ...card,
    label: labels[card.key] ?? card.label,
    status: localizePetStatus(copy, card.status)
  };
}

export function PetHome() {
  const copy = useAppMessages().screens.petHome;
  const { locale } = useAppI18n();
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
  const petCopy = useMemo(() => getPetWorkspaceCopy(copy, petMode), [petMode, copy]);
  const localizedWorkspaceLabel = useMemo(
    () => localizePetEnvironmentLabel(copy, platform.workspace.workspaceLabel),
    [platform.workspace.workspaceLabel, copy]
  );
  const localizedAccessLabel = useMemo(
    () => localizePetEnvironmentLabel(copy, platform.workspace.accessLabel),
    [platform.workspace.accessLabel, copy]
  );
  const petWorkspaceActions = useMemo(
    () => getPetWorkspaceActions(copy, petMode).filter((action) => (
      !action.anyEntitlements || hasAnyTenantEntitlement(platform.user, action.anyEntitlements)
    )),
    [petMode, platform.user, copy]
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
        ? readyCapability(action.status, locale)
        : permissionCapability({
            title: action.restrictionTitle ?? copy.permissionRequired,
            description: action.restrictionDescription ?? action.description
          }, locale);

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
          title: copy.appointmentsSetupTitle,
          description: copy.appointmentsSetupDescription
        }, locale);

        return { ...action, capability, status: capability.status };
      }

      if (firstUse && action.href === '/pet/invoices') {
        const capability = notConfiguredCapability({
          title: copy.billingSetupTitle,
          description: copy.billingSetupDescription
        }, locale);

        return { ...action, capability, status: capability.status };
      }

      if (firstUse && action.href === '/pet/insights') {
        const capability = notConfiguredCapability({
          title: copy.insightsSetupTitle,
          description: copy.insightsSetupDescription
        }, locale);

        return { ...action, capability, status: capability.status };
      }

      if (firstUse && action.href === '/pet/medical-records') {
        const capability = notConfiguredCapability({
          title: copy.recordsSetupTitle,
          description: copy.recordsSetupDescription
        }, locale);

        return { ...action, capability, status: capability.status };
      }

      if (firstUse && action.href === '/pet/plans') {
        const capability = notConfiguredCapability({
          title: copy.plansSetupTitle,
          description: copy.plansSetupDescription
        }, locale);

        return { ...action, capability, status: capability.status };
      }

      if (!firstUse && !featuredSection && action.href === '/pet/appointments') {
        const capability = noDataCapability({
          title: copy.noRecentAppointments,
          description: petMode === 'grooming'
            ? copy.recentActivityEmptyGrooming
            : copy.recentActivityEmptyClinic
        }, locale);

        return { ...action, capability, status: capability.status };
      }

      return action;
    });
  const landingActions = useMemo(
    () => actionStates.filter((action) => ['/pet/clients', '/pet/appointments', '/pet/plans', '/pet/professionals', '/pet/inventory', '/pet/invoices'].includes(action.href)),
    [actionStates]
  );
  const setupGuidance = buildPetGuidanceSteps(actionStates, ['/pet/clients', '/pet/appointments', '/pet/plans', '/pet/invoices']);
  const restrictedGuidance = buildPetGuidanceSteps(actionStates, ['/pet/clients', '/pet/appointments', '/pet/plans', '/pet/invoices']);
  const primaryAction = useMemo(
    () => resolvePetPrimaryAction(copy, actionStates, summary, firstUse, petMode),
    [actionStates, firstUse, petMode, summary, copy]
  );
  const dashboardHref = useMemo(
    () => resolvePetActionHref(actionStates, '/pet/dashboard', primaryAction?.href ?? '/pet/dashboard'),
    [actionStates, primaryAction]
  );
  const pulseCards = useMemo(() => {
    if (!summary) {
      return [];
    }

    return ['appointments-today', 'pets', 'pending-invoices', 'low-stock-products']
      .map((key) => findPetPulseCard(summary, key))
      .filter((card): card is NonNullable<ReturnType<typeof findPetPulseCard>> => Boolean(card))
      .map((card) => localizePetSummaryCard(copy, card));
  }, [summary, copy]);

  const localizedFeaturedSection = useMemo(() => {
    if (!featuredSection) {
      return null;
    }

    return {
      ...featuredSection,
      title: petSectionTitle(copy, featuredSection.key) ?? featuredSection.title,
      description: petSectionDescription(copy, featuredSection.key) ?? featuredSection.description,
      cards: featuredSection.cards.map((card) => localizePetSummaryCard(copy, card)),
      items: featuredSection.items.map((item) => ({
        ...item,
        sublabel: item.sublabel?.replace(/^Scheduled with /, 'Agendado com '),
        status: localizePetStatus(copy, item.status)
      }))
    };
  }, [featuredSection, copy]);

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
        setError(resolveApiErrorMessage(err, copy.summaryLoadError));
        setLoadingSummary(false);
      });

    return () => {
      active = false;
    };
  }, [canReadDashboard, copy]);

  return (
    <div
      className="space-y-6"
      style={petVisual.style}
      data-pet-profile={petVisual.visualProfile.key}
    >
      <PetModuleSubnav />

      <ModuleWorkspaceHero
        eyebrow={petCopy.heroEyebrow}
        title={`${platform.branding.scopeName} · Gestão Pet`}
        description={resolvePetWorkspaceDescription(
          copy, platform.branding.scopeName,
          localizedWorkspaceLabel,
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
          { label: copy.workspace, value: localizedWorkspaceLabel },
          { label: copy.access, value: localizedAccessLabel, tone: 'neutral' }
        ]}
        aside={(
          <ModuleWorkspaceFactList
            facts={[
              {
                label: copy.workspaceCode,
                value: platform.branding.tenantCode ?? copy.notProvided,
                description: copy.workspaceCodeDescription
              },
              {
                label: copy.nextAction,
                value: primaryAction?.title ?? copy.openWorkspace,
                description: primaryAction?.description ?? copy.continueBelow,
                status: firstUse ? copy.setupRequired : summary && (summary.pendingInvoices > 0 || summary.lowStockProducts > 0) ? 'pendente' : 'ativo'
              }
            ]}
          />
        )}
      />

      <ModuleWorkspaceOverviewGrid
        cards={[
          {
            label: copy.workspaceScope,
            value: platform.branding.scopeName,
            description: copy.workspaceScopeDescription
          },
          {
            label: petCopy.overviewAppointmentsLabel,
            value: canReadDashboard ? resolveOverviewValue(copy, summary?.appointmentsToday) : '--',
            description: petCopy.overviewAppointmentsDescription,
            status: !canReadDashboard ? copy.noPermission : summary && firstUse ? copy.setupRequired : null,
            capability: !canReadDashboard
              ? permissionCapability({
                  title: copy.dashboardAccessRequired,
                  description: copy.grantDashboardAppointments
                }, locale)
              : summary && firstUse
                ? notConfiguredCapability({
                    title: copy.appointmentsNotSetUp,
                    description: petMode === 'grooming'
                      ? copy.appointmentsNotSetUpGrooming
                      : copy.appointmentsNotSetUpClinic
                  }, locale)
                : undefined
          },
          {
            label: petCopy.overviewUpcomingLabel,
            value: canReadDashboard ? resolveOverviewValue(copy, summary?.upcomingAppointments) : '--',
            description: petCopy.overviewUpcomingDescription,
            status: !canReadDashboard ? copy.noPermission : summary && firstUse ? copy.setupRequired : null,
            capability: !canReadDashboard
              ? permissionCapability({
                  title: copy.forecastNeedsDashboard,
                  description: copy.grantDashboardForecast
                }, locale)
              : summary && firstUse
                ? notConfiguredCapability({
                    title: petMode === 'grooming' ? copy.upcomingServicesNotSetUp : copy.upcomingCareNotSetUp,
                    description: petMode === 'grooming'
                      ? copy.upcomingServicesDescription
                      : copy.upcomingCareDescription
                  }, locale)
                : undefined
          },
          {
            label: petCopy.attentionLabel,
            value: canReadDashboard
              ? summary
                ? copy.attentionValue
                  .replace('{lowStock}', String(summary.lowStockProducts))
                  .replace('{invoices}', String(summary.pendingInvoices))
                : copy.loadingShort
              : '--',
            description: petCopy.attentionDescription,
            status: !canReadDashboard
              ? copy.noPermission
              : summary && firstUse
                ? copy.setupRequired
                : summary && (summary.lowStockProducts > 0 || summary.pendingInvoices > 0)
                  ? 'pendente'
                  : summary
                    ? 'ativo'
                    : null,
            capability: !canReadDashboard
              ? permissionCapability({
                  title: copy.queueNeedsDashboard,
                  description: copy.grantDashboardQueue
                }, locale)
              : summary && firstUse
                ? notConfiguredCapability({
                    title: copy.queueNotSetUp,
                    description: copy.queueNotSetUpDescription
                  }, locale)
                : undefined
          }
        ]}
      />

      <ModuleWorkspaceQuickActionGrid
        title={copy.coreFlowsTitle}
        description={copy.coreFlowsDescription}
        actions={landingActions}
        emptyTitle={copy.noFlowsTitle}
        emptyDescription={copy.noFlowsDescription}
      />

      <ModuleWorkspaceSection
        title={petCopy.snapshotTitle}
        description={petCopy.snapshotDescription}
        action={canReadDashboard ? (
          <Link
            href={dashboardHref}
            className="inline-flex text-sm font-semibold text-[color:var(--tenant-accent)]"
          >
            {copy.openOperationsDashboard}
          </Link>
        ) : primaryAction ? (
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
              title={copy.continueTitle}
              description={copy.continueDescription}
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
            <ModuleWorkspaceState tone="error" title={copy.summaryUnavailable} description={error} />
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
            <MetricGrid cards={pulseCards.slice(0, 4)} columns="md:grid-cols-2 xl:grid-cols-4" />
            {localizedFeaturedSection ? (
              <DashboardSection section={localizedFeaturedSection} />
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
