'use client';

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CalendarCheck, CarFront, CreditCard, RefreshCcw, type LucideIcon } from 'lucide-react';
import {
  describePetServiceCatalogItem,
  formatPetServiceCategory
} from '@/modules/pet/pet-service-catalog-policy';
import {
  PetAppointmentForm,
  PetAppointmentsFilters,
  type PetAppointmentSelectedService,
  type PetAppointmentServiceSummary,
  createPetAppointmentColumns
} from '@/modules/pet/pet-appointments-sections';
import { PetAppointmentsCalendar } from '@/modules/pet/pet-appointments-calendar';
import { toDateTimeLocal, toIsoDate } from '@/modules/pet/pet-date-time';
import {
  PetLookupFeedback,
  PetLookupIssue,
  resolvePetLookupIssue
} from '@/modules/pet/pet-lookup-feedback';
import { PetModuleSubnav } from '@/modules/pet/pet-module-subnav';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { usePermissions } from '@/shared/auth/usePermissions';
import { useAppI18n, useAppMessages, type AppLocale } from '@/shared/i18n/app-i18n-provider';
import { formatCurrencyForLocale, formatDateTimeForLocale } from '@/shared/i18n/formatters';
import { ApiClientError } from '@/shared/lib/http';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { petService } from '@/shared/services/pet-service';
import { PageResponse } from '@/shared/types/common';
import {
  ClientPlan,
  PetAppointment,
  PetAppointmentInventoryConsumptionStatus,
  PetAppointmentInventoryVarianceStatus,
  PetAppointmentServiceLine,
  PetAppointmentServiceLineInventoryConsumption,
  PetClient,
  PetProfessional,
  PetProfile,
  PetServiceCatalog
} from '@/shared/types/pet';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { DataTable } from '@/shared/ui/data-table';
import { FormInput } from '@/shared/ui/form-input';
import { FormSelect } from '@/shared/ui/form-select';
import { FormTextarea } from '@/shared/ui/form-textarea';
import { PageSection } from '@/shared/ui/page-section';
import { PageTitle } from '@/shared/ui/page-title';
import { Pagination } from '@/shared/ui/pagination';
import { sharedPageStackClass } from '@/shared/components/public-visual-system';

const pageSize = 10;

const initialPage: PageResponse<PetAppointment> = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: pageSize
};

type AppointmentFocusCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  tone?: 'default' | 'accent' | 'warning';
};

