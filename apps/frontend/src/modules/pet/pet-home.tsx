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
import { useAppI18n } from '@/shared/i18n/app-i18n-provider';
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

const localizedEnvironmentLabelMap: Record<string, string> = {
  'tenant workspace': 'Ambiente do cliente',
  'contracted saas workspace': 'Ambiente SaaS contratado'
};

function resolvePetWorkspaceMode(key: VisualProfileKey): PetWorkspaceMode {
  return key === 'pet-grooming' ? 'grooming' : 'clinic';
}

function localizePetEnvironmentLabel(label?: string | null, fallback = 'Ambiente ativo') {
  if (!label) {
    return fallback;
  }

  return localizedEnvironmentLabelMap[label.trim().toLowerCase()] ?? label;
}

function getPetWorkspaceActions(mode: PetWorkspaceMode): ModuleWorkspaceAction[] {
  const grooming = mode === 'grooming';

  return [
    {
      href: '/pet/dashboard',
      eyebrow: 'Visao geral',
      title: 'Ver visao operacional',
      description: grooming
        ? 'Abra o panorama vivo dos servicos antes de seguir para cobranca e insights.'
        : 'Abra o panorama vivo da operacao antes de seguir para cobranca e insights.',
      permission: 'pet.dashboard.read',
      anyEntitlements: petSubmoduleEntitlements,
      restrictionTitle: 'Acesso ao dashboard necessario',
      restrictionDescription: 'Esse pulso do ambiente aparece quando o seu perfil inclui acesso ao dashboard do PetFlow.'
    },
    {
      href: '/pet/clients',
      eyebrow: 'Recepcao',
      title: 'Revisar clientes',
      description: 'Comece a historia do PetFlow com cadastros de clientes e um contexto de contato confiavel.',
      permission: 'pet.client.read',
      anyEntitlements: petSubmoduleEntitlements,
      restrictionTitle: 'Acesso a clientes necessario',
      restrictionDescription: 'A gestao de clientes aparece aqui quando o seu perfil pode ler clientes do PetFlow.'
    },
    {
      href: '/pet/pets',
      eyebrow: grooming ? 'Cuidado' : 'Clinico',
      title: grooming ? 'Revisar pets' : 'Revisar perfis dos pets',
      description: grooming
        ? 'Cadastre cada pet depois do cliente para manter atendimentos e observacoes ligados a pessoa certa.'
        : 'Cadastre cada pet depois do cliente para manter atendimentos e historico de cuidado ligados ao paciente certo.',
      permission: 'pet.profile.read',
      anyEntitlements: petSubmoduleEntitlements,
      restrictionTitle: 'Acesso a perfis de pets necessario',
      restrictionDescription: 'Os perfis dos pets ficam indisponiveis ate o seu perfil poder ler os registros do PetFlow.'
    },
    {
      href: '/pet/appointments',
      eyebrow: grooming ? 'Agenda' : 'Clinico',
      title: 'Agendar atendimentos',
      description: grooming
        ? 'Transforme clientes e pets em servicos agendaveis e uma fila diaria visivel.'
        : 'Transforme clientes e pets em cuidados agendados e uma fila diaria visivel.',
      permission: 'pet.appointment.read',
      anyEntitlements: petOperationalEntitlements,
      restrictionTitle: 'Acesso a atendimentos necessario',
      restrictionDescription: 'O fluxo de atendimentos aparece quando o seu perfil pode ler atendimentos do PetFlow.'
    },
    {
      href: '/pet/plans',
      eyebrow: grooming ? 'Pacotes de sessoes' : 'Planos',
      title: grooming ? 'Gerir pacotes de sessoes' : 'Gerir planos de clientes',
      description: grooming
        ? 'Crie e acompanhe pacotes de sessoes, como "10 banhos e tosas", e ligue-os aos atendimentos do cliente.'
        : 'Acompanhe pacotes de multiplas sessoes ligados aos atendimentos do cliente.',
      permission: 'pet.plan.read',
      anyEntitlements: petOperationalEntitlements,
      restrictionTitle: 'Acesso a planos necessario',
      restrictionDescription: 'Os planos de clientes aparecem aqui quando o seu perfil pode ler planos do PetFlow.'
    },
    {
      href: '/pet/services',
      eyebrow: grooming ? 'Menu de servicos' : 'Comercial',
      title: 'Revisar servicos',
      description: 'Mantenha o menu de servicos pronto antes de abrir a agenda.',
      permission: 'pet.service.read',
      anyEntitlements: petOperationalEntitlements,
      restrictionTitle: 'Acesso a servicos necessario',
      restrictionDescription: 'O catalogo de servicos aparece aqui quando o seu perfil pode ler servicos do PetFlow.'
    },
    {
      href: '/pet/professionals',
      eyebrow: grooming ? 'Operacao' : 'Clinico',
      title: 'Revisar equipe',
      description: grooming
        ? 'Mantenha groomers, atendentes e equipe operacional visiveis no ambiente atual.'
        : 'Mantenha a equipe clinica e operacional visivel no ambiente atual.',
      permission: 'pet.professional.read',
      anyEntitlements: petOperationalEntitlements,
      restrictionTitle: 'Acesso a profissionais necessario',
      restrictionDescription: 'A gestao da equipe fica oculta ate o seu perfil poder ler profissionais do PetFlow.'
    },
    {
      href: '/pet/medical-records',
      eyebrow: grooming ? 'Historico de cuidado' : 'Prontuarios',
      title: 'Abrir prontuarios',
      description: grooming
        ? 'Acesse historico de cuidado, prescricoes, vacinas e contexto longitudinal quando as permissoes clinicas estiverem liberadas.'
        : 'Acesse prontuarios, vacinas, prescricoes e contexto clinico longitudinal.',
      anyOf: petMedicalRoutePermissions,
      anyEntitlements: petClinicalEntitlements,
      restrictionTitle: 'Acesso clinico necessario',
      restrictionDescription: 'Prontuarios, vacinas e prescricoes aparecem aqui quando o seu perfil inclui pelo menos uma permissao clinica de leitura.'
    },
    {
      href: '/pet/products',
      eyebrow: 'Comercial',
      title: 'Revisar produtos',
      description: 'Revise SKUs, precos e itens ligados ao ambiente comercial do PetFlow.',
      permission: 'pet.product.read',
      anyEntitlements: petRetailEntitlements,
      restrictionTitle: 'Acesso a produtos necessario',
      restrictionDescription: 'A gestao de produtos aparece aqui quando o seu perfil pode ler produtos do PetFlow.'
    },
    {
      href: '/pet/inventory',
      eyebrow: 'Estoque',
      title: 'Revisar estoque',
      description: 'Acompanhe movimentacao de estoque e rastreabilidade operacional do ambiente.',
      permission: 'pet.inventory.read',
      anyEntitlements: petRetailEntitlements,
      restrictionTitle: 'Acesso a estoque necessario',
      restrictionDescription: 'O fluxo de estoque aparece quando o seu perfil pode ler estoque do PetFlow.'
    },
    {
      href: '/pet/invoices',
      eyebrow: 'Cobranca',
      title: 'Gerir cobranca',
      description: 'Mostre como o servico concluido vira fatura, recebimento e visibilidade financeira.',
      permission: 'pet.invoice.read',
      anyEntitlements: petRetailEntitlements,
      restrictionTitle: 'Acesso a cobranca necessario',
      restrictionDescription: 'Os sinais de cobranca aparecem aqui quando o seu perfil pode ler faturas do PetFlow.'
    },
    {
      href: '/pet/insights',
      eyebrow: 'Insights do negocio',
      title: 'Ver insights do negocio',
      description: grooming
        ? 'Revise crescimento de clientes, mix de servicos e tendencias dos pets a partir dos dados do negocio.'
        : 'Revise crescimento de clientes, mix de servicos e padroes de atendimento a partir dos dados do negocio.',
      permission: 'pet.dashboard.read',
      anyEntitlements: petSubmoduleEntitlements,
      restrictionTitle: 'Acesso ao dashboard necessario',
      restrictionDescription: 'Os insights do negocio aparecem quando o seu perfil inclui acesso ao dashboard do PetFlow.'
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
      ? 'Use este ambiente do PetFlow para revisar a superficie de servicos e operacao a partir do ambiente principal da plataforma.'
      : 'Use este ambiente do PetFlow para revisar a superficie clinica e operacional a partir do ambiente principal da plataforma.';
  }

  if (hasSystemAdminRole) {
    return `Este ambiente do PetFlow esta limitado a ${scopeName} enquanto um perfil interno de suporte permanece ativo nesta sessao.`;
  }

  return mode === 'grooming'
    ? `Agendamentos de servico, rotinas de cuidado e acompanhamento do cliente seguem limitados a ${scopeName} dentro do ${workspaceLabel.toLowerCase()} atual.`
    : `Operacao clinica, atendimentos e acompanhamento do cliente seguem limitados a ${scopeName} dentro do ${workspaceLabel.toLowerCase()} atual.`;
}

function resolveOverviewValue(value?: number) {
  return value === undefined ? 'Carregando...' : value.toString();
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
      heroEyebrow: 'Ambiente PetFlow Grooming',
      overviewAppointmentsLabel: 'Servicos hoje',
      overviewAppointmentsDescription: 'Servicos agendados para o dia operacional atual.',
      overviewUpcomingLabel: 'Proximos atendimentos',
      overviewUpcomingDescription: 'Servicos de curto prazo ja posicionados na fila do ambiente.',
      attentionLabel: 'Fila de atencao',
      attentionDescription: 'Sinais de estoque e cobranca que ainda pedem acao neste ambiente.',
      contextTitle: 'Resumo do negocio',
      contextDescription: 'Veja a situacao atual da base de clientes, da agenda e da atencao operacional antes de entrar em cada area.',
      snapshotTitle: 'Panorama vivo de servicos',
      snapshotDescription: 'Leia o momento atual da operacao aqui e siga para cobranca e insights.',
      restrictedTitle: 'Resumo de servicos restrito',
      restrictedDescription: 'Este ambiente do PetFlow esta disponivel, mas o panorama de servicos exige `pet.dashboard.read`. Continue pelos fluxos liberados de clientes, agenda e cuidado abaixo.',
      loadingTitle: 'Carregando resumo do PetFlow',
      loadingDescription: 'Coletando a visao mais recente de servicos e operacao para este ambiente.',
      errorGuidanceTitle: 'Siga com o PetFlow',
      errorGuidanceDescription: 'Use os fluxos do PetFlow abaixo enquanto o resumo se recupera.',
      onboardingEyebrow: 'Configuracao PetFlow',
      onboardingTitle: 'Configure o seu ambiente PetFlow',
      onboardingDescription: 'Comece com clientes e pets, depois adicione servicos e equipe, agende atendimentos e acompanhe a cobranca.',
      emptyActivityTitle: 'Ainda nao ha atividade recente de servicos',
      emptyActivityDescription: 'Os registros do PetFlow ja existem, mas ainda nao ha um bloco compacto de atividade para mostrar aqui.',
      emptyGuidanceTitle: 'Continue com o PetFlow',
      emptyGuidanceDescription: 'Use os fluxos abaixo enquanto a atividade cresce dentro do ambiente.',
      emptySummaryTitle: 'Ainda nao ha panorama operacional',
      emptySummaryDescription: 'O PetFlow ainda nao devolveu um panorama vivo da operacao deste ambiente.',
      moduleSurfaceDescription: 'Agenda, cuidado, comercial e estoque seguem limitados ao contrato ativo do ambiente.'
    };
  }

  return {
    heroEyebrow: 'Ambiente PetFlow',
    overviewAppointmentsLabel: 'Atendimentos hoje',
    overviewAppointmentsDescription: 'Atendimentos previstos para o dia operacional atual.',
    overviewUpcomingLabel: 'Proximas agendas',
    overviewUpcomingDescription: 'Atendimentos de curto prazo ja posicionados na operacao do negocio pet.',
    attentionLabel: 'Fila de atencao',
    attentionDescription: 'Sinais comerciais e de estoque que ainda pedem acao neste ambiente.',
    contextTitle: 'Resumo do negocio',
    contextDescription: 'Veja a situacao atual da base de clientes, da agenda e da atencao operacional antes de entrar em cada area.',
    snapshotTitle: 'Operacao ao vivo',
    snapshotDescription: 'Leia o momento atual da operacao aqui e siga para cobranca e insights.',
    restrictedTitle: 'Resumo operacional restrito',
    restrictedDescription: 'Este ambiente do PetFlow esta disponivel, mas o panorama operacional exige `pet.dashboard.read`. Continue pelos fluxos liberados de clientes, atendimentos e cuidado abaixo.',
    loadingTitle: 'Carregando resumo do PetFlow',
    loadingDescription: 'Coletando a visao mais recente da operacao e da frente comercial deste ambiente pet.',
    errorGuidanceTitle: 'Siga com o PetFlow',
    errorGuidanceDescription: 'Use os fluxos do PetFlow abaixo enquanto o resumo se recupera.',
    onboardingEyebrow: 'Configuracao PetFlow',
    onboardingTitle: 'Configure o seu ambiente PetFlow',
    onboardingDescription: 'Comece com clientes e pets, depois adicione servicos e equipe, agende atendimentos e acompanhe a cobranca.',
    emptyActivityTitle: 'Ainda nao ha atividade operacional recente',
    emptyActivityDescription: 'Os registros do PetFlow ja existem, mas ainda nao ha um bloco compacto de atividade ao vivo para mostrar aqui.',
    emptyGuidanceTitle: 'Continue com o PetFlow',
    emptyGuidanceDescription: 'Use os fluxos abaixo enquanto a atividade cresce dentro do ambiente.',
    emptySummaryTitle: 'Ainda nao ha panorama operacional',
    emptySummaryDescription: 'O PetFlow ainda nao devolveu um panorama vivo da operacao deste ambiente.',
    moduleSurfaceDescription: 'Servicos, produtos, cuidado e cobranca seguem limitados ao contrato ativo do ambiente.'
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

function resolvePetPrimaryAction(actions: ModuleWorkspaceAction[], summary: PetDashboardSummary | null, firstUse: boolean, mode: PetWorkspaceMode) {
  const fallbackAction = resolveFallbackPetAction(actions);

  if (!fallbackAction) {
    return null;
  }

  if (firstUse) {
    return {
      title: 'Comece por clientes',
      description: mode === 'grooming'
        ? 'Cadastre o primeiro cliente e depois adicione um pet para iniciar o setup do PetFlow.'
        : 'Cadastre o primeiro cliente e depois adicione um pet para iniciar o setup do PetFlow.',
      href: resolvePetActionHref(actions, '/pet/clients', fallbackAction.href)
    } satisfies PetPrimaryAction;
  }

  if ((summary?.appointmentsToday ?? 0) > 0) {
    return {
      title: mode === 'grooming' ? 'Revisar os servicos de hoje' : 'Revisar os atendimentos de hoje',
      description: `${summary?.appointmentsToday ?? 0} item(ns) ja estao agendados para o dia operacional atual.`,
      href: resolvePetActionHref(actions, '/pet/appointments', fallbackAction.href)
    } satisfies PetPrimaryAction;
  }

  if ((summary?.pendingInvoices ?? 0) > 0) {
    return {
      title: 'Revisar cobrancas pendentes',
      description: `${summary?.pendingInvoices ?? 0} fatura(s) ainda pedem acompanhamento de cobranca no PetFlow.`,
      href: resolvePetActionHref(actions, '/pet/invoices', fallbackAction.href)
    } satisfies PetPrimaryAction;
  }

  if ((summary?.lowStockProducts ?? 0) > 0) {
    return {
      title: 'Checar itens com estoque baixo',
      description: `${summary?.lowStockProducts ?? 0} SKU(s) de produto estao se aproximando da pressao de estoque.`,
      href: resolvePetActionHref(actions, '/pet/products', fallbackAction.href)
    } satisfies PetPrimaryAction;
  }

  return {
    title: 'Ver visao operacional',
    description: mode === 'grooming'
      ? 'Revise o ritmo vivo da operacao, a fila de atencao e a proxima historia para mostrar nos insights.'
      : 'Revise o ritmo vivo da operacao, a fila de atencao e a proxima historia para mostrar nos insights.',
    href: resolvePetActionHref(actions, '/pet/dashboard', fallbackAction.href)
  } satisfies PetPrimaryAction;
}

const petSummaryLabelMap: Record<string, string> = {
  clients: 'Clientes',
  pets: 'Pets',
  appointments: 'Atendimentos',
  'appointments-today': 'Atendimentos hoje',
  invoices: 'Faturas',
  'pending-invoices': 'Faturas pendentes',
  'low-stock-products': 'Estoque baixo'
};

const petSectionTitleMap: Record<string, string> = {
  'clinical-feed': 'Fluxo clinico',
  'service-feed': 'Fluxo de servicos'
};

const petSectionDescriptionMap: Record<string, string> = {
  'clinical-feed': 'Movimentacao recente de pacientes',
  'service-feed': 'Movimentacao recente de servicos'
};

const petStatusMap: Record<string, string> = {
  active: 'ativo',
  pending: 'pendente',
  scheduled: 'agendada',
  'no permission': 'sem permissao',
  'setup required': 'configuracao necessaria',
  'no data': 'sem dados'
};

function localizePetStatus(status?: string | null) {
  if (!status) {
    return status;
  }

  return petStatusMap[status.toLowerCase()] ?? status;
}

function localizePetSummaryCard<T extends { key: string; label: string; status?: string | null }>(card: T): T {
  return {
    ...card,
    label: petSummaryLabelMap[card.key] ?? card.label,
    status: localizePetStatus(card.status)
  };
}

export function PetHome() {
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
  const petCopy = useMemo(() => getPetWorkspaceCopy(petMode), [petMode]);
  const localizedWorkspaceLabel = useMemo(
    () => localizePetEnvironmentLabel(platform.workspace.workspaceLabel),
    [platform.workspace.workspaceLabel]
  );
  const localizedAccessLabel = useMemo(
    () => localizePetEnvironmentLabel(platform.workspace.accessLabel),
    [platform.workspace.accessLabel]
  );
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
        ? readyCapability(action.status, locale)
        : permissionCapability({
            title: action.restrictionTitle ?? 'Permissao necessaria',
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
          title: 'O fluxo de atendimentos precisa de um pouco de setup primeiro',
          description: 'Crie clientes e perfis de pets, depois confirme servicos e profissionais antes de agendar a primeira visita.'
        }, locale);

        return { ...action, capability, status: capability.status };
      }

      if (firstUse && action.href === '/pet/invoices') {
        const capability = notConfiguredCapability({
          title: 'A cobranca comeca depois da primeira visita agendada',
          description: 'Emita a primeira fatura depois que um atendimento ou servico estiver pronto para que o recebimento pareca real na demo.'
        }, locale);

        return { ...action, capability, status: capability.status };
      }

      if (firstUse && action.href === '/pet/insights') {
        const capability = notConfiguredCapability({
          title: 'Os insights ganham forca depois do primeiro ciclo operacional',
          description: 'Clientes, pets, atendimentos e dados de cobranca transformam esta pagina em um momento mais forte de fechamento.'
        }, locale);

        return { ...action, capability, status: capability.status };
      }

      if (firstUse && action.href === '/pet/medical-records') {
        const capability = notConfiguredCapability({
          title: 'Os prontuarios ainda nao foram configurados',
          description: 'Os registros clinicos comecam quando os primeiros pacientes e atendimentos passam a existir neste ambiente do PetFlow.'
        }, locale);

        return { ...action, capability, status: capability.status };
      }

      if (firstUse && action.href === '/pet/plans') {
        const capability = notConfiguredCapability({
          title: 'Os planos de clientes comecam depois do primeiro cadastro',
          description: 'Adicione um cliente, registre o pet e agende o primeiro atendimento; depois crie um pacote de sessoes para acompanhar o retorno.'
        }, locale);

        return { ...action, capability, status: capability.status };
      }

      if (!firstUse && !featuredSection && action.href === '/pet/appointments') {
        const capability = noDataCapability({
          title: 'Ainda nao ha atividade recente de atendimentos',
          description: petMode === 'grooming'
            ? 'O ambiente ja tem registros do PetFlow, mas ainda nao existe um bloco compacto de atividade recente de servicos.'
            : 'O ambiente ja tem registros do PetFlow, mas ainda nao existe um bloco compacto de atividade recente de atendimentos.'
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
    () => resolvePetPrimaryAction(actionStates, summary, firstUse, petMode),
    [actionStates, firstUse, petMode, summary]
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
      .map((card) => localizePetSummaryCard(card));
  }, [summary]);

  const localizedFeaturedSection = useMemo(() => {
    if (!featuredSection) {
      return null;
    }

    return {
      ...featuredSection,
      title: petSectionTitleMap[featuredSection.key] ?? featuredSection.title,
      description: petSectionDescriptionMap[featuredSection.key] ?? featuredSection.description,
      cards: featuredSection.cards.map((card) => localizePetSummaryCard(card)),
      items: featuredSection.items.map((item) => ({
        ...item,
        sublabel: item.sublabel?.replace(/^Scheduled with /, 'Agendado com '),
        status: localizePetStatus(item.status)
      }))
    };
  }, [featuredSection]);

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
        setError(err instanceof ApiClientError ? err.message : 'Nao foi possivel carregar o resumo do ambiente PetFlow.');
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
      <PetModuleSubnav />

      <ModuleWorkspaceHero
        eyebrow={petCopy.heroEyebrow}
        title={`${platform.branding.scopeName} · PetFlow`}
        description={resolvePetWorkspaceDescription(
          platform.branding.scopeName,
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
          { label: 'Ambiente', value: localizedWorkspaceLabel },
          { label: 'Acesso', value: localizedAccessLabel, tone: 'neutral' }
        ]}
        aside={(
          <ModuleWorkspaceFactList
            facts={[
              {
                label: 'Codigo do ambiente',
                value: platform.branding.tenantCode ?? 'Nao informado',
                description: 'Identificador estavel do ambiente PetFlow.'
              },
              {
                label: 'Proxima acao',
                value: primaryAction?.title ?? 'Abrir ambiente PetFlow',
                description: primaryAction?.description ?? 'Use os fluxos do ambiente abaixo para continuar.',
                status: firstUse ? 'configuracao necessaria' : summary && (summary.pendingInvoices > 0 || summary.lowStockProducts > 0) ? 'pendente' : 'ativo'
              }
            ]}
          />
        )}
      />

      <ModuleWorkspaceOverviewGrid
        cards={[
          {
            label: 'Escopo do ambiente',
            value: platform.branding.scopeName,
            description: 'A operacao do PetFlow permanece ancorada no ambiente ativo.'
          },
          {
            label: petCopy.overviewAppointmentsLabel,
            value: canReadDashboard ? resolveOverviewValue(summary?.appointmentsToday) : '--',
            description: petCopy.overviewAppointmentsDescription,
            status: !canReadDashboard ? 'sem permissao' : summary && firstUse ? 'configuracao necessaria' : null,
            capability: !canReadDashboard
              ? permissionCapability({
                  title: 'Visibilidade do dashboard necessaria',
                  description: 'Conceda `pet.dashboard.read` para mostrar a contagem de atendimentos nesta abertura de ambiente.'
                }, locale)
              : summary && firstUse
                ? notConfiguredCapability({
                    title: 'Os atendimentos ainda nao foram configurados',
                    description: petMode === 'grooming'
                      ? 'Crie os primeiros clientes e perfis de pets antes que este ambiente consiga agendar e mostrar o ritmo dos servicos.'
                      : 'Crie os primeiros clientes e perfis de pets antes que este ambiente consiga agendar e mostrar o ritmo clinico.'
                  }, locale)
                : undefined
          },
          {
            label: petCopy.overviewUpcomingLabel,
            value: canReadDashboard ? resolveOverviewValue(summary?.upcomingAppointments) : '--',
            description: petCopy.overviewUpcomingDescription,
            status: !canReadDashboard ? 'sem permissao' : summary && firstUse ? 'configuracao necessaria' : null,
            capability: !canReadDashboard
              ? permissionCapability({
                  title: 'A previsao depende do acesso ao dashboard',
                  description: 'Conceda `pet.dashboard.read` para mostrar a carga dos proximos atendimentos a partir da visao geral do ambiente.'
                }, locale)
              : summary && firstUse
                ? notConfiguredCapability({
                    title: petMode === 'grooming' ? 'Os proximos servicos ainda nao foram configurados' : 'Os proximos cuidados ainda nao foram configurados',
                    description: petMode === 'grooming'
                      ? 'Os servicos de curto prazo aparecem depois que os primeiros agendamentos sao criados dentro deste ambiente.'
                      : 'Os cuidados de curto prazo aparecem depois que os primeiros atendimentos sao agendados dentro deste ambiente.'
                  }, locale)
                : undefined
          },
          {
            label: petCopy.attentionLabel,
            value: canReadDashboard
              ? summary
                ? `${summary.lowStockProducts} em baixa / ${summary.pendingInvoices} faturas`
                : 'Carregando...'
              : '--',
            description: petCopy.attentionDescription,
            status: !canReadDashboard
              ? 'sem permissao'
              : summary && firstUse
                ? 'configuracao necessaria'
                : summary && (summary.lowStockProducts > 0 || summary.pendingInvoices > 0)
                  ? 'pendente'
                  : summary
                    ? 'ativo'
                    : null,
            capability: !canReadDashboard
              ? permissionCapability({
                  title: 'A fila operacional depende do acesso ao dashboard',
                  description: 'Conceda `pet.dashboard.read` para mostrar sinais de estoque baixo e cobranca a partir desta tela inicial.'
                }, locale)
              : summary && firstUse
                ? notConfiguredCapability({
                    title: 'A fila operacional ainda nao foi configurada',
                    description: 'Os sinais de estoque e cobranca aparecem depois que servicos, produtos e faturas comecam a circular no ambiente.'
                  }, locale)
                : undefined
          }
        ]}
      />

      <ModuleWorkspaceQuickActionGrid
        title="Fluxos centrais da demo PetFlow"
        description="Mantenha a historia curta para a demo: recepcao, servicos, planos recorrentes, equipe, estoque e cobranca."
        actions={landingActions}
        emptyTitle="Nenhum fluxo do PetFlow disponivel"
        emptyDescription="Este ambiente tem o modulo PetFlow ativo, mas o usuario atual ainda nao possui permissoes de leitura."
      />

      <ModuleWorkspaceSection
        title={petCopy.snapshotTitle}
        description={petCopy.snapshotDescription}
        action={canReadDashboard ? (
          <Link
            href={dashboardHref}
            className="inline-flex text-sm font-semibold text-[color:var(--tenant-accent)]"
          >
            Abrir dashboard do PetFlow
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
              title="Continue com o ambiente PetFlow"
              description="Estes proximos passos seguem disponiveis mesmo com a visibilidade do dashboard restrita."
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
            <ModuleWorkspaceState tone="error" title="Resumo do PetFlow indisponivel" description={error} />
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
