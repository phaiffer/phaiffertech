import {
  getAccessibleWorkspaceModules,
  resolveDashboardWorkspaceVariant,
  resolveModuleWorkspaceHref,
  type DashboardContextCard,
  type DashboardQuickAction
} from '@/shared/dashboard/contextual-dashboard';
import type { GettingStartedStep } from '@/shared/onboarding/getting-started';
import { hasPermission } from '@/shared/permissions/has-permission';
import type { FrontendPlatformState } from '@/shared/platform/frontend-platform.types';
import type { DashboardListItem, DashboardModuleSummary, DashboardSummaryCard } from '@/shared/types/dashboard';

export type ExecutiveModuleSnapshot = {
  moduleCode: string;
  title: string;
  description: string;
  status: string;
  summaryCards: DashboardSummaryCard[];
  featuredItems: DashboardListItem[];
  featuredTitle: string;
  featuredDescription: string;
  emptyTitle: string;
  emptyDescription: string;
  nextAction: DashboardQuickAction;
};

type RankedQuickAction = DashboardQuickAction & {
  priority: number;
};

const demoTenantCodes = new Set(['phaiffertech-demo', 'demo-clinic']);
const executiveModuleOrder = ['PET', 'CRM'];

function findSummaryCard(summary: DashboardModuleSummary, key: string) {
  return summary.summaryCards.find((card) => card.key === key);
}

function readCardValue(summary: DashboardModuleSummary, key: string) {
  return findSummaryCard(summary, key)?.value ?? 0;
}

function selectSummaryCards(summary: DashboardModuleSummary, keys: string[]) {
  const cards = keys
    .map((key) => findSummaryCard(summary, key))
    .filter((card): card is DashboardSummaryCard => Boolean(card));

  return cards.length > 0 ? cards : summary.summaryCards.slice(0, 3);
}

function selectFeaturedItems(summary: DashboardModuleSummary) {
  const featuredSection = summary.sections.find((section) => section.items.length > 0);

  return {
    title: featuredSection?.title ?? 'Recent Movement',
    description: featuredSection?.description ?? `Latest activity returned for ${summary.title}.`,
    items: featuredSection?.items.slice(0, 3) ?? []
  };
}

function isEmptySummary(summary: DashboardModuleSummary) {
  return summary.summaryCards.length === 0 || summary.summaryCards.every((card) => card.value === 0);
}

function moduleOrderIndex(moduleCode: string) {
  const index = executiveModuleOrder.indexOf(moduleCode);
  return index === -1 ? executiveModuleOrder.length : index;
}

function sortActions(left: RankedQuickAction, right: RankedQuickAction) {
  if (left.priority !== right.priority) {
    return right.priority - left.priority;
  }

  return moduleOrderIndex(left.eyebrow) - moduleOrderIndex(right.eyebrow);
}

function resolveTargetHref(
  platform: FrontendPlatformState,
  permission: string | null,
  preferredHref: string,
  fallbackHref: string
) {
  if (!permission || hasPermission(platform.user, permission)) {
    return preferredHref;
  }

  return fallbackHref;
}