function AppointmentFocusCard({
  icon: Icon,
  label,
  value,
  detail,
  tone = 'default'
}: AppointmentFocusCardProps) {
  const toneClass = tone === 'accent'
    ? 'border-transparent bg-[linear-gradient(135deg,var(--accent),var(--petflow-teal))] text-white shadow-[0_20px_40px_-28px_rgba(16,185,129,0.5)]'
    : tone === 'warning'
      ? 'border-amber-200/80 bg-[linear-gradient(180deg,rgba(251,191,36,0.12),rgba(255,255,255,0.98))]'
      : 'border-slate-200/90 bg-[linear-gradient(180deg,rgba(16,185,129,0.05),rgba(255,255,255,0.99)_140px)]';

  return (
    <div className={`rounded-2xl border p-5 shadow-[0_16px_34px_-28px_rgba(15,23,42,0.16)] ${toneClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${tone === 'accent' ? 'text-white/72' : 'text-slate-600'}`}>
            {label}
          </p>
          <p className={`mt-3 text-3xl font-bold tracking-[-0.03em] ${tone === 'accent' ? 'text-white' : 'text-slate-900'}`}>
            {value}
          </p>
        </div>
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${
            tone === 'accent'
              ? 'bg-white/12 text-white'
              : tone === 'warning'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-[color:var(--accent)]/10 text-[color:var(--accent)]'
          }`}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className={`mt-3 ${tone === 'accent' ? 'text-sm leading-6 text-white/80' : 'text-sm leading-6 text-slate-700'}`}>{detail}</p>
    </div>
  );
}

function hasPetTaxi(appointment: PetAppointment) {
  return /taxi/i.test(appointment.extrasDescription ?? '');
}

function hasPickupMessageCoverage(appointment: PetAppointment, clients: PetClient[]) {
  if (appointment.status.toUpperCase() !== 'COMPLETED') {
    return false;
  }

  const client = clients.find((entry) => entry.id === appointment.clientId);
  return Boolean(client?.email);
}

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function formatCommissionRate(locale: string, rate: number) {
  return new Intl.NumberFormat(locale === 'pt-BR' ? 'pt-BR' : 'en-US', {
    style: 'percent',
    maximumFractionDigits: 2
  }).format(rate);
}

function formatInventoryQuantity(locale: string, quantity: number) {
  return new Intl.NumberFormat(locale === 'pt-BR' ? 'pt-BR' : 'en-US', {
    maximumFractionDigits: 2
  }).format(quantity);
}

function formatInventoryPreview(
  locale: string,
  consumptions: PetAppointmentServiceLineInventoryConsumption[]
) {
  if (consumptions.length === 0) {
    return locale === 'pt-BR'
      ? 'Estoque previsto: nenhum item vinculado.'
      : 'Expected stock: no linked item.';
  }

  const label = consumptions
    .map((consumption) => `${consumption.inventoryItemName} x${formatInventoryQuantity(locale, consumption.expectedQuantity)} ${consumption.unitOfMeasure}`)
    .join(' • ');

  return locale === 'pt-BR'
    ? `Estoque previsto: ${label}`
    : `Expected stock: ${label}`;
}

function formatActualInventoryPreview(
  locale: string,
  consumptions: PetAppointmentServiceLineInventoryConsumption[]
) {
  const actualConsumptions = consumptions.filter((consumption) => consumption.actualQuantity != null);
  if (actualConsumptions.length === 0) {
    return locale === 'pt-BR'
      ? 'Consumo real: ainda nao registrado.'
      : 'Actual usage: not recorded yet.';
  }

  const label = actualConsumptions
    .map((consumption) => `${consumption.inventoryItemName} x${formatInventoryQuantity(locale, consumption.actualQuantity ?? 0)} ${consumption.unitOfMeasure}`)
    .join(' • ');

  return locale === 'pt-BR'
    ? `Consumo real: ${label}`
    : `Actual usage: ${label}`;
}

type ActualConsumptionCopy = {
  title: string;
  description: string;
  save: string;
  saving: string;
  apply: string;
  applying: string;
  planned: string;
  actual: string;
  applied: string;
  notRecorded: string;
  notApplied: string;
  variance: string;
  status: string;
  snapshotOnly: string;
  noInventory: string;
  saveFirst: string;
  bookFirst: string;
  rowUnavailable: string;
  updated: string;
  applySuccess: string;
  stockAppliedBadge: string;
  stockPendingBadge: string;
  stockApplied: string;
  stockAppliedOn: string;
  stockPending: string;
  stockNotReady: string;
  stockNoAction: string;
  wholeQuantityOnly: string;
  varianceLabels: Record<PetAppointmentInventoryVarianceStatus, string>;
};

function resolveActualConsumptionCopy(locale: string): ActualConsumptionCopy {
  if (locale === 'pt-BR') {
    return {
      title: 'Consumo real por linha',
      description: 'Edite o que foi realmente usado sem alterar a receita planejada nem gerar baixa de estoque automaticamente.',
      save: 'Salvar consumo real',
      saving: 'Salvando consumo real...',
      apply: 'Aplicar estoque',
      applying: 'Aplicando estoque...',
      planned: 'Planejado',
      actual: 'Real',
      applied: 'Aplicado',
      notRecorded: 'nao registrado',
      notApplied: 'nao aplicado',
      variance: 'Variancia',
      status: 'Status',
      snapshotOnly: 'Somente leitura. Esta linha usa apenas o preview atual da receita porque o snapshot estruturado nao existe neste historico.',
      noInventory: 'Nenhum item planejado nesta linha.',
      saveFirst: 'Salve a composicao de servicos primeiro para registrar o consumo real com seguranca.',
      bookFirst: 'Agende o atendimento primeiro para registrar consumo real por linha.',
      rowUnavailable: 'Consumo real indisponivel para esta linha historica sem snapshot estruturado.',
      updated: 'Consumo real atualizado.',
      applySuccess: 'Consumo aplicado ao estoque.',
      stockAppliedBadge: 'Estoque aplicado',
      stockPendingBadge: 'Aplicacao pendente',
      stockApplied: 'Consumo ja aplicado ao estoque.',
      stockAppliedOn: 'Aplicado ao estoque em {value}.',
      stockPending: 'Pronto para uma aplicacao explicita de estoque.',
      stockNotReady: 'Registre uma quantidade real positiva e marque como pronto para aplicar antes de baixar estoque.',
      stockNoAction: 'Nenhuma baixa de estoque necessaria para esta linha.',
      wholeQuantityOnly: 'Esta primeira etapa aceita apenas quantidades inteiras de estoque.',
      varianceLabels: {
        PREVIEW_ONLY: 'Somente preview',
        PLANNED_ONLY: 'So planejado',
        ADJUSTED_NOT_APPLIED: 'Real nao aplicado',
        APPLIED_MATCHED: 'Aplicado igual ao planejado',
        APPLIED_DIFFERENT: 'Aplicado diferente do planejado'
      }
    };
  }

  return {
    title: 'Actual usage per line',
    description: 'Edit what was actually used without changing the planned recipe or creating stock deductions automatically.',
    save: 'Save actual usage',
    saving: 'Saving actual usage...',
    apply: 'Apply stock',
    applying: 'Applying stock...',
    planned: 'Planned',
    actual: 'Actual',
    applied: 'Applied',
    notRecorded: 'not recorded',
    notApplied: 'not applied',
    variance: 'Variance',
    status: 'Status',
    snapshotOnly: 'Read-only. This line only has the current recipe preview because the structured snapshot is missing in this historical record.',
    noInventory: 'No planned inventory rows on this line.',
    saveFirst: 'Save the service composition first so actual usage can be recorded safely.',
    bookFirst: 'Book the appointment first to record actual usage per line.',
    rowUnavailable: 'Actual usage is unavailable for this historical line without a structured snapshot.',
    updated: 'Actual usage updated.',
    applySuccess: 'Usage applied to stock.',
    stockAppliedBadge: 'Stock applied',
    stockPendingBadge: 'Pending apply',
    stockApplied: 'Usage already applied to stock.',
    stockAppliedOn: 'Applied to stock on {value}.',
    stockPending: 'Ready for an explicit stock application.',
    stockNotReady: 'Record a positive actual quantity and mark the row ready to apply before updating stock.',
    stockNoAction: 'No stock deduction is needed for this row.',
    wholeQuantityOnly: 'This first step only supports whole stock quantities.',
    varianceLabels: {
      PREVIEW_ONLY: 'Preview only',
      PLANNED_ONLY: 'Planned only',
      ADJUSTED_NOT_APPLIED: 'Actual not applied',
      APPLIED_MATCHED: 'Applied matches plan',
      APPLIED_DIFFERENT: 'Applied differs from plan'
    }
  };
}

function canApplyStockConsumption(row: PetAppointmentServiceLineInventoryConsumption) {
  return row.snapshotBacked
    && Boolean(row.id)
    && !row.stockApplied
    && row.consumptionStatus === 'READY_TO_APPLY'
    && typeof row.actualQuantity === 'number'
    && Number.isFinite(row.actualQuantity)
    && row.actualQuantity > 0
    && Number.isInteger(row.actualQuantity);
}

function resolveStockApplicationDetail(
  locale: AppLocale,
  row: PetAppointmentServiceLineInventoryConsumption,
  copy: ActualConsumptionCopy
) {
  if (!row.snapshotBacked) {
    return copy.snapshotOnly;
  }
  if (row.stockApplied) {
    const appliedAt = row.stockAppliedAt
      ? formatDateTimeForLocale(locale, row.stockAppliedAt, '', {
          dateStyle: 'medium',
          timeStyle: 'short'
        })
      : '';
    return appliedAt ? copy.stockAppliedOn.replace('{value}', appliedAt) : copy.stockApplied;
  }
  if (row.consumptionStatus === 'SKIPPED') {
    return copy.stockNoAction;
  }
  if (row.consumptionStatus === 'READY_TO_APPLY'
      && typeof row.actualQuantity === 'number'
      && Number.isFinite(row.actualQuantity)
      && row.actualQuantity > 0
      && !Number.isInteger(row.actualQuantity)) {
    return copy.wholeQuantityOnly;
  }
  if (canApplyStockConsumption(row)) {
    return copy.stockPending;
  }
  return copy.stockNotReady;
}

function resolveInventoryVarianceStatus(row: PetAppointmentServiceLineInventoryConsumption): PetAppointmentInventoryVarianceStatus {
  if (row.varianceStatus) {
    return row.varianceStatus;
  }
  if (!row.snapshotBacked) {
    return 'PREVIEW_ONLY';
  }
  if (row.stockApplied) {
    const appliedQuantity = row.appliedQuantity ?? row.actualQuantity ?? row.expectedQuantity;
    return appliedQuantity === row.expectedQuantity ? 'APPLIED_MATCHED' : 'APPLIED_DIFFERENT';
  }
  return row.actualQuantity == null && row.consumptionStatus === 'PLANNED' ? 'PLANNED_ONLY' : 'ADJUSTED_NOT_APPLIED';
}

function resolveInventoryVarianceTone(status: PetAppointmentInventoryVarianceStatus) {
  switch (status) {
    case 'PREVIEW_ONLY':
      return 'bg-amber-100 text-amber-800';
    case 'PLANNED_ONLY':
      return 'bg-slate-100 text-slate-700';
    case 'ADJUSTED_NOT_APPLIED':
      return 'bg-sky-100 text-sky-800';
    case 'APPLIED_MATCHED':
      return 'bg-emerald-100 text-emerald-800';
    case 'APPLIED_DIFFERENT':
      return 'bg-violet-100 text-violet-800';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

function resolveActualConsumptionStatusOptions(locale: string) {
  return locale === 'pt-BR'
    ? [
        { value: 'PLANNED', label: 'Planejado' },
        { value: 'ADJUSTED', label: 'Ajustado' },
        { value: 'READY_TO_APPLY', label: 'Pronto para aplicar' },
        { value: 'SKIPPED', label: 'Ignorado' }
      ]
    : [
        { value: 'PLANNED', label: 'Planned' },
        { value: 'ADJUSTED', label: 'Adjusted' },
        { value: 'READY_TO_APPLY', label: 'Ready to apply' },
        { value: 'SKIPPED', label: 'Skipped' }
      ];
}

function aggregateInventoryConsumptions(
  consumptionGroups: PetAppointmentServiceLineInventoryConsumption[][]
) {
  const aggregated = new Map<string, PetAppointmentServiceLineInventoryConsumption>();

  consumptionGroups.forEach((group) => {
    group.forEach((consumption) => {
      const existing = aggregated.get(consumption.inventoryItemId);
      if (existing) {
        existing.expectedQuantity += consumption.expectedQuantity;
        return;
      }

      aggregated.set(consumption.inventoryItemId, { ...consumption });
    });
  });

  return Array.from(aggregated.values());
}

function resolveServiceSummaryCopy(locale: string) {
  if (locale === 'pt-BR') {
    return {
      title: 'Servicos estruturados',
      empty: 'Adicione um ou mais servicos para confirmar composicao, duracao total, preco base e regra de agendamento.',
      description: 'Este atendimento usa definicoes estruturadas do catalogo do tenant, nao nomes soltos.',
      selectedServicesLabel: 'Servicos selecionados',
      emptySelectionLabel: 'Adicione pelo menos um servico estruturado antes de salvar.',
      addServiceLabel: 'Adicionar servico',
      removeServiceLabel: 'Remover',
      category: 'Categoria',
      servicesCount: 'Servicos',
      status: 'Status',
      scheduling: 'Regra de agendamento',
      duration: 'Duracao total',
      basePrice: 'Preco base total',
      commissionLines: 'Linhas com comissao',
      projectedCommission: 'Comissao projetada',
      checkout: 'Checkout previsto',
      inventoryUsage: 'Consumo previsto',
      inventoryNone: 'Sem consumo previsto',
      active: 'Ativo para novos agendamentos',
      inactive: 'Inativo para novos agendamentos',
      flexible: 'Avulso e plano habilitados',
      planOnly: 'Somente por plano',
      standaloneOnly: 'Somente avulso',
      unavailable: 'Indisponivel para novos agendamentos',
      planReady: 'Todos os servicos selecionados podem ser consumidos pelo plano vinculado.',
      planBlocked: 'Algum servico selecionado nao pode ser consumido por plano.',
      standaloneReady: 'Todos os servicos selecionados podem ser agendados como atendimento avulso.',
      standaloneBlocked: 'Algum servico selecionado exige plano vinculado antes do agendamento.',
      inactiveLegacy: 'Servico inativo mantido apenas para preservar a edicao segura de um agendamento historico.',
      missingLegacy: 'A definicao original do servico nao esta mais no catalogo ativo. Mantenha o vinculo apenas para edicao historica segura.',
      commissionReady: 'Comissao pronta',
      commissionExcluded: 'Comissao excluida pela regra do servico',
      commissionPending: 'Servico elegivel, mas o profissional ainda precisa de taxa de comissao.',
      commissionUnavailable: 'Regra de comissao indisponivel para esta linha legada.',
      commissionExcludedNotice: 'Nenhum servico selecionado gera comissao.',
      commissionProjectedNotice: 'A projecao considera apenas as linhas que permitem comissao.',
      commissionPendingNotice: (count: number) => count === 1
        ? '1 linha elegivel ainda precisa de taxa de comissao no profissional.'
        : `${count} linhas elegiveis ainda precisam de taxa de comissao no profissional.`,
      commissionUnavailableNotice: (count: number) => count === 1
        ? '1 linha legada ainda nao possui snapshot estruturado de comissao.'
        : `${count} linhas legadas ainda nao possuem snapshot estruturado de comissao.`,
      professionalPendingNotice: (count: number) => count === 1
        ? '1 linha ainda esta sem profissional responsavel.'
        : `${count} linhas ainda estao sem profissional responsavel.`,
      legacyHeadlineSuffix: 'reserva legada',
      bundleHeadlineSuffix: 'servicos selecionados'
    };
  }

  return {
    title: 'Structured services',
    empty: 'Add one or more services to confirm the bundle, total duration, base price, and booking rule.',
    description: 'This appointment uses tenant-owned structured service definitions instead of loose service labels.',
    selectedServicesLabel: 'Selected services',
    emptySelectionLabel: 'Add at least one structured service before saving.',
    addServiceLabel: 'Add service',
    removeServiceLabel: 'Remove',
    category: 'Category',
    servicesCount: 'Services',
    status: 'Status',
    scheduling: 'Scheduling rule',
    duration: 'Combined duration',
    basePrice: 'Combined base price',
    commissionLines: 'Commission lines',
    projectedCommission: 'Projected commission',
    checkout: 'Projected checkout',
    inventoryUsage: 'Expected stock usage',
    inventoryNone: 'No planned stock usage',
    active: 'Active for new bookings',
    inactive: 'Inactive for new bookings',
    flexible: 'Standalone booking and plan sessions enabled',
    planOnly: 'Plan sessions only',
    standaloneOnly: 'Standalone booking only',
    unavailable: 'Unavailable for new scheduling',
    planReady: 'All selected services can be consumed from the linked plan.',
    planBlocked: 'At least one selected service cannot be consumed from the linked plan.',
    standaloneReady: 'All selected services can be booked as one-time appointments.',
    standaloneBlocked: 'At least one selected service requires a linked plan before booking.',
    inactiveLegacy: 'This inactive service stays visible only to preserve safe editing of a historical appointment.',
    missingLegacy: 'The original service definition is no longer in the active catalog. Keep the link only for safe historical edits.',
    commissionReady: 'Commission ready',
    commissionExcluded: 'Commission excluded by service rule',
    commissionPending: 'Commission eligible, but the professional still needs a commission rate.',
    commissionUnavailable: 'Commission rule unavailable for this legacy line.',
    commissionExcludedNotice: 'None of the selected service lines generates commission.',
    commissionProjectedNotice: 'The projection considers only the service lines that allow commission.',
    commissionPendingNotice: (count: number) => count === 1
      ? '1 eligible service line still needs a professional commission rate.'
      : `${count} eligible service lines still need a professional commission rate.`,
    commissionUnavailableNotice: (count: number) => count === 1
      ? '1 legacy service line does not yet carry a structured commission snapshot.'
      : `${count} legacy service lines do not yet carry a structured commission snapshot.`,
    professionalPendingNotice: (count: number) => count === 1
      ? '1 service line is still missing a responsible professional.'
      : `${count} service lines are still missing a responsible professional.`,
    legacyHeadlineSuffix: 'legacy booking',
    bundleHeadlineSuffix: 'services selected'
  };
}

export function PetAppointmentsPage() {
  const { locale } = useAppI18n();
  const messages = useAppMessages().petAppointments;
  const commonButtons = useAppMessages().common.buttons;
  const { hasPermission } = usePermissions();
  const [pageData, setPageData] = useState<PageResponse<PetAppointment>>(initialPage);
  const [calendarData, setCalendarData] = useState<PetAppointment[]>([]);
  
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [clients, setClients] = useState<PetClient[]>([]);
  const [profiles, setProfiles] = useState<PetProfile[]>([]);
  const [services, setServices] = useState<PetServiceCatalog[]>([]);
  const [professionals, setProfessionals] = useState<PetProfessional[]>([]);
  const [lookupIssues, setLookupIssues] = useState<PetLookupIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [clientFilterId, setClientFilterId] = useState('');
  const [petFilterId, setPetFilterId] = useState('');
  const [serviceFilterId, setServiceFilterId] = useState('');
  const [professionalFilterId, setProfessionalFilterId] = useState('');

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingServiceLines, setEditingServiceLines] = useState<PetAppointmentServiceLine[]>([]);
  const [clientId, setClientId] = useState('');
  const [petId, setPetId] = useState('');
  const [servicePickerId, setServicePickerId] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [professionalId, setProfessionalId] = useState('');
  const [serviceLineProfessionalIds, setServiceLineProfessionalIds] = useState<Record<string, string>>({});
  const [scheduledAt, setScheduledAt] = useState('');
  const [status, setStatus] = useState('SCHEDULED');
  const [notes, setNotes] = useState('');
  const [extrasAmount, setExtrasAmount] = useState('');
  const [extrasDescription, setExtrasDescription] = useState('');
  const [clientPlanId, setClientPlanId] = useState('');
  const [clientPlans, setClientPlans] = useState<ClientPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const lastPlanClientIdRef = useRef<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [savingActualServiceLineId, setSavingActualServiceLineId] = useState<string | null>(null);
  const [applyingInventoryRowId, setApplyingInventoryRowId] = useState<string | null>(null);
  const [preparedPickupMessage, setPreparedPickupMessage] = useState('');
  const [preparingPickupAppointmentId, setPreparingPickupAppointmentId] = useState<string | null>(null);
  const [preparedPickupAppointmentId, setPreparedPickupAppointmentId] = useState<string | null>(null);

  const [deleteCandidate, setDeleteCandidate] = useState<PetAppointment | null>(null);

  const canReadClients = hasPermission('pet.client.read');
  const canReadProfiles = hasPermission('pet.profile.read');
  const canReadServices = hasPermission('pet.service.read');
  const canReadProfessionals = hasPermission('pet.professional.read');
  const canCreateAppointments = hasPermission('pet.appointment.create');

  const clientOptions = useMemo(() => {
    return [
      { value: '', label: messages.formOptions.all },
      ...clients.map((client) => ({
        value: client.id,
        label: client.name ?? client.fullName ?? client.id
      }))
    ];
  }, [clients, messages.formOptions.all]);

  const formClientOptions = useMemo(() => {
    return [
      { value: '', label: messages.formOptions.selectClient },
      ...clients.map((client) => ({
        value: client.id,
        label: client.name ?? client.fullName ?? client.id
      }))
    ];
  }, [clients, messages.formOptions.selectClient]);

  const filteredProfiles = useMemo(() => {
    if (!clientId) return profiles;
    return profiles.filter((profile) => profile.clientId === clientId);
  }, [clientId, profiles]);

  const petOptions = useMemo(() => {
    return [
      { value: '', label: messages.formOptions.all },
      ...profiles.map((profile) => ({ value: profile.id, label: profile.name }))
    ];
  }, [messages.formOptions.all, profiles]);

  const bookableServices = useMemo(
    () => services.filter((service) => service.active),
    [services]
  );
  const serviceSummaryCopy = useMemo(
    () => resolveServiceSummaryCopy(locale),
    [locale]
  );
  const actualConsumptionCopy = useMemo(
    () => resolveActualConsumptionCopy(locale),
    [locale]
  );
  const actualConsumptionStatusOptions = useMemo(
    () => resolveActualConsumptionStatusOptions(locale),
    [locale]
  );
  const servicesById = useMemo(
    () => new Map(services.map((service) => [service.id, service])),
    [services]
  );
  const editingServiceLinesById = useMemo(
    () => new Map(editingServiceLines.map((line) => [line.serviceId, line])),
    [editingServiceLines]
  );
  const serviceOptions = useMemo(() => {
    return [
      { value: '', label: messages.formOptions.all },
      ...services.map((service) => ({
        value: service.id,
        label: describePetServiceCatalogItem(service, locale)
      }))
    ];
  }, [locale, messages.formOptions.all, services]);

  const professionalOptions = useMemo(() => {
    return [
      { value: '', label: messages.formOptions.all },
      ...professionals.map((professional) => ({ value: professional.id, label: professional.name }))
    ];
  }, [messages.formOptions.all, professionals]);

  const formPetOptions = useMemo(() => {
    return [
      { value: '', label: messages.formOptions.selectPet },
      ...filteredProfiles.map((profile) => ({ value: profile.id, label: profile.name }))
    ];
  }, [filteredProfiles, messages.formOptions.selectPet]);

  const formServiceOptions = useMemo(() => {
    return [
      { value: '', label: messages.formOptions.selectService },
      ...bookableServices
        .filter((service) => !selectedServiceIds.includes(service.id))
        .map((service) => ({
          value: service.id,
          label: describePetServiceCatalogItem(service, locale)
        }))
    ];
  }, [bookableServices, locale, messages.formOptions.selectService, selectedServiceIds]);

  const formProfessionalOptions = useMemo(() => {
    return [
      { value: '', label: messages.formOptions.selectProfessional },
      ...professionals.map((professional) => ({ value: professional.id, label: professional.name }))
    ];
  }, [messages.formOptions.selectProfessional, professionals]);

  const serviceLineProfessionalOptions = useMemo(() => {
    return [
      { value: '', label: messages.formOptions.unassignedProfessional },
      ...professionals.map((professional) => ({ value: professional.id, label: professional.name }))
    ];
  }, [messages.formOptions.unassignedProfessional, professionals]);

  // Plan options loaded server-side by clientId when the form is open
  const planOptions = useMemo(() => {
    if (!clientId) {
      return [{ value: '', label: messages.formOptions.selectClientFirst }];
    }
    if (plansLoading) {
      return [{ value: '', label: messages.formOptions.loadingPlans }];
    }
    const active = clientPlans.filter((plan) => plan.remainingSessions > 0);
    return [
      { value: '', label: active.length > 0 ? messages.formOptions.oneTime : messages.formOptions.noActivePlan },
      ...active.map((plan) => ({
        value: plan.id,
        label: `${plan.planName} (${plan.remainingSessions} ${messages.formOptions.sessionsLeftSuffix})`
      }))
    ];
  }, [clientPlans, clientId, messages.formOptions, plansLoading]);
  const selectedClientPlan = useMemo(
    () => clientPlans.find((plan) => plan.id === clientPlanId) ?? null,
    [clientPlanId, clientPlans]
  );

  const selectedServiceEntries = useMemo(() => {
    return selectedServiceIds
      .map((selectedId) => {
        const catalogService = servicesById.get(selectedId);
        const existingServiceLine = editingServiceLinesById.get(selectedId);
        const hasExplicitLineProfessional = Object.prototype.hasOwnProperty.call(serviceLineProfessionalIds, selectedId);
        const assignedProfessionalId = hasExplicitLineProfessional
          ? serviceLineProfessionalIds[selectedId]
          : professionalId;
        const assignedProfessional = professionals.find((professional) => professional.id === assignedProfessionalId);

        if (!catalogService && !existingServiceLine) {
          return null;
        }

        const assignedProfessionalName = assignedProfessionalId
          ? assignedProfessional?.name
            ?? (existingServiceLine?.professionalId === assignedProfessionalId ? existingServiceLine.professionalName ?? null : null)
          : null;

        const expectedInventoryConsumptions = existingServiceLine?.expectedInventoryConsumptions
          ? existingServiceLine.expectedInventoryConsumptions
          : catalogService
            ? (catalogService.inventoryLinks ?? [])
              .filter((link) => link.active)
              .map((link) => ({
                id: null,
                inventoryItemId: link.inventoryItemId,
                inventoryItemName: link.inventoryItemName,
                inventoryItemSku: link.inventoryItemSku ?? null,
                inventoryCategory: link.inventoryCategory ?? null,
                unitOfMeasure: link.unitOfMeasure,
                expectedQuantity: link.expectedQuantity,
                actualQuantity: null,
                consumptionStatus: 'PLANNED',
                consumptionRule: link.consumptionRule,
                snapshotBacked: false,
                stockApplied: false,
                appliedInventoryMovementId: null,
                stockAppliedAt: null
              }))
            : [];

        return {
          serviceId: selectedId,
          catalogService,
          existingServiceLine,
          assignedProfessionalId,
          assignedProfessionalName,
          expectedInventoryConsumptions,
          commissionEligible: existingServiceLine?.commissionEligible ?? catalogService?.commissionEligible ?? null,
          lineBasePrice: existingServiceLine?.basePrice ?? catalogService?.basePrice ?? null,
          commissionRate: assignedProfessional?.commissionRate
            ?? (existingServiceLine?.professionalId === assignedProfessionalId ? existingServiceLine?.commissionRate ?? null : null)
        };
      })
      .filter((entry): entry is {
        serviceId: string;
        catalogService: PetServiceCatalog | undefined;
        existingServiceLine: PetAppointmentServiceLine | undefined;
        assignedProfessionalId: string;
        assignedProfessionalName: string | null;
        expectedInventoryConsumptions: PetAppointmentServiceLineInventoryConsumption[];
        commissionEligible: boolean | null;
        lineBasePrice: number | null;
        commissionRate: number | null;
      } => entry !== null);
  }, [editingServiceLinesById, professionalId, professionals, selectedServiceIds, serviceLineProfessionalIds, servicesById]);

  const selectedServices = useMemo<PetAppointmentSelectedService[]>(() => {
    return selectedServiceEntries.map((entry) => {
      const projectedCommissionAmount = entry.commissionEligible === true && entry.commissionRate != null && entry.lineBasePrice != null
        ? roundCurrency(entry.lineBasePrice * entry.commissionRate)
        : null;
      const commissionContext = entry.commissionEligible === true
        ? projectedCommissionAmount != null
          ? `${serviceSummaryCopy.commissionReady} · ${formatCommissionRate(locale, entry.commissionRate ?? 0)} · ${formatCurrencyForLocale(locale, projectedCommissionAmount)}`
          : serviceSummaryCopy.commissionPending
        : entry.commissionEligible === false
          ? serviceSummaryCopy.commissionExcluded
          : serviceSummaryCopy.commissionUnavailable;
      const commissionTone = entry.commissionEligible === true
        ? projectedCommissionAmount != null
          ? 'accent'
          : 'warning'
        : entry.commissionEligible === false
          ? 'neutral'
          : 'warning';

      if (entry.catalogService) {
        return {
          serviceId: entry.serviceId,
          label: describePetServiceCatalogItem(entry.catalogService, locale),
          note: entry.catalogService.active ? undefined : serviceSummaryCopy.inactiveLegacy,
          inventoryPreview: formatInventoryPreview(locale, entry.expectedInventoryConsumptions),
          professionalId: entry.assignedProfessionalId,
          professionalName: entry.assignedProfessionalName,
          professionalPending: !entry.assignedProfessionalId,
          commissionContext,
          commissionTone,
          removable: true
        };
      }

      return {
        serviceId: entry.serviceId,
        label: `${entry.existingServiceLine?.serviceName ?? messages.filters.service} · ${serviceSummaryCopy.legacyHeadlineSuffix}`,
        note: serviceSummaryCopy.missingLegacy,
        inventoryPreview: formatInventoryPreview(locale, entry.expectedInventoryConsumptions),
        professionalId: entry.assignedProfessionalId,
        professionalName: entry.assignedProfessionalName,
        professionalPending: !entry.assignedProfessionalId,
        commissionContext,
        commissionTone,
        removable: true
      };
    });
  }, [locale, messages.filters.service, selectedServiceEntries, serviceSummaryCopy]);

  const selectedServiceSummary = useMemo<PetAppointmentServiceSummary | null>(() => {
    if (selectedServiceEntries.length === 0) {
      return null;
    }

    const parsedExtrasAmount = extrasAmount ? parseFloat(extrasAmount) : 0;
    const safeExtrasAmount = Number.isFinite(parsedExtrasAmount) ? parsedExtrasAmount : 0;
    const notices: string[] = [];
    const categories = Array.from(new Set(
      selectedServiceEntries
        .map((entry) => entry.catalogService?.category ?? entry.existingServiceLine?.serviceCategory ?? null)
        .filter((category): category is NonNullable<typeof category> => Boolean(category))
        .map((category) => formatPetServiceCategory(category))
    ));
    const combinedDurationMinutes = selectedServiceEntries.reduce((total, entry) => (
      total + (entry.catalogService?.durationMinutes ?? entry.existingServiceLine?.durationMinutes ?? 0)
    ), 0);
    const combinedBasePrice = selectedServiceEntries.reduce((total, entry) => (
      total + (entry.catalogService?.basePrice ?? entry.existingServiceLine?.basePrice ?? 0)
    ), 0);
    const aggregatedInventoryConsumptions = aggregateInventoryConsumptions(
      selectedServiceEntries.map((entry) => entry.expectedInventoryConsumptions)
    );
    const commissionEligibleCount = selectedServiceEntries.filter((entry) => entry.commissionEligible === true).length;
    const projectedCommission = roundCurrency(selectedServiceEntries.reduce((total, entry) => {
      if (entry.commissionEligible !== true || entry.commissionRate == null || entry.lineBasePrice == null) {
        return total;
      }
      return total + (entry.lineBasePrice * entry.commissionRate);
    }, 0));
    const professionalPendingCount = selectedServiceEntries.filter((entry) => !entry.assignedProfessionalId).length;
    const commissionPendingCount = selectedServiceEntries.filter((entry) => (
      entry.commissionEligible === true && (entry.commissionRate == null || entry.lineBasePrice == null)
    )).length;
    const commissionUnavailableCount = selectedServiceEntries.filter((entry) => entry.commissionEligible == null).length;
    const supportsSelectedBookingMode = clientPlanId
      ? selectedServiceEntries.every((entry) => entry.catalogService?.allowInPlans ?? entry.existingServiceLine?.allowInPlans ?? false)
      : selectedServiceEntries.every((entry) => entry.catalogService?.allowStandaloneBooking ?? entry.existingServiceLine?.allowStandaloneBooking ?? false);
    const projectedCheckout = (clientPlanId && supportsSelectedBookingMode ? 0 : combinedBasePrice) + safeExtrasAmount;

    selectedServiceEntries.forEach((entry) => {
      if (entry.catalogService && !entry.catalogService.active) {
        notices.push(`${entry.catalogService.name}: ${serviceSummaryCopy.inactiveLegacy}`);
      } else if (!entry.catalogService) {
        notices.push(`${entry.existingServiceLine?.serviceName ?? messages.filters.service}: ${serviceSummaryCopy.missingLegacy}`);
      }
    });

    notices.push(clientPlanId
      ? (supportsSelectedBookingMode ? serviceSummaryCopy.planReady : serviceSummaryCopy.planBlocked)
      : (supportsSelectedBookingMode ? serviceSummaryCopy.standaloneReady : serviceSummaryCopy.standaloneBlocked));

    if (commissionEligibleCount === 0) {
      notices.push(serviceSummaryCopy.commissionExcludedNotice);
    } else {
      notices.push(serviceSummaryCopy.commissionProjectedNotice);
    }

    if (commissionPendingCount > 0) {
      notices.push(serviceSummaryCopy.commissionPendingNotice(commissionPendingCount));
    }

    if (commissionUnavailableCount > 0) {
      notices.push(serviceSummaryCopy.commissionUnavailableNotice(commissionUnavailableCount));
    }

    if (professionalPendingCount > 0) {
      notices.push(serviceSummaryCopy.professionalPendingNotice(professionalPendingCount));
    }

    return {
      title: serviceSummaryCopy.title,
      description: serviceSummaryCopy.description,
      selectedServicesLabel: serviceSummaryCopy.selectedServicesLabel,
      emptySelectionLabel: serviceSummaryCopy.emptySelectionLabel,
      addServiceLabel: serviceSummaryCopy.addServiceLabel,
      removeServiceLabel: serviceSummaryCopy.removeServiceLabel,
      headline: selectedServiceEntries.length === 1
        ? selectedServices[0]?.label ?? serviceSummaryCopy.title
        : `${selectedServiceEntries.length} ${serviceSummaryCopy.bundleHeadlineSuffix}`,
      details: [
        { label: serviceSummaryCopy.servicesCount, value: String(selectedServiceEntries.length) },
        { label: serviceSummaryCopy.category, value: categories.length > 0 ? categories.join(' + ') : serviceSummaryCopy.unavailable },
        {
          label: serviceSummaryCopy.scheduling,
          value: clientPlanId
            ? (supportsSelectedBookingMode ? serviceSummaryCopy.planOnly : serviceSummaryCopy.unavailable)
            : (supportsSelectedBookingMode ? serviceSummaryCopy.standaloneOnly : serviceSummaryCopy.unavailable)
        },
        { label: serviceSummaryCopy.duration, value: `${combinedDurationMinutes} min` },
        { label: serviceSummaryCopy.basePrice, value: formatCurrencyForLocale(locale, combinedBasePrice) },
        { label: serviceSummaryCopy.commissionLines, value: `${commissionEligibleCount}/${selectedServiceEntries.length}` },
        {
          label: serviceSummaryCopy.projectedCommission,
          value: commissionEligibleCount === 0
            ? serviceSummaryCopy.commissionExcluded
            : commissionPendingCount === commissionEligibleCount && projectedCommission === 0
              ? serviceSummaryCopy.commissionPending
              : formatCurrencyForLocale(locale, projectedCommission)
        },
        { label: serviceSummaryCopy.inventoryUsage, value: aggregatedInventoryConsumptions.length > 0
          ? formatInventoryPreview(locale, aggregatedInventoryConsumptions).replace(/^Expected stock:\s|^Estoque previsto:\s/, '')
          : serviceSummaryCopy.inventoryNone },
        { label: serviceSummaryCopy.checkout, value: formatCurrencyForLocale(locale, projectedCheckout) }
      ],
      notices
    };
  }, [clientPlanId, extrasAmount, locale, messages.filters.service, selectedServiceEntries, selectedServices, serviceSummaryCopy]);

  const actualConsumptionSelectionDirty = useMemo(() => {
    if (!editingId) {
      return false;
    }

    if (selectedServiceIds.length !== editingServiceLines.length) {
      return true;
    }

    return selectedServiceIds.some((serviceId, index) => serviceId !== editingServiceLines[index]?.serviceId);
  }, [editingId, editingServiceLines, selectedServiceIds]);

  const editableActualConsumptionLines = useMemo(() => {
    if (!editingId) {
      return [];
    }

    const selectedIds = new Set(selectedServiceIds);
    return editingServiceLines.filter((line) => selectedIds.has(line.serviceId));
  }, [editingId, editingServiceLines, selectedServiceIds]);

  function updateEditingServiceLineInventoryRow(
    serviceLineId: string,
    inventoryItemId: string,
    updater: (row: PetAppointmentServiceLineInventoryConsumption) => PetAppointmentServiceLineInventoryConsumption
  ) {
    setEditingServiceLines((current) => current.map((line) => {
      if (line.id !== serviceLineId) {
        return line;
      }

      return {
        ...line,
        expectedInventoryConsumptions: (line.expectedInventoryConsumptions ?? []).map((row) => (
          row.inventoryItemId === inventoryItemId ? updater(row) : row
        ))
      };
    }));
  }

  function handleActualConsumptionStatusChange(
    serviceLineId: string,
    inventoryItemId: string,
    nextStatus: PetAppointmentInventoryConsumptionStatus
  ) {
    updateEditingServiceLineInventoryRow(serviceLineId, inventoryItemId, (row) => ({
      ...row,
      actualQuantity: nextStatus === 'PLANNED'
        ? null
        : nextStatus === 'SKIPPED'
          ? 0
          : row.actualQuantity ?? null,
      consumptionStatus: nextStatus
    }));
  }

  function handleActualConsumptionQuantityChange(
    serviceLineId: string,
    inventoryItemId: string,
    value: string
  ) {
    updateEditingServiceLineInventoryRow(serviceLineId, inventoryItemId, (row) => ({
      ...row,
      actualQuantity: value === '' ? null : Number(value)
    }));
  }

  async function handleSaveActualConsumption(serviceLine: PetAppointmentServiceLine) {
    if (!editingId || !serviceLine.id) {
      setError(actualConsumptionCopy.bookFirst);
      return;
    }

    const snapshotRows = (serviceLine.expectedInventoryConsumptions ?? []).filter((row) => row.snapshotBacked);
    if (snapshotRows.length === 0) {
      setError(actualConsumptionCopy.rowUnavailable);
      return;
    }

    const invalidRow = snapshotRows.find((row) => (
      (row.consumptionStatus === 'ADJUSTED' || row.consumptionStatus === 'READY_TO_APPLY')
      && (row.actualQuantity == null || Number.isNaN(Number(row.actualQuantity)))
    ));
    if (invalidRow) {
      setError(locale === 'pt-BR'
        ? `Informe a quantidade real para ${invalidRow.inventoryItemName} antes de salvar.`
        : `Enter the actual quantity for ${invalidRow.inventoryItemName} before saving.`);
      return;
    }

    setSavingActualServiceLineId(serviceLine.id);
    setError(null);
    setSuccess(null);

    try {
      const updatedAppointment = await petService.updateAppointmentServiceLineInventoryConsumptions(
        editingId,
        serviceLine.id,
        {
          inventoryConsumptions: snapshotRows.map((row) => ({
            inventoryItemId: row.inventoryItemId,
            actualQuantity: row.consumptionStatus === 'PLANNED'
              ? null
              : row.consumptionStatus === 'SKIPPED'
                ? 0
                : row.actualQuantity ?? null,
            consumptionStatus: row.consumptionStatus
          }))
        }
      );

      setEditingServiceLines(updatedAppointment.appointmentServices ?? []);
      setSuccess(actualConsumptionCopy.updated);
      await loadData(pageData.page, search, statusFilter, clientFilterId, petFilterId, serviceFilterId, professionalFilterId, viewMode, currentMonth);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : messages.errors.save);
    } finally {
      setSavingActualServiceLineId(null);
    }
  }

  async function handleApplyStockConsumption(
    serviceLine: PetAppointmentServiceLine,
    row: PetAppointmentServiceLineInventoryConsumption
  ) {
    if (!editingId || !serviceLine.id || !row.id) {
      setError(actualConsumptionCopy.rowUnavailable);
      return;
    }

    setApplyingInventoryRowId(row.id);
    setError(null);
    setSuccess(null);

    try {
      const updatedAppointment = await petService.applyAppointmentServiceLineInventoryConsumption(
        editingId,
        serviceLine.id,
        row.id
      );

      setEditingServiceLines(updatedAppointment.appointmentServices ?? []);
      setSuccess(actualConsumptionCopy.applySuccess);
      await loadData(pageData.page, search, statusFilter, clientFilterId, petFilterId, serviceFilterId, professionalFilterId, viewMode, currentMonth);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : messages.errors.save);
    } finally {
      setApplyingInventoryRowId(null);
    }
  }

  const loadReferences = useCallback(async () => {
    const [clientPage, profilePage, servicePage, professionalPage] = await Promise.allSettled([
      canReadClients ? petService.listClients(0, 200, '') : Promise.resolve(null),
      canReadProfiles ? petService.listProfiles(0, 200, '') : Promise.resolve(null),
      canReadServices ? petService.listServices(0, 200, '') : Promise.resolve(null),
      canReadProfessionals ? petService.listProfessionals(0, 200, '') : Promise.resolve(null)
    ]);

    const issues: PetLookupIssue[] = [];

    if (!canReadClients) {
      setClients([]);
      issues.push({ key: 'clients', label: messages.notices.clients, message: resolvePetLookupIssue(null, 'pet.client.read') });
    } else if (clientPage.status === 'fulfilled' && clientPage.value) {
      setClients(resolvePageItems(clientPage.value));
    } else {
      setClients([]);
      issues.push({ key: 'clients', label: messages.notices.clients, message: resolvePetLookupIssue(clientPage.status === 'rejected' ? clientPage.reason : null) });
    }

    if (!canReadProfiles) {
      setProfiles([]);
      issues.push({ key: 'profiles', label: messages.notices.pets, message: resolvePetLookupIssue(null, 'pet.profile.read') });
    } else if (profilePage.status === 'fulfilled' && profilePage.value) {
      setProfiles(resolvePageItems(profilePage.value));
    } else {
      setProfiles([]);
      issues.push({ key: 'profiles', label: messages.notices.pets, message: resolvePetLookupIssue(profilePage.status === 'rejected' ? profilePage.reason : null) });
    }

    if (!canReadServices) {
      setServices([]);
      issues.push({ key: 'services', label: messages.notices.services, message: resolvePetLookupIssue(null, 'pet.service.read') });
    } else if (servicePage.status === 'fulfilled' && servicePage.value) {
      setServices(resolvePageItems(servicePage.value));
    } else {
      setServices([]);
      issues.push({ key: 'services', label: messages.notices.services, message: resolvePetLookupIssue(servicePage.status === 'rejected' ? servicePage.reason : null) });
    }

    if (!canReadProfessionals) {
      setProfessionals([]);
      issues.push({ key: 'professionals', label: messages.notices.professionals, message: resolvePetLookupIssue(null, 'pet.professional.read') });
    } else if (professionalPage.status === 'fulfilled' && professionalPage.value) {
      setProfessionals(resolvePageItems(professionalPage.value));
    } else {
      setProfessionals([]);
      issues.push({ key: 'professionals', label: messages.notices.professionals, message: resolvePetLookupIssue(professionalPage.status === 'rejected' ? professionalPage.reason : null) });
    }

    setLookupIssues(issues);
  }, [canReadClients, canReadProfessionals, canReadProfiles, canReadServices, messages.notices]);

  const loadData = useCallback(async (
    page: number,
    currentSearch: string,
    currentStatus: string,
    currentClientId: string,
    currentPetId: string,
    currentServiceId: string,
    currentProfessionalId: string,
    mode: 'list' | 'calendar',
    monthVal: Date
  ) => {
    setLoading(true);
    setError(null);

    try {
      const isCalendar = mode === 'calendar';
      
      let scheduledFrom: string | undefined = undefined;
      let scheduledTo: string | undefined = undefined;
      
      if (isCalendar) {
        // Fetch entire month for calendar
        const start = new Date(monthVal.getFullYear(), monthVal.getMonth(), 1);
        const end = new Date(monthVal.getFullYear(), monthVal.getMonth() + 1, 0, 23, 59, 59);
        scheduledFrom = start.toISOString();
        scheduledTo = end.toISOString();
      }

      const result = await petService.listAppointments(isCalendar ? 0 : page, isCalendar ? 100 : pageSize, currentSearch, {
        status: currentStatus || undefined,
        clientId: currentClientId || undefined,
        petId: currentPetId || undefined,
        serviceId: currentServiceId || undefined,
        professionalId: currentProfessionalId || undefined,
        scheduledFrom,
        scheduledTo
      });
      
      if (isCalendar) {
        setCalendarData(resolvePageItems(result));
      } else {
        setPageData(result);
      }
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : messages.errors.load);
    } finally {
      setLoading(false);
    }
  }, [messages.errors.load]);

  useEffect(() => {
    loadReferences();
  }, [loadReferences]);

  // Load plans for the selected client on-demand when the appointment form is open
  useEffect(() => {
    if (!isEditorOpen || !clientId) {
      setClientPlans([]);
      lastPlanClientIdRef.current = null;
      return;
    }
    if (lastPlanClientIdRef.current === clientId) return;
    lastPlanClientIdRef.current = clientId;
    setPlansLoading(true);
    petService.listClientPlans(clientId, 0, 100).then((result) => {
      setClientPlans(resolvePageItems(result));
    }).catch(() => {
      setClientPlans([]);
    }).finally(() => {
      setPlansLoading(false);
    });
  }, [clientId, isEditorOpen]);

  useEffect(() => {
    loadData(0, search, statusFilter, clientFilterId, petFilterId, serviceFilterId, professionalFilterId, viewMode, currentMonth);
  }, [clientFilterId, loadData, petFilterId, professionalFilterId, search, serviceFilterId, statusFilter, viewMode, currentMonth]);

  function resetForm() {
    setEditingId(null);
    setEditingServiceLines([]);
    setClientId('');
    setPetId('');
    setServicePickerId('');
    setSelectedServiceIds([]);
    setProfessionalId('');
    setServiceLineProfessionalIds({});
    setScheduledAt('');
    setStatus('SCHEDULED');
    setNotes('');
    setExtrasAmount('');
    setExtrasDescription('');
    setClientPlanId('');
    setClientPlans([]);
    lastPlanClientIdRef.current = null;
  }

  function beginCreate(presetDate?: Date) {
    resetForm();
    if (presetDate) {
      // Add timezone offset to match local time in datetime-local
      setScheduledAt(toDateTimeLocal(presetDate.toISOString()));
    }
    setIsEditorOpen(true);
  }

  function beginEdit(appointment: PetAppointment) {
    const appointmentServices = appointment.appointmentServices && appointment.appointmentServices.length > 0
      ? appointment.appointmentServices
      : [{
          serviceId: appointment.serviceId,
          serviceName: appointment.serviceName,
          serviceCategory: null,
          durationMinutes: appointment.totalServiceDurationMinutes ?? null,
          basePrice: appointment.servicePrice ?? appointment.totalServiceBasePrice ?? null,
          professionalId: appointment.professionalId,
          professionalName: appointment.professionalName ?? null,
          commissionEligible: null,
          commissionRate: null,
          commissionAmount: appointment.commissionAmount ?? null,
          expectedInventoryConsumptions: [],
          active: false,
          allowInPlans: Boolean(appointment.clientPlanId),
          allowStandaloneBooking: !appointment.clientPlanId,
          lineOrder: 0,
          primary: true,
          missingFromCatalog: true
        }];
    setEditingId(appointment.id);
    setEditingServiceLines(appointmentServices);
    setClientId(appointment.clientId);
    setPetId(appointment.petId);
    setServicePickerId('');
    setSelectedServiceIds(appointmentServices.map((service) => service.serviceId));
    setServiceLineProfessionalIds(Object.fromEntries(
      appointmentServices.map((service) => [
        service.serviceId,
        service.professionalId === undefined ? appointment.professionalId : (service.professionalId ?? '')
      ])
    ));
    setProfessionalId(appointment.professionalId);
    setScheduledAt(toDateTimeLocal(appointment.scheduledAt));
    setStatus(appointment.status);
    setNotes(appointment.notes ?? '');
    setExtrasAmount(appointment.extrasAmount != null ? String(appointment.extrasAmount) : '');
    setExtrasDescription(appointment.extrasDescription ?? '');
    setClientPlanId(appointment.clientPlanId ?? '');
    setSuccess(null);
    setError(null);
    setIsEditorOpen(true);
  }

  function onCalendarEventClick(e: React.MouseEvent, apt: PetAppointment) {
    e.stopPropagation();
    beginEdit(apt);
  }

  function handleAddService() {
    if (!servicePickerId || selectedServiceIds.includes(servicePickerId)) {
      return;
    }

    setSelectedServiceIds((current) => [...current, servicePickerId]);
    setServiceLineProfessionalIds((current) => ({
      ...current,
      [servicePickerId]: current[servicePickerId] ?? professionalId
    }));
    setServicePickerId('');
  }

  function handleRemoveService(serviceToRemoveId: string) {
    setSelectedServiceIds((current) => current.filter((selectedId) => selectedId !== serviceToRemoveId));
    setServiceLineProfessionalIds((current) => {
      const next = { ...current };
      delete next[serviceToRemoveId];
      return next;
    });
  }

  function handleProfessionalIdChange(nextProfessionalId: string) {
    setServiceLineProfessionalIds((current) => {
      const next = { ...current };
      selectedServiceIds.forEach((serviceId) => {
        if (!next[serviceId] || next[serviceId] === professionalId) {
          next[serviceId] = nextProfessionalId;
        }
      });
      return next;
    });
    setProfessionalId(nextProfessionalId);
  }

  function handleSelectedServiceProfessionalChange(serviceId: string, nextProfessionalId: string) {
    setServiceLineProfessionalIds((current) => ({
      ...current,
      [serviceId]: nextProfessionalId
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!clientId || !petId || selectedServiceIds.length === 0 || !professionalId) {
      setError(messages.errors.missingReferences);
      return;
    }

    const isoScheduledAt = toIsoDate(scheduledAt);
    if (!isoScheduledAt) {
      setError(messages.errors.missingDate);
      return;
    }

    setSubmitting(true);

    const primaryServiceId = selectedServiceIds[0];
    const parsedExtrasAmount = extrasAmount ? parseFloat(extrasAmount) : undefined;
    if (!editingId && selectedServiceEntries.some((entry) => entry.catalogService && !entry.catalogService.active)) {
      setSubmitting(false);
      setError('Selected service is inactive for new bookings.');
      return;
    }

    if (!editingId && selectedServiceEntries.some((entry) => !entry.catalogService)) {
      setSubmitting(false);
      setError('Legacy appointment services cannot be used for new bookings.');
      return;
    }

    if (clientPlanId && selectedServiceEntries.some((entry) => !(entry.catalogService?.allowInPlans ?? entry.existingServiceLine?.allowInPlans))) {
      setSubmitting(false);
      setError('At least one selected service is not available for plan-based appointments.');
      return;
    }

    if (!clientPlanId && selectedServiceEntries.some((entry) => !(entry.catalogService?.allowStandaloneBooking ?? entry.existingServiceLine?.allowStandaloneBooking))) {
      setSubmitting(false);
      setError('At least one selected service requires a linked plan before booking.');
      return;
    }

    if (!primaryServiceId) {
        setSubmitting(false);
        setError(messages.errors.missingReferences);
        return;
    }

    const payload = {
      clientId,
      petId,
      serviceId: primaryServiceId,
      serviceIds: selectedServiceIds,
      professionalId,
      serviceLineAssignments: selectedServiceIds.map((serviceId) => ({
        serviceId,
        professionalId: Object.prototype.hasOwnProperty.call(serviceLineProfessionalIds, serviceId)
          ? (serviceLineProfessionalIds[serviceId] || null)
          : (professionalId || null)
      })),
      scheduledAt: isoScheduledAt,
      status,
      notes: notes || undefined,
      clientPlanId: clientPlanId || undefined,
      extrasAmount: parsedExtrasAmount,
      extrasDescription: extrasDescription || undefined
    };

    try {
      if (editingId) {
        await petService.updateAppointment(editingId, payload);
        setSuccess(messages.success.updated);
      } else {
        await petService.createAppointment(payload);
        setSuccess(messages.success.created);
      }

      setIsEditorOpen(false);
      await loadData(pageData.page, search, statusFilter, clientFilterId, petFilterId, serviceFilterId, professionalFilterId, viewMode, currentMonth);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : messages.errors.save);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteCandidate) return;

    try {
      await petService.deleteAppointment(deleteCandidate.id);
      setDeleteCandidate(null);
      setIsEditorOpen(false); // Close drawer if deleting from inside
      setSuccess(messages.success.deleted);
      await loadData(pageData.page, search, statusFilter, clientFilterId, petFilterId, serviceFilterId, professionalFilterId, viewMode, currentMonth);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : messages.errors.delete);
    }
  }

  const handlePreparePickupMessage = useCallback(async (appointment: PetAppointment) => {
    setPreparingPickupAppointmentId(appointment.id);
    setPreparedPickupMessage('');
    setError(null);
    setSuccess(null);

    try {
      const prepared = await petService.preparePetReadyMessage(appointment.id);
      setPreparedPickupMessage(prepared.message);
      setPreparedPickupAppointmentId(appointment.id);
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(prepared.message);
      }
      setSuccess(prepared.eligible
        ? messages.preparedPickup.success
        : messages.preparedPickup.needsReview);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : messages.preparedPickup.error);
    } finally {
      setPreparingPickupAppointmentId(null);
    }
  }, [
    messages.preparedPickup.error,
    messages.preparedPickup.needsReview,
    messages.preparedPickup.success
  ]);

  const rows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);
  const activeFilterCount = [search, statusFilter, clientFilterId, petFilterId, serviceFilterId, professionalFilterId].filter(Boolean).length;
  const clientsLookupUnavailable = lookupIssues.some((issue) => issue.key === 'clients');
  const profilesLookupUnavailable = lookupIssues.some((issue) => issue.key === 'profiles');
  const servicesLookupUnavailable = lookupIssues.some((issue) => issue.key === 'services');
  const professionalsLookupUnavailable = lookupIssues.some((issue) => issue.key === 'professionals');
  const appointmentReferencesReady = !clientsLookupUnavailable && !profilesLookupUnavailable && !servicesLookupUnavailable && !professionalsLookupUnavailable;
  const visibleAppointments = viewMode === 'calendar' ? calendarData : rows;
  const recurringAppointments = visibleAppointments.filter((appointment) => Boolean(appointment.clientPlanId)).length;
  const oneTimeAppointments = visibleAppointments.filter((appointment) => !appointment.clientPlanId).length;
  const readyForPickup = visibleAppointments.filter((appointment) => appointment.status.toUpperCase() === 'COMPLETED').length;
  const pickupMessagesReady = visibleAppointments.filter((appointment) => hasPickupMessageCoverage(appointment, clients)).length;
  const lowPlanAlerts = visibleAppointments.filter((appointment) => Boolean(appointment.clientPlanId) && (appointment.planRemainingSessions ?? 99) <= 2).length;
  const petTaxiAppointments = visibleAppointments.filter((appointment) => hasPetTaxi(appointment)).length;
  const visibleCommissionTotal = visibleAppointments.reduce((total, appointment) => total + (appointment.commissionAmount ?? 0), 0);

  const columns = useMemo(() => createPetAppointmentColumns({
    locale,
    messages,
    commonButtons,
    clients,
    professionals,
    profiles,
    clientsLookupUnavailable,
    professionalsLookupUnavailable,
    profilesLookupUnavailable,
    onEdit: beginEdit,
    onDelete: setDeleteCandidate,
    onPreparePickupMessage: handlePreparePickupMessage,
    preparingPickupAppointmentId,
    preparedPickupAppointmentId
  }), [
    clients,
    clientsLookupUnavailable,
    commonButtons,
    handlePreparePickupMessage,
    locale,
    messages,
    professionals,
    professionalsLookupUnavailable,
    profiles,
    profilesLookupUnavailable,
    preparedPickupAppointmentId,
    preparingPickupAppointmentId
  ]);

  return (
    <PermissionGuard
      permission="pet.appointment.read"
      fallback={<div className="ui-notice-warning">{messages.noPermission}</div>}
    >
      <div className={sharedPageStackClass}>
        <PetModuleSubnav />

        <PageTitle 
           title={messages.title}
           description={messages.description}
           actions={
             <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}
                  className="ui-secondary-button"
                >
                  {viewMode === 'calendar' ? messages.actions.switchToList : messages.actions.switchToCalendar}
                </button>
                <PermissionGuard permission="pet.appointment.create">
                  <button type="button" onClick={() => beginCreate()} className="ui-primary-button">
                    {messages.actions.book}
                  </button>
                </PermissionGuard>
             </div>
           }
        />

        <PageSection
          tone="muted"
          title={messages.filters.title}
          description={messages.filters.description}
        >
          <PetAppointmentsFilters
            searchInput={searchInput}
            onSearchInputChange={setSearchInput}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            clientFilterId={clientFilterId}
            onClientFilterIdChange={setClientFilterId}
            clientOptions={clientOptions}
            clientsLookupUnavailable={clientsLookupUnavailable}
            petFilterId={petFilterId}
            onPetFilterIdChange={setPetFilterId}
            petOptions={petOptions}
            profilesLookupUnavailable={profilesLookupUnavailable}
            serviceFilterId={serviceFilterId}
            onServiceFilterIdChange={setServiceFilterId}
            serviceOptions={serviceOptions}
            servicesLookupUnavailable={servicesLookupUnavailable}
            professionalFilterId={professionalFilterId}
            onProfessionalFilterIdChange={setProfessionalFilterId}
            professionalOptions={professionalOptions}
            professionalsLookupUnavailable={professionalsLookupUnavailable}
            activeFilterCount={activeFilterCount}
            onSearch={() => setSearch(searchInput)}
            onClear={() => {
              setSearchInput('');
              setSearch('');
              setStatusFilter('');
              setClientFilterId('');
              setPetFilterId('');
              setServiceFilterId('');
              setProfessionalFilterId('');
            }}
          />
        </PageSection>

        <PetLookupFeedback issues={lookupIssues} />

        {error ? <div className="ui-notice-error">{error}</div> : null}
        {success ? <div className="ui-notice-success">{success}</div> : null}
        {preparedPickupMessage ? (
          <PageSection
            tone="muted"
            title={messages.preparedPickup.title}
            description={messages.preparedPickup.description}
          >
            <div className="mb-4 rounded-[1.35rem] border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
              <p className="font-semibold">{messages.preparedPickup.reviewTitle}</p>
              <p className="mt-1 text-emerald-800">{messages.preparedPickup.reviewDescription}</p>
            </div>
            <FormTextarea
              label={messages.preparedPickup.label}
              value={preparedPickupMessage}
              onChange={setPreparedPickupMessage}
              rows={5}
            />
          </PageSection>
        ) : null}

        <PageSection
          tone="muted"
          title={messages.focus.title}
          description={messages.focus.description}
        >
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <AppointmentFocusCard
              icon={RefreshCcw}
              label={messages.focus.recurring}
              value={new Intl.NumberFormat(locale).format(recurringAppointments)}
              detail={messages.focus.recurringDetail}
            />
            <AppointmentFocusCard
              icon={CalendarCheck}
              label={messages.focus.oneTime}
              value={new Intl.NumberFormat(locale).format(oneTimeAppointments)}
              detail={messages.focus.oneTimeDetail}
            />
            <AppointmentFocusCard
              icon={CalendarCheck}
              label={messages.focus.ready}
              value={new Intl.NumberFormat(locale).format(readyForPickup)}
              detail={`${pickupMessagesReady} ${messages.focus.readyDetailSuffix}`}
            />
            <AppointmentFocusCard
              icon={CreditCard}
              label={messages.focus.planAlerts}
              value={new Intl.NumberFormat(locale).format(lowPlanAlerts)}
              detail={messages.focus.planAlertsDetail}
              tone={lowPlanAlerts > 0 ? 'warning' : 'default'}
            />
            <AppointmentFocusCard
              icon={CarFront}
              label={messages.focus.petTaxi}
              value={new Intl.NumberFormat(locale).format(petTaxiAppointments)}
              detail={messages.focus.petTaxiDetail}
            />
            <AppointmentFocusCard
              icon={CreditCard}
              label={messages.focus.commission}
              value={formatCurrencyForLocale(locale, visibleCommissionTotal)}
              detail={messages.focus.commissionDetail}
              tone="accent"
            />
          </div>
          <p className="mt-4 text-sm text-[color:var(--app-shell-muted)]">
            {messages.focus.pickupRule}
          </p>
        </PageSection>

        {viewMode === 'calendar' ? (
          <PetAppointmentsCalendar
            appointments={calendarData}
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
            onDateClick={(d) => beginCreate(d)}
            onEventClick={onCalendarEventClick}
          />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={rows}
              getRowKey={(row) => row.id}
              loading={loading}
              loadingTitle={messages.table.loadingTitle}
              loadingDescription={messages.table.loadingDescription}
              emptyState={{
                title: messages.table.emptyTitle,
                description: messages.table.emptyDescription,
                action: canCreateAppointments ? (
                  <button type="button" onClick={() => beginCreate()} className="ui-primary-button">
                    {messages.table.firstAppointment}
                  </button>
                ) : undefined
              }}
            />

            <Pagination
              page={pageData.page}
              totalPages={pageData.totalPages}
              totalElements={totalItems}
              onPageChange={(nextPage) =>
                loadData(nextPage, search, statusFilter, clientFilterId, petFilterId, serviceFilterId, professionalFilterId, viewMode, currentMonth)
              }
            />
          </>
        )}

        {/* APPOINTMENT EDITOR DIALOG */}
        {isEditorOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-3 py-4 backdrop-blur-[2px] sm:px-6">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="pet-appointment-editor-title"
              className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_32px_90px_-42px_rgba(15,23,42,0.45)]"
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
                <div>
                  <h2 id="pet-appointment-editor-title" className="text-xl font-semibold tracking-tight text-slate-900">
                    {editingId ? messages.drawer.editTitle : messages.drawer.createTitle}
                  </h2>
                  <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-700">
                    {messages.drawer.description}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  aria-label={messages.form.cancel}
                  className="rounded-full p-2 text-slate-600 transition-colors duration-200 hover:bg-surface-inset hover:text-slate-900"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="overflow-y-auto px-5 py-5 sm:px-6">
                <PetAppointmentForm
                  editingId={editingId}
                  onSubmit={handleSubmit}
                  clientId={clientId}
                  onClientIdChange={setClientId}
                  formClientOptions={formClientOptions}
                  clientsLookupUnavailable={clientsLookupUnavailable}
                  petId={petId}
                  onPetIdChange={setPetId}
                  formPetOptions={formPetOptions}
                  profilesLookupUnavailable={profilesLookupUnavailable}
                  servicePickerId={servicePickerId}
                  onServicePickerIdChange={setServicePickerId}
                  formServiceOptions={formServiceOptions}
                  servicesLookupUnavailable={servicesLookupUnavailable}
                  selectedServices={selectedServices}
                  onAddService={handleAddService}
                  onRemoveService={handleRemoveService}
                  canAddSelectedService={Boolean(servicePickerId) && !selectedServiceIds.includes(servicePickerId)}
                  professionalId={professionalId}
                  onProfessionalIdChange={handleProfessionalIdChange}
                  formProfessionalOptions={formProfessionalOptions}
                  serviceLineProfessionalOptions={serviceLineProfessionalOptions}
                  onSelectedServiceProfessionalChange={handleSelectedServiceProfessionalChange}
                  professionalsLookupUnavailable={professionalsLookupUnavailable}
                  scheduledAt={scheduledAt}
                  onScheduledAtChange={setScheduledAt}
                  status={status}
                  onStatusChange={setStatus}
                  notes={notes}
                  onNotesChange={setNotes}
                  clientPlanId={clientPlanId}
                  onClientPlanIdChange={setClientPlanId}
                  planOptions={planOptions}
                  selectedClientPlan={selectedClientPlan}
                  extrasAmount={extrasAmount}
                  onExtrasAmountChange={setExtrasAmount}
                  extrasDescription={extrasDescription}
                  onExtrasDescriptionChange={setExtrasDescription}
                  serviceSummaryTitle={serviceSummaryCopy.title}
                  serviceSummaryEmpty={serviceSummaryCopy.empty}
                  selectedServiceSummary={selectedServiceSummary}
                  submitting={submitting}
                  appointmentReferencesReady={appointmentReferencesReady}
                  onCancelEdit={() => setIsEditorOpen(false)}
                />

                {editingId ? (
                  <div className="ui-surface-panel p-4 space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--app-shell-muted)]">
                        {actualConsumptionCopy.title}
                      </p>
                      <p className="mt-0.5 text-xs text-[color:var(--app-shell-muted)]">
                        {actualConsumptionCopy.description}
                      </p>
                    </div>

                    {actualConsumptionSelectionDirty ? (
                      <div className="ui-notice-warning">
                        {actualConsumptionCopy.saveFirst}
                      </div>
                    ) : editableActualConsumptionLines.length === 0 ? (
                      <div className="rounded-xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel-muted)] px-4 py-3 text-sm text-[color:var(--app-shell-muted)]">
                        {actualConsumptionCopy.bookFirst}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {editableActualConsumptionLines.map((line) => {
                          const inventoryRows = line.expectedInventoryConsumptions ?? [];
                          const snapshotRows = inventoryRows.filter((row) => row.snapshotBacked);
                          const snapshotOnly = inventoryRows.length > 0 && snapshotRows.length === 0;

                          return (
                            <div
                              key={line.id ?? `${line.serviceId}-${line.lineOrder}`}
                              className="rounded-xl border border-[color:var(--app-shell-border)] bg-white/80 px-4 py-3"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-slate-900">{line.serviceName}</p>
                                  <p className="mt-1 text-xs text-[color:var(--app-shell-muted)]">
                                    {formatActualInventoryPreview(locale, inventoryRows)}
                                  </p>
                                </div>
                                {line.lineOrder === 0 ? (
                                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                                    {locale === 'pt-BR' ? 'Linha principal' : 'Primary line'}
                                  </span>
                                ) : null}
                              </div>

                              {inventoryRows.length === 0 ? (
                                <div className="mt-3 rounded-lg border border-dashed border-[color:var(--app-shell-border)] px-3 py-2 text-xs text-[color:var(--app-shell-muted)]">
                                  {actualConsumptionCopy.noInventory}
                                </div>
                              ) : (
                                <div className="mt-3 space-y-3">
                                  {inventoryRows.map((row) => {
                                    const quantityValue = row.actualQuantity == null ? '' : String(row.actualQuantity);
                                    const quantityDisabled = !row.snapshotBacked
                                      || row.stockApplied
                                      || row.consumptionStatus === 'PLANNED'
                                      || row.consumptionStatus === 'SKIPPED';
                                    const canApplyStock = canApplyStockConsumption(row);
                                    const stockApplicationDetail = resolveStockApplicationDetail(locale, row, actualConsumptionCopy);
                                    const varianceStatus = resolveInventoryVarianceStatus(row);
                                    const actualQuantityText = row.actualQuantity == null
                                      ? actualConsumptionCopy.notRecorded
                                      : `${formatInventoryQuantity(locale, row.actualQuantity)} ${row.unitOfMeasure}`;
                                    const appliedQuantityText = row.appliedQuantity == null
                                      ? actualConsumptionCopy.notApplied
                                      : `${formatInventoryQuantity(locale, row.appliedQuantity)} ${row.unitOfMeasure}`;

                                    return (
                                      <div
                                        key={`${line.id}-${row.inventoryItemId}`}
                                        className="rounded-lg border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel-muted)] px-3 py-3"
                                      >
                                        <div className="flex items-start justify-between gap-3">
                                          <div>
                                            <p className="text-sm font-medium text-slate-900">{row.inventoryItemName}</p>
                                            <p className="mt-1 text-xs text-[color:var(--app-shell-muted)]">
                                              {actualConsumptionCopy.planned}: {formatInventoryQuantity(locale, row.expectedQuantity)} {row.unitOfMeasure}
                                            </p>
                                            <p className="mt-1 text-xs text-[color:var(--app-shell-muted)]">
                                              {actualConsumptionCopy.actual}: {actualQuantityText} | {actualConsumptionCopy.applied}: {appliedQuantityText}
                                            </p>
                                            {row.inventoryItemSku ? (
                                              <p className="mt-1 text-[11px] text-[color:var(--app-shell-muted)]">
                                                SKU: {row.inventoryItemSku}
                                              </p>
                                            ) : null}
                                            <p className={`mt-1 text-[11px] ${row.stockApplied ? 'text-emerald-700' : 'text-[color:var(--app-shell-muted)]'}`}>
                                              {stockApplicationDetail}
                                            </p>
                                          </div>
                                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${resolveInventoryVarianceTone(varianceStatus)}`}>
                                            {actualConsumptionCopy.variance}: {actualConsumptionCopy.varianceLabels[varianceStatus]}
                                          </span>
                                        </div>

                                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                                          <FormInput
                                            label={actualConsumptionCopy.actual}
                                            value={quantityValue}
                                            onChange={(value) => handleActualConsumptionQuantityChange(line.id ?? '', row.inventoryItemId, value)}
                                            type="number"
                                            disabled={quantityDisabled}
                                            description={!row.snapshotBacked ? actualConsumptionCopy.snapshotOnly : undefined}
                                          />
                                          <FormSelect
                                            label={actualConsumptionCopy.status}
                                            value={row.consumptionStatus}
                                            options={actualConsumptionStatusOptions}
                                            onChange={(value) => handleActualConsumptionStatusChange(
                                              line.id ?? '',
                                              row.inventoryItemId,
                                              value as PetAppointmentInventoryConsumptionStatus
                                            )}
                                            disabled={!row.snapshotBacked || row.stockApplied}
                                          />
                                        </div>

                                        {canApplyStock ? (
                                          <div className="mt-3 flex justify-end">
                                            <button
                                              type="button"
                                              onClick={() => handleApplyStockConsumption(line, row)}
                                              disabled={applyingInventoryRowId === row.id}
                                              className="ui-primary-button"
                                            >
                                              {applyingInventoryRowId === row.id ? actualConsumptionCopy.applying : actualConsumptionCopy.apply}
                                            </button>
                                          </div>
                                        ) : null}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {snapshotOnly ? (
                                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                                  {actualConsumptionCopy.snapshotOnly}
                                </div>
                              ) : null}

                              {snapshotRows.length > 0 ? (
                                <div className="mt-4 flex justify-end">
                                  <button
                                    type="button"
                                    onClick={() => handleSaveActualConsumption(line)}
                                    disabled={savingActualServiceLineId === line.id}
                                    className="ui-secondary-button"
                                  >
                                    {savingActualServiceLineId === line.id ? actualConsumptionCopy.saving : actualConsumptionCopy.save}
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}

        <ConfirmDialog
          open={Boolean(deleteCandidate)}
          title={messages.dialog.deleteTitle}
          description={deleteCandidate ? messages.dialog.deleteDescription.replace('{service}', deleteCandidate.serviceName) : undefined}
          confirmLabel={messages.dialog.confirmDelete}
          onCancel={() => setDeleteCandidate(null)}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </PermissionGuard>
  );
}