function resolveCrmNextAction(platform: FrontendPlatformState, summary: DashboardModuleSummary | null): RankedQuickAction {
  const fallbackHref = resolveModuleWorkspaceHref('CRM') ?? '/crm';

  if (!summary || isEmptySummary(summary)) {
    return {
      key: 'crm-first-company',
      eyebrow: 'CRM',
      title: 'Create first company',
      description: 'Start the commercial workspace by registering the first account and unlocking the rest of the CRM flow.',
      href: resolveTargetHref(platform, 'crm.company.read', '/crm/companies', fallbackHref),
      priority: 90
    };
  }

  const overdueTasks = readCardValue(summary, 'overdue-tasks');
  if (overdueTasks > 0) {
    return {
      key: 'crm-overdue-tasks',
      eyebrow: 'CRM',
      title: 'Review overdue tasks',
      description: `${overdueTasks} overdue follow-up item(s) are holding back the current commercial flow.`,
      href: resolveTargetHref(platform, 'crm.task.read', '/crm/tasks', fallbackHref),
      priority: 100
    };
  }

  const activeDeals = readCardValue(summary, 'active-deals');
  if (activeDeals > 0) {
    return {
      key: 'crm-open-deals',
      eyebrow: 'CRM',
      title: 'Open deals pipeline',
      description: `${activeDeals} active deal(s) are moving through the current tenant pipeline.`,
      href: resolveTargetHref(platform, 'crm.deal.read', '/crm/deals', fallbackHref),
      priority: 80
    };
  }

  const leads = readCardValue(summary, 'leads');
  if (leads > 0) {
    return {
      key: 'crm-qualify-leads',
      eyebrow: 'CRM',
      title: 'Qualify recent leads',
      description: `${leads} lead(s) are ready for qualification before they stall in the funnel.`,
      href: resolveTargetHref(platform, 'crm.lead.read', '/crm/leads', fallbackHref),
      priority: 70
    };
  }

  return {
    key: 'crm-open-workspace',
    eyebrow: 'CRM',
    title: 'Open CRM workspace',
    description: 'Review pipeline posture, recent movement, and the next commercial action in one place.',
    href: fallbackHref,
    priority: 60
  };
}

function resolvePetNextAction(platform: FrontendPlatformState, summary: DashboardModuleSummary | null): RankedQuickAction {
  const fallbackHref = resolveModuleWorkspaceHref('PET') ?? '/pet';

  if (!summary || isEmptySummary(summary)) {
    return {
      key: 'pet-first-client',
      eyebrow: 'PET',
      title: 'Register first client',
      description: 'Start the PetFlow workspace by creating the first client and pet profile.',
      href: resolveTargetHref(platform, 'pet.client.read', '/pet/clients', fallbackHref),
      priority: 85
    };
  }

  const appointmentsToday = readCardValue(summary, 'appointments-today');
  if (appointmentsToday > 0) {
    return {
      key: 'pet-review-appointments',
      eyebrow: 'PET',
      title: 'Review today\'s appointments',
      description: `${appointmentsToday} appointment(s) are scheduled for the current operating day.`,
      href: resolveTargetHref(platform, 'pet.appointment.read', '/pet/appointments', fallbackHref),
      priority: 88
    };
  }

  const pendingInvoices = readCardValue(summary, 'pending-invoices');
  if (pendingInvoices > 0) {
    return {
      key: 'pet-review-invoices',
      eyebrow: 'PET',
      title: 'Review pending invoices',
      description: `${pendingInvoices} invoice(s) still need follow-through in the workspace backlog.`,
      href: resolveTargetHref(platform, 'pet.invoice.read', '/pet/invoices', fallbackHref),
      priority: 78
    };
  }

  const lowStockProducts = readCardValue(summary, 'low-stock-products');
  if (lowStockProducts > 0) {
    return {
      key: 'pet-review-stock',
      eyebrow: 'PET',
      title: 'Check low stock items',
      description: `${lowStockProducts} product SKU(s) are approaching stock pressure in PetFlow.`,
      href: resolveTargetHref(platform, 'pet.product.read', '/pet/products', fallbackHref),
      priority: 74
    };
  }

  return {
    key: 'pet-open-workspace',
    eyebrow: 'PET',
    title: 'Open PetFlow workspace',
    description: 'Review appointment load, recent clinical work, and the next operational step.',
    href: fallbackHref,
    priority: 58
  };
}

function buildModuleAction(platform: FrontendPlatformState, summary: DashboardModuleSummary | null) {
  switch (summary?.moduleCode ?? '') {
    case 'CRM':
      return resolveCrmNextAction(platform, summary);
    case 'PET':
      return resolvePetNextAction(platform, summary);
    default:
      return null;
  }
}

function buildAccessibleModuleAction(platform: FrontendPlatformState, moduleCode: string) {
  switch (moduleCode) {
    case 'CRM':
      return resolveCrmNextAction(platform, null);
    case 'PET':
      return resolvePetNextAction(platform, null);
    default:
      return null;
  }
}

export function isDemoWorkspace(platform: Pick<FrontendPlatformState, 'branding'>) {
  const tenantCode = platform.branding.tenantCode?.trim().toLowerCase();
  return tenantCode ? demoTenantCodes.has(tenantCode) : false;
}

export function buildExecutiveContextCards(
  platform: FrontendPlatformState,
  moduleSummaries: DashboardModuleSummary[],
  recommendedActions: DashboardQuickAction[],
  attentionSignals: DashboardQuickAction[]
): DashboardContextCard[] {
  const accessibleModules = getAccessibleWorkspaceModules(platform);
  const variant = resolveDashboardWorkspaceVariant(platform);
  const demoWorkspace = isDemoWorkspace(platform);
  const primaryAction = recommendedActions[0];

  return [
    {
      key: 'executive-now',
      label: demoWorkspace ? 'Demo Story' : 'Operational Coverage',
      value: variant === 'platform'
        ? `${moduleSummaries.length} live modules`
        : `${accessibleModules.length} visible module${accessibleModules.length === 1 ? '' : 's'}`,
      description: demoWorkspace
        ? 'The seeded demo workspace is ready to show PetFlow value from the first screen.'
        : 'Start with the modules already returning real signals for the current workspace.',
      tone: 'accent'
    },
    {
      key: 'executive-attention',
      label: 'Needs Attention',
      value: attentionSignals.length > 0 ? `${attentionSignals.length} active signal${attentionSignals.length === 1 ? '' : 's'}` : 'No urgent signal',
      description: attentionSignals.length > 0
        ? 'Follow the attention queue first so pressure does not stay hidden inside module navigation.'
        : 'The current workspace has no urgent signal in the executive queue right now.',
      tone: 'primary'
    },
    {
      key: 'executive-next-action',
      label: 'Act First',
      value: primaryAction?.title ?? 'Open workspace settings',
      description: primaryAction?.description ?? 'Confirm workspace scope, access, and branding before deeper rollout.',
      tone: 'neutral'
    }
  ];
}

export function buildExecutiveRecommendedActions(
  platform: FrontendPlatformState,
  moduleSummaries: DashboardModuleSummary[]
): DashboardQuickAction[] {
  const summaryByCode = new Map(moduleSummaries.map((summary) => [summary.moduleCode, summary]));
  const actions = getAccessibleWorkspaceModules(platform)
    .map((moduleItem) => (
      buildModuleAction(platform, summaryByCode.get(moduleItem.code) ?? null)
      ?? buildAccessibleModuleAction(platform, moduleItem.code)
    ))
    .filter((action): action is RankedQuickAction => Boolean(action))
    .sort(sortActions);

  if (resolveDashboardWorkspaceVariant(platform) === 'platform') {
    if (platform.workspace.canManagePlatformAdministration && hasPermission(platform.user, 'TENANT_READ')) {
      actions.push({
        key: 'manage-tenants',
        eyebrow: 'Platform',
        title: 'Review tenants',
        description: 'Check tenant scope, contracted products, and workspace health from the control plane.',
        href: '/tenants',
        priority: 40
      });
    }

    if (hasPermission(platform.user, 'USER_READ')) {
      actions.push({
        key: 'review-users',
        eyebrow: 'Access',
        title: 'Review workspace users',
        description: 'Inspect who can act on the current dashboards and module workspaces.',
        href: '/users',
        priority: 30
      });
    }
  }

  if (actions.length === 0) {
    actions.push({
      key: 'open-settings',
      eyebrow: 'Workspace',
      title: 'Open settings',
      description: 'Review workspace identity, theme policy, and contracted modules.',
      href: '/settings',
      priority: 20
    });
  }

  return actions.slice(0, 4).map(({ priority, ...action }) => action);
}

export function buildExecutiveAttentionSignals(
  platform: FrontendPlatformState,
  moduleSummaries: DashboardModuleSummary[]
): DashboardQuickAction[] {
  const signals = moduleSummaries.flatMap((summary) => {
    switch (summary.moduleCode) {
      case 'CRM': {
        const overdueTasks = readCardValue(summary, 'overdue-tasks');
        const pendingTasks = readCardValue(summary, 'pending-tasks');

        if (overdueTasks > 0) {
          return [{
            key: 'attention-crm-overdue',
            eyebrow: 'CRM',
            title: 'CRM overdue tasks',
            description: `${overdueTasks} overdue follow-up item(s) need ownership now.`,
            href: resolveTargetHref(platform, 'crm.task.read', '/crm/tasks', resolveModuleWorkspaceHref('CRM') ?? '/crm')
          }];
        }

        if (pendingTasks > 0) {
          return [{
            key: 'attention-crm-pending',
            eyebrow: 'CRM',
            title: 'CRM pending follow-up',
            description: `${pendingTasks} task(s) are still open in the current commercial flow.`,
            href: resolveTargetHref(platform, 'crm.task.read', '/crm/tasks', resolveModuleWorkspaceHref('CRM') ?? '/crm')
          }];
        }

        return [];
      }
      case 'PET': {
        const pendingInvoices = readCardValue(summary, 'pending-invoices');
        const lowStockProducts = readCardValue(summary, 'low-stock-products');

        if (pendingInvoices > 0) {
          return [{
            key: 'attention-pet-invoices',
            eyebrow: 'PET',
            title: 'PetFlow pending invoices',
            description: `${pendingInvoices} invoice(s) still need billing follow-through.`,
            href: resolveTargetHref(platform, 'pet.invoice.read', '/pet/invoices', resolveModuleWorkspaceHref('PET') ?? '/pet')
          }];
        }

        if (lowStockProducts > 0) {
          return [{
            key: 'attention-pet-stock',
            eyebrow: 'PET',
            title: 'PetFlow low stock',
            description: `${lowStockProducts} product SKU(s) need replenishment planning.`,
            href: resolveTargetHref(platform, 'pet.product.read', '/pet/products', resolveModuleWorkspaceHref('PET') ?? '/pet')
          }];
        }

        return [];
      }
      default:
        return [];
    }
  });

  return signals.slice(0, 3);
}

export function buildExecutiveOnboardingSteps(
  platform: FrontendPlatformState,
  moduleSummaries: DashboardModuleSummary[]
): GettingStartedStep[] {
  const summaryByCode = new Map(moduleSummaries.map((summary) => [summary.moduleCode, summary]));
  const emptyModules = getAccessibleWorkspaceModules(platform)
    .filter((moduleItem) => isEmptySummary(summaryByCode.get(moduleItem.code) ?? {
      moduleCode: moduleItem.code,
      title: moduleItem.name,
      description: moduleItem.description,
      href: resolveModuleWorkspaceHref(moduleItem.code) ?? '/dashboard',
      summaryCards: [],
      sections: []
    }))
    .slice(0, 3);

  return emptyModules.map((moduleItem) => {
    switch (moduleItem.code) {
      case 'CRM':
        return {
          key: 'onboarding-crm-company',
          eyebrow: 'CRM',
          title: 'Create first company',
          description: 'Open CRM and register the first account so contacts, leads, and deals can start surfacing.',
          href: resolveTargetHref(platform, 'crm.company.read', '/crm/companies', resolveModuleWorkspaceHref('CRM') ?? '/crm'),
          status: 'setup required',
          actionLabel: 'Start CRM setup'
        };
      case 'PET':
        return {
          key: 'onboarding-pet-client',
          eyebrow: 'PET',
          title: 'Register first client',
          description: 'Open PetFlow and add the first client and pet profile so clinical and schedule context can start building.',
          href: resolveTargetHref(platform, 'pet.client.read', '/pet/clients', resolveModuleWorkspaceHref('PET') ?? '/pet'),
          status: 'setup required',
          actionLabel: 'Start PetFlow setup'
        };
      default:
        return {
          key: `onboarding-${moduleItem.code.toLowerCase()}`,
          eyebrow: moduleItem.code,
          title: `Open ${moduleItem.name}`,
          description: 'Open the module workspace and establish the first records for this tenant.',
          href: resolveModuleWorkspaceHref(moduleItem.code) ?? '/dashboard',
          status: 'setup required',
          actionLabel: 'Open workspace'
        };
    }
  });
}

export function buildExecutiveModuleSnapshots(
  platform: FrontendPlatformState,
  moduleSummaries: DashboardModuleSummary[]
): ExecutiveModuleSnapshot[] {
  const summaryByCode = new Map(moduleSummaries.map((summary) => [summary.moduleCode, summary]));

  return getAccessibleWorkspaceModules(platform)
    .map((moduleItem) => summaryByCode.get(moduleItem.code))
    .filter((summary): summary is DashboardModuleSummary => Boolean(summary))
    .map((summary) => {
      const featured = selectFeaturedItems(summary);
      const nextAction = buildModuleAction(platform, summary) ?? {
        key: `open-${summary.moduleCode.toLowerCase()}-workspace`,
        eyebrow: summary.moduleCode,
        title: `Open ${summary.title}`,
        description: summary.description,
        href: summary.href,
        priority: 40
      };
      const empty = isEmptySummary(summary);

      switch (summary.moduleCode) {
        case 'CRM':
          return {
            moduleCode: summary.moduleCode,
            title: summary.title,
            description: 'Pipeline value, deal movement, and follow-up pressure for the current commercial workspace.',
            status: readCardValue(summary, 'overdue-tasks') > 0 ? 'alert' : empty ? 'setup required' : 'ok',
            summaryCards: selectSummaryCards(summary, ['pipeline-value', 'active-deals', 'overdue-tasks']),
            featuredItems: featured.items,
            featuredTitle: featured.title,
            featuredDescription: featured.description,
            emptyTitle: 'No CRM movement yet',
            emptyDescription: 'Create the first company, contact, and lead to start surfacing commercial momentum.',
            nextAction
          };
        case 'PET':
          return {
            moduleCode: summary.moduleCode,
            title: summary.title,
            description: 'Appointments, patient coverage, and commercial follow-through for the current PetFlow workspace.',
            status: readCardValue(summary, 'pending-invoices') > 0 || readCardValue(summary, 'low-stock-products') > 0
              ? 'pending'
              : empty
                ? 'setup required'
                : 'ok',
            summaryCards: selectSummaryCards(summary, ['appointments-today', 'pets', 'pending-invoices']),
            featuredItems: featured.items,
            featuredTitle: featured.title,
            featuredDescription: featured.description,
            emptyTitle: 'No PetFlow activity yet',
            emptyDescription: 'Register the first client, patient, and appointment to make the clinic pulse useful.',
            nextAction
          };
        default:
          return {
            moduleCode: summary.moduleCode,
            title: summary.title,
            description: summary.description,
            status: empty ? 'setup required' : 'ok',
            summaryCards: summary.summaryCards.slice(0, 3),
            featuredItems: featured.items,
            featuredTitle: featured.title,
            featuredDescription: featured.description,
            emptyTitle: `No ${summary.title} activity yet`,
            emptyDescription: `Open ${summary.title} and establish the first records for this workspace.`,
            nextAction
          };
      }
    });
}

export function buildExecutiveFallbackActions(platform: FrontendPlatformState) {
  return getAccessibleWorkspaceModules(platform)
    .map((moduleItem) => buildAccessibleModuleAction(platform, moduleItem.code))
    .filter((action): action is RankedQuickAction => Boolean(action))
    .sort(sortActions)
    .map(({ priority, ...action }) => action);
}
