'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { PetModuleSubnav } from '@/modules/pet/pet-module-subnav';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { usePermissions } from '@/shared/auth/usePermissions';
import { sharedPageStackClass } from '@/shared/components/public-visual-system';
import { StatusBadge } from '@/shared/dashboard/status-badge';
import { useAppI18n, useAppMessages } from '@/shared/i18n/app-i18n-provider';
import type { AppMessages } from '@/shared/i18n/messages/pt-br';
import { formatCurrencyForLocale, formatDateForLocale } from '@/shared/i18n/formatters';
import { ApiClientError } from '@/shared/lib/http';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { isOfficialWhatsAppEnabled } from '@/shared/messaging/official-whatsapp';
import { petService } from '@/shared/services/pet-service';
import { PageResponse } from '@/shared/types/common';
import { ClientPlan, PetClient, PetProfile, PetServiceCatalog, PlanTemplate } from '@/shared/types/pet';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { FormInput } from '@/shared/ui/form-input';
import { FormSelect } from '@/shared/ui/form-select';
import { FormTextarea } from '@/shared/ui/form-textarea';
import { PageSection } from '@/shared/ui/page-section';
import { PageTitle } from '@/shared/ui/page-title';
import { Pagination } from '@/shared/ui/pagination';
import { resolveApiErrorMessage } from '@/shared/lib/api-error-message';

const pageSize = 14;

const initialPage: PageResponse<ClientPlan> = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: pageSize
};

const initialTemplatePage: PageResponse<PlanTemplate> = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: pageSize
};

function buildSoldPlanStatusOptions(copy: AppMessages['screens']['petPlans']) {
  return [
    { value: 'ACTIVE', label: copy.statusActive },
    { value: 'PAUSED', label: copy.statusPaused },
    { value: 'CANCELED', label: copy.statusCanceled }
  ];
}

// Returns a toneMap-compatible status key for StatusBadge
function resolveRenewalStateLabel(renewalState: string | undefined, labels: Record<string, string>): string {
  const state = renewalState ?? 'HEALTHY';
  return labels[state] ?? state;
}

function resolvePlanStatusKey(plan: ClientPlan): string {
  if (plan.remainingSessions <= 0) return 'canceled'; // exhausted → destructive tone
  if (plan.expiresAt && new Date(plan.expiresAt) < new Date()) return 'error'; // expired → destructive tone
  if (plan.remainingSessions <= 2) return 'warn'; // low sessions → warning tone
  return 'active'; // healthy
}

function formatExpiryLabel(locale: string, value: string | null | undefined, noExpiryLabel: string) {
  if (!value) {
    return noExpiryLabel;
  }

  return formatDateForLocale(locale as 'pt-BR' | 'en-US', value);
}

export function PetPlansPage() {
  const screenCopy = useAppMessages().screens.petPlans;
  const { locale } = useAppI18n();
  const appMessages = useAppMessages();
  const messages = appMessages.petPlans;
  const appointmentMessages = appMessages.petAppointments;
  const commonButtons = appMessages.common.buttons;
  const { hasPermission } = usePermissions();
  const [pageData, setPageData] = useState<PageResponse<ClientPlan>>(initialPage);
  const [templatePageData, setTemplatePageData] = useState<PageResponse<PlanTemplate>>(initialTemplatePage);
  const [clients, setClients] = useState<PetClient[]>([]);
  const [pets, setPets] = useState<PetProfile[]>([]);
  const [services, setServices] = useState<PetServiceCatalog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPlanEditorOpen, setIsPlanEditorOpen] = useState(false);
  const [clientId, setClientId] = useState('');
  const [petId, setPetId] = useState('');
  const [planTemplateId, setPlanTemplateId] = useState('');
  const [planName, setPlanName] = useState('');
  const [startedAt, setStartedAt] = useState('');
  const [totalSessions, setTotalSessions] = useState('10');
  const [expiresAt, setExpiresAt] = useState('');
  const [finalPrice, setFinalPrice] = useState('');
  const [soldPlanStatus, setSoldPlanStatus] = useState('ACTIVE');
  const [soldPlanNotes, setSoldPlanNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [isTemplateEditorOpen, setIsTemplateEditorOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templatePrice, setTemplatePrice] = useState('');
  const [templateValidityDays, setTemplateValidityDays] = useState('30');
  const [templateTotalSessions, setTemplateTotalSessions] = useState('4');
  const [templateServiceIds, setTemplateServiceIds] = useState<string[]>([]);
  const [templateRenewalRules, setTemplateRenewalRules] = useState(screenCopy.renewalRulesDefault);
  const [templateActive, setTemplateActive] = useState(true);
  const [templateSubmitting, setTemplateSubmitting] = useState(false);

  const [deleteCandidate, setDeleteCandidate] = useState<ClientPlan | null>(null);
  const [billingPixKey, setBillingPixKey] = useState('');
  const [billingDisplayName, setBillingDisplayName] = useState('');
  const [planRenewalTemplate, setPlanRenewalTemplate] = useState('');
  const [petReadyTemplate, setPetReadyTemplate] = useState('');
  const [billingSettingsLoading, setBillingSettingsLoading] = useState(false);
  const [billingSettingsSaving, setBillingSettingsSaving] = useState(false);
  const [preparedRenewalMessage, setPreparedRenewalMessage] = useState('');
  const [preparedRenewalCharge, setPreparedRenewalCharge] = useState<{
    clientName?: string | null;
    petName?: string | null;
    planName?: string | null;
    invoiceId?: string | null;
    status?: string | null;
    amount?: number | null;
    outstandingAmount?: number | null;
    pixKey?: string | null;
    billingDisplayName?: string | null;
  } | null>(null);
  const [preparingRenewalPlanId, setPreparingRenewalPlanId] = useState<string | null>(null);
  const [dispatchingRenewalPlanId, setDispatchingRenewalPlanId] = useState<string | null>(null);
  const [dispatchedRenewalPlanId, setDispatchedRenewalPlanId] = useState<string | null>(null);

  const canReadClients = hasPermission('pet.client.read');
  const canReadPets = hasPermission('pet.profile.read');
  const canReadServices = hasPermission('pet.service.read');
  const canManagePlan = hasPermission('pet.plan.create');

  const formClientOptions = useMemo(() => {
    return [
      { value: '', label: messages.filters.selectClient },
      ...clients.map((c) => ({ value: c.id, label: c.name ?? c.fullName ?? c.id }))
    ];
  }, [clients, messages.filters.selectClient]);

  const formPetOptions = useMemo(() => {
    const visiblePets = clientId ? pets.filter((pet) => pet.clientId === clientId) : pets;
    return [
      { value: '', label: screenCopy.selectPet },
      ...visiblePets.map((pet) => ({ value: pet.id, label: pet.name }))
    ];
  }, [clientId, pets, screenCopy]);

  const templates = resolvePageItems(templatePageData);
  const activeTemplates = templates.filter((template) => template.active);
  const templateOptions = useMemo(() => [
    { value: '', label: screenCopy.selectCatalogPlan },
    ...activeTemplates.map((template) => ({
      value: template.id,
      label: screenCopy.templateOptionLabel
        .replace('{name}', template.commercialName)
        .replace('{sessions}', String(template.totalSessions))
    }))
  ], [activeTemplates, screenCopy]);

  const selectedTemplate = activeTemplates.find((template) => template.id === planTemplateId);
  const serviceOptions = useMemo(() => services.map((service) => ({
    value: service.id,
    label: service.name
  })), [services]);

  const load = useCallback(async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await petService.listClientPlans(undefined, page, pageSize);
      setPageData(result);
    } catch (err) {
      setError(resolveApiErrorMessage(err, messages.loadingDescription));
    } finally {
      setLoading(false);
    }
  }, [messages.loadingDescription]);

  const loadTemplates = useCallback(async () => {
    try {
      const result = await petService.listPlanTemplates(0, pageSize, '');
      setTemplatePageData(result);
    } catch (err) {
      setError(resolveApiErrorMessage(err, screenCopy.catalogLoadError));
    }
  }, [screenCopy]);

  useEffect(() => {
    void load(0);
  }, [load]);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  useEffect(() => {
    if (!canReadClients) return;
    petService.listClients(0, 200, '').then((result) => {
      setClients(resolvePageItems(result));
    }).catch(() => {
      // Non-critical — client names will fall back to IDs
    });
  }, [canReadClients]);

  useEffect(() => {
    if (!canReadPets) return;
    petService.listProfiles(0, 200, '').then((result) => {
      setPets(resolvePageItems(result));
    }).catch(() => {
      setPets([]);
    });
  }, [canReadPets]);

  useEffect(() => {
    if (!canReadServices) return;
    petService.listServices(0, 200, '', { active: true }).then((result) => {
      setServices(resolvePageItems(result));
    }).catch(() => {
      setServices([]);
    });
  }, [canReadServices]);

  useEffect(() => {
    setBillingSettingsLoading(true);
    petService.getBillingMessageSettings().then((settings) => {
      setBillingPixKey(settings.pixKey ?? '');
      setBillingDisplayName(settings.billingDisplayName ?? '');
      setPlanRenewalTemplate(settings.planRenewalMessageTemplate ?? '');
      setPetReadyTemplate(settings.petReadyMessageTemplate ?? '');
    }).catch((err) => {
      setError(resolveApiErrorMessage(err, screenCopy.billingSettingsLoadError));
    }).finally(() => {
      setBillingSettingsLoading(false);
    });
  }, [screenCopy]);

  function resetForm() {
    setEditingId(null);
    setClientId('');
    setPetId('');
    setPlanTemplateId('');
    setPlanName('');
    setStartedAt('');
    setTotalSessions('10');
    setExpiresAt('');
    setFinalPrice('');
    setSoldPlanStatus('ACTIVE');
    setSoldPlanNotes('');
  }

  function beginEdit(plan: ClientPlan) {
    setIsPlanEditorOpen(true);
    setEditingId(plan.id);
    setClientId(plan.clientId);
    setPetId(plan.petId ?? '');
    setPlanTemplateId(plan.planTemplateId ?? '');
    setPlanName(plan.planName);
    setTotalSessions(String(plan.totalSessions));
    setStartedAt(plan.startedAt ? plan.startedAt.substring(0, 10) : '');
    setExpiresAt(plan.expiresAt ? plan.expiresAt.substring(0, 10) : '');
    setFinalPrice(plan.finalPrice == null ? '' : String(plan.finalPrice));
    setSoldPlanStatus(plan.status ?? 'ACTIVE');
    setSoldPlanNotes(plan.notes ?? '');
    setError(null);
    setSuccess(null);
    document.getElementById('pet-plan-form-section')?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  }

  function resetTemplateForm() {
    setEditingTemplateId(null);
    setTemplateName('');
    setTemplateDescription('');
    setTemplatePrice('');
    setTemplateValidityDays('30');
    setTemplateTotalSessions('4');
    setTemplateServiceIds([]);
    setTemplateRenewalRules(screenCopy.renewalRulesDefault);
    setTemplateActive(true);
  }

  function beginEditTemplate(template: PlanTemplate) {
    setIsTemplateEditorOpen(true);
    setEditingTemplateId(template.id);
    setTemplateName(template.commercialName);
    setTemplateDescription(template.description ?? '');
    setTemplatePrice(String(template.price));
    setTemplateValidityDays(String(template.validityDays));
    setTemplateTotalSessions(String(template.totalSessions));
    setTemplateServiceIds(template.serviceIds ?? []);
    setTemplateRenewalRules(template.renewalRules ?? '');
    setTemplateActive(template.active);
    document.getElementById('pet-plan-template-form-section')?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  }

  function handlePlanTemplateChange(value: string) {
    setPlanTemplateId(value);
    const template = activeTemplates.find((entry) => entry.id === value);
    if (!template || editingId) {
      return;
    }

    const start = startedAt || new Date().toISOString().slice(0, 10);
    const startDate = new Date(`${start}T00:00:00`);
    startDate.setDate(startDate.getDate() + template.validityDays);
    setStartedAt(start);
    setPlanName(template.commercialName);
    setTotalSessions(String(template.totalSessions));
    setFinalPrice(String(template.price));
    setExpiresAt(startDate.toISOString().slice(0, 10));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingId && !clientId) {
      setError(messages.validation.selectClient);
      return;
    }

    if (!editingId && (!petId || !planTemplateId)) {
      setError(screenCopy.saleNeedsPetAndPlan);
      return;
    }

    const parsed = parseInt(totalSessions, 10);
    if (isNaN(parsed) || parsed < 1) {
      setError(messages.validation.positiveSessions);
      return;
    }

    const parsedFinalPrice = finalPrice.trim() ? Number(finalPrice) : undefined;
    if (finalPrice.trim() && (parsedFinalPrice === undefined || Number.isNaN(parsedFinalPrice) || parsedFinalPrice < 0)) {
      setError(screenCopy.invalidFinalPrice);
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      if (editingId) {
        await petService.updateClientPlan(editingId, {
          planName,
          startedAt: startedAt ? `${startedAt}T00:00:00-03:00` : undefined,
          totalSessions: parsed,
          expiresAt: expiresAt ? `${expiresAt}T23:59:59-03:00` : undefined,
          finalPrice: parsedFinalPrice,
          status: soldPlanStatus,
          notes: soldPlanNotes || undefined
        });
        setSuccess(messages.form.update);
      } else {
        await petService.createClientPlan({
          clientId,
          petId,
          planTemplateId,
          planName,
          startedAt: startedAt ? `${startedAt}T00:00:00-03:00` : undefined,
          totalSessions: parsed,
          expiresAt: expiresAt ? `${expiresAt}T23:59:59-03:00` : undefined,
          finalPrice: parsedFinalPrice,
          status: soldPlanStatus,
          notes: soldPlanNotes || undefined
        });
        setSuccess(messages.form.create);
      }
      resetForm();
      setIsPlanEditorOpen(false);
      await load(0);
    } catch (err) {
      setError(resolveApiErrorMessage(err, messages.feedback.saveError));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTemplateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedPrice = Number(templatePrice);
    const parsedValidity = parseInt(templateValidityDays, 10);
    const parsedSessions = parseInt(templateTotalSessions, 10);

    if (Number.isNaN(parsedPrice) || parsedPrice < 0 || Number.isNaN(parsedValidity) || parsedValidity < 1 || Number.isNaN(parsedSessions) || parsedSessions < 1) {
      setError(screenCopy.invalidCatalogValues);
      return;
    }

    setTemplateSubmitting(true);
    setError(null);
    setSuccess(null);

    const payload = {
      commercialName: templateName,
      description: templateDescription || undefined,
      price: parsedPrice,
      validityDays: parsedValidity,
      totalSessions: parsedSessions,
      serviceIds: templateServiceIds,
      renewalRules: templateRenewalRules || undefined,
      active: templateActive
    };

    try {
      if (editingTemplateId) {
        await petService.updatePlanTemplate(editingTemplateId, payload);
        setSuccess(screenCopy.templateUpdated);
      } else {
        await petService.createPlanTemplate(payload);
        setSuccess(screenCopy.templateCreated);
      }
      resetTemplateForm();
      setIsTemplateEditorOpen(false);
      await loadTemplates();
    } catch (err) {
      setError(resolveApiErrorMessage(err, screenCopy.templateSaveError));
    } finally {
      setTemplateSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteCandidate) return;
    try {
      await petService.deleteClientPlan(deleteCandidate.id);
      setDeleteCandidate(null);
      setSuccess(messages.dialog.confirm);
      await load(0);
    } catch (err) {
      setError(resolveApiErrorMessage(err, messages.feedback.removeError));
    }
  }

  async function handleSaveBillingSettings() {
    setBillingSettingsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const settings = await petService.updateBillingMessageSettings({
        pixKey: billingPixKey,
        billingDisplayName,
        planRenewalMessageTemplate: planRenewalTemplate,
        petReadyMessageTemplate: petReadyTemplate
      });
      setBillingPixKey(settings.pixKey ?? '');
      setBillingDisplayName(settings.billingDisplayName ?? '');
      setPlanRenewalTemplate(settings.planRenewalMessageTemplate ?? '');
      setPetReadyTemplate(settings.petReadyMessageTemplate ?? '');
      setSuccess(messages.messageSetup.settingsUpdated);
    } catch (err) {
      setError(resolveApiErrorMessage(err, messages.messageSetup.settingsError));
    } finally {
      setBillingSettingsSaving(false);
    }
  }

  async function handlePrepareRenewalMessage(plan: ClientPlan) {
    setPreparingRenewalPlanId(plan.id);
    setError(null);
    setPreparedRenewalMessage('');
    setPreparedRenewalCharge(null);

    try {
      const prepared = await petService.preparePlanRenewalMessage(plan.id);
      setPreparedRenewalMessage(prepared.message);
      setPreparedRenewalCharge({
        clientName: prepared.clientName,
        petName: prepared.petName,
        planName: prepared.planName,
        invoiceId: prepared.invoiceId,
        status: prepared.invoiceStatus,
        amount: prepared.invoiceAmount,
        outstandingAmount: prepared.invoiceOutstandingAmount,
        pixKey: prepared.pixKey,
        billingDisplayName: prepared.billingDisplayName
      });
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        // Best-effort copy: a pending or denied clipboard permission must not lock the
        // button, and the prepared message stays on screen with its own copy action.
        void navigator.clipboard.writeText(prepared.message).catch(() => undefined);
      }
      setSuccess(prepared.pixConfigured
        ? messages.messageSetup.renewalPrepared
        : messages.messageSetup.renewalNeedsBilling);
    } catch (err) {
      setError(resolveApiErrorMessage(err, messages.messageSetup.prepareError));
    } finally {
      setPreparingRenewalPlanId(null);
    }
  }

  async function handleDispatchRenewalMessage(plan: ClientPlan) {
    setDispatchingRenewalPlanId(plan.id);
    setError(null);
    setSuccess(null);

    try {
      const dispatch = await petService.dispatchPlanRenewalWhatsApp(plan.id);
      if (dispatch.status === 'SENT') {
        setDispatchedRenewalPlanId(plan.id);
        setSuccess(messages.messageSetup.officialRenewalSuccess.replace('{id}', dispatch.id));
        return;
      }
      setError(dispatch.failureReason ?? messages.messageSetup.officialRenewalFailure);
    } catch (err) {
      setError(resolveApiErrorMessage(err, messages.messageSetup.officialRenewalFailure));
    } finally {
      setDispatchingRenewalPlanId(null);
    }
  }

  async function copyManualRenewalText(value: string, successMessage: string) {
    if (!value) {
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      setSuccess(successMessage);
    }
  }

  function resolveClientName(plan: ClientPlan) {
    const client = clients.find((c) => c.id === plan.clientId);
    return client ? (client.name ?? client.fullName ?? plan.clientId) : plan.clientId;
  }

  function resolveClientEmail(plan: ClientPlan) {
    const client = clients.find((c) => c.id === plan.clientId);
    return client?.email ?? null;
  }

  function resolvePetName(plan: ClientPlan) {
    const pet = pets.find((entry) => entry.id === plan.petId);
    return pet?.name ?? plan.petId ?? screenCopy.petNotLinked;
  }

  function formatCurrency(value?: number | null) {
    return formatCurrencyForLocale(locale, value ?? 0);
  }

  const rows = resolvePageItems(pageData);

  const columns: DataTableColumn<ClientPlan>[] = [
    {
      key: 'client',
      header: messages.form.client,
      render: (plan) => (
        <div>
          <p className="font-medium text-[var(--ink)]">{resolveClientName(plan)}</p>
          <p className="text-xs text-[var(--muted)]">{screenCopy.petLabel} {resolvePetName(plan)}</p>
        </div>
      )
    },
    {
      key: 'planName',
      header: messages.form.planName,
      render: (plan) => (
        <div>
          <p className="text-[var(--ink)]">{plan.planName}</p>
          <p className="ui-mono text-xs text-[var(--muted)]">{formatCurrency(plan.finalPrice)}</p>
          {plan.notes ? (
            <p className="line-clamp-1 max-w-xs text-xs text-[var(--muted)]">{screenCopy.notesLabel} {plan.notes}</p>
          ) : null}
        </div>
      )
    },
    {
      key: 'sessions',
      header: messages.form.totalSessions,
      render: (plan) => {
        const statusKey = resolvePlanStatusKey(plan);
        const isProblematic = statusKey === 'canceled' || statusKey === 'error';
        const isLow = statusKey === 'warn';
        return (
          <div className="whitespace-nowrap">
            <p>
              <span className={`ui-mono text-sm font-semibold ${isProblematic ? 'text-[var(--danger)]' : isLow ? 'text-[var(--warn)]' : 'text-[var(--ink)]'}`}>
                {plan.remainingSessions} {appointmentMessages.columns.leftSuffix}
              </span>
              <span className="ui-mono text-xs text-[var(--muted)]"> / {plan.totalSessions}</span>
            </p>
            <p className="text-xs text-[var(--muted)]">{plan.usedSessions} {messages.columns.used}</p>
          </div>
        );
      }
    },
    {
      key: 'status',
      header: messages.columns.status,
      render: (plan) => (
        <div>
          <StatusBadge status={resolvePlanStatusKey(plan)} />
          <p className="text-xs text-[var(--muted)]">
            {resolveRenewalStateLabel(plan.renewalState, messages.columns.renewalStates)}
          </p>
          {plan.remainingSessions === 2 && !resolveClientEmail(plan) ? (
            <p className="text-xs text-[var(--warn)]">{messages.columns.renewalNeedsEmail}</p>
          ) : null}
        </div>
      )
    },
    {
      key: 'expiry',
      header: messages.form.expiresOn,
      render: (plan) => (
        <span className="ui-mono whitespace-nowrap text-[var(--ink)]">
          {formatExpiryLabel(locale, plan.expiresAt, messages.filters.noExpiry)}
        </span>
      )
    },
    {
      key: 'actions',
      header: messages.columns.actions,
      render: (plan) => (
        <div className="flex flex-wrap gap-2">
          <PermissionGuard permission="pet.plan.create">
            <button type="button" onClick={() => beginEdit(plan)} className="ui-inline-button">
              {commonButtons.edit}
            </button>
          </PermissionGuard>
          <PermissionGuard permission="pet.plan.create">
            <button type="button" onClick={() => setDeleteCandidate(plan)} className="ui-inline-danger-button">
              {commonButtons.remove}
            </button>
          </PermissionGuard>
          {plan.remainingSessions <= 1 ? (
            <button
              type="button"
              onClick={() => void handlePrepareRenewalMessage(plan)}
              className="ui-inline-button"
              disabled={preparingRenewalPlanId === plan.id}
            >
              {preparingRenewalPlanId === plan.id ? messages.messageSetup.preparingRenewal : messages.messageSetup.prepareRenewal}
            </button>
          ) : null}
          {plan.remainingSessions <= 1 && isOfficialWhatsAppEnabled() ? (
            <PermissionGuard permission="pet.plan.read">
              <button
                type="button"
                onClick={() => void handleDispatchRenewalMessage(plan)}
                className="ui-inline-button"
                disabled={dispatchingRenewalPlanId === plan.id}
              >
                {dispatchingRenewalPlanId === plan.id
                  ? messages.messageSetup.officialRenewalSending
                  : messages.messageSetup.officialRenewalSend}
              </button>
            </PermissionGuard>
          ) : null}
          {dispatchedRenewalPlanId === plan.id ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-[var(--ink-2)]">
              <span className="ui-status-dot" data-status="done" aria-hidden="true" />
              {messages.messageSetup.officialRenewalSent}
            </span>
          ) : null}
        </div>
      )
    }
  ];

  return (
    <PermissionGuard
      permission="pet.plan.read"
      fallback={<div className="ui-notice-warning">{messages.noPermission}</div>}
    >
      <div className={sharedPageStackClass}>
        <PetModuleSubnav />

        <PageTitle
          title={messages.title}
          count={loading ? undefined : resolveTotalItems(pageData)}
          description={messages.description}
          actions={canManagePlan ? (
            <button
              type="button"
              onClick={() => {
                resetForm();
                setIsPlanEditorOpen(true);
                document.getElementById('pet-plan-form-section')?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
              }}
              className="ui-primary-button"
            >
              {messages.createPlan}
            </button>
          ) : undefined}
        />

        {error ? <div className="ui-notice-error">{error}</div> : null}
        {success ? <div className="ui-notice-success">{success}</div> : null}

        <PageSection
          title={screenCopy.catalogTitle}
          description={screenCopy.catalogDescription}
          actions={hasPermission('pet.plan.create') ? (
            <button type="button" className="ui-secondary-button" onClick={() => { resetTemplateForm(); setIsTemplateEditorOpen(true); }}>
              {screenCopy.newTemplateTitle}
            </button>
          ) : undefined}
        >
          <div className="divide-y divide-[color:var(--line-soft)]">
            {templates.map((template) => (
              <div key={template.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <div>
                    <p className="font-medium text-[var(--ink)]">{template.commercialName}</p>
                    <p className="mt-1 line-clamp-1 text-xs text-[var(--muted)]">
                      {template.description ?? screenCopy.noDescription}
                    </p>
                  </div>
                  <p className="ui-mono mt-1 text-xs text-[var(--muted)]">
                    {formatCurrency(template.price)} / {template.totalSessions} {screenCopy.sessionsUnit} / {template.validityDays} {screenCopy.daysUnit}
                  </p>
                </div>
                <StatusBadge status={template.active ? 'active' : 'inactive'} />
                <PermissionGuard permission="pet.plan.create">
                  <button type="button" onClick={() => beginEditTemplate(template)} className="ui-inline-button">
                    {screenCopy.editTemplate}
                  </button>
                </PermissionGuard>
              </div>
            ))}
          </div>
        </PageSection>

        <PermissionGuard permission="pet.plan.create">
          <div id="pet-plan-template-form-section">
            {isTemplateEditorOpen ? (
            <form onSubmit={handleTemplateSubmit} className="ui-surface-panel p-4 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {editingTemplateId ? screenCopy.editTemplateTitle : screenCopy.newTemplateTitle}
                </h3>
                <p className="text-xs text-[color:var(--app-shell-muted)] mt-0.5">
                  {screenCopy.templateFormHint}
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <FormInput label={screenCopy.templateName} value={templateName} onChange={setTemplateName} required />
                <FormInput label={screenCopy.price} value={templatePrice} onChange={setTemplatePrice} type="number" required />
                <FormInput label={screenCopy.validityDays} value={templateValidityDays} onChange={setTemplateValidityDays} type="number" required />
                <FormInput label={screenCopy.totalSessions} value={templateTotalSessions} onChange={setTemplateTotalSessions} type="number" required />
                <FormInput label={screenCopy.description} value={templateDescription} onChange={setTemplateDescription} wrapperClassName="lg:col-span-2" />
                <FormInput label={screenCopy.renewalRules} value={templateRenewalRules} onChange={setTemplateRenewalRules} wrapperClassName="lg:col-span-2" />
              </div>
              <fieldset className="border-t border-[color:var(--line)] pt-3">
                <legend className="pr-2 text-sm font-semibold text-[var(--ink)]">
                  {screenCopy.includedServices}
                </legend>
                <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {serviceOptions.map((option) => (
                    <label key={option.value} className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={templateServiceIds.includes(option.value)}
                        onChange={(event) => setTemplateServiceIds((current) => (
                          event.target.checked
                            ? [...current, option.value]
                            : current.filter((id) => id !== option.value)
                        ))}
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
                {serviceOptions.length === 0 ? (
                  <p className="mt-2 text-xs text-[color:var(--app-shell-muted)]">{screenCopy.noActiveServices}</p>
                ) : null}
              </fieldset>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={templateActive} onChange={(event) => setTemplateActive(event.target.checked)} />
                {screenCopy.templateActive}
              </label>
              <div className="flex gap-2">
                <button type="submit" disabled={templateSubmitting} className="ui-primary-button">
                  {templateSubmitting ? screenCopy.saving : editingTemplateId ? screenCopy.updateTemplate : screenCopy.createTemplate}
                </button>
                <button type="button" onClick={() => { resetTemplateForm(); setIsTemplateEditorOpen(false); }} className="ui-secondary-button">
                    {screenCopy.cancelEdit}
                </button>
              </div>
            </form>
            ) : null}
          </div>
        </PermissionGuard>

        {preparedRenewalMessage ? (
          <section
            id="pet-plan-renewal-charge"
            aria-labelledby="pet-plan-renewal-charge-title"
            className="space-y-3 rounded-md border border-[color:var(--line)] p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="pet-plan-renewal-charge-title" className="text-sm font-semibold text-[var(--ink)]">
                  {messages.messageSetup.pendingTitle}
                </h2>
                <p className="mt-0.5 text-xs text-[var(--muted)]">{messages.messageSetup.pendingDescription}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="ui-secondary-button"
                  onClick={() => void copyManualRenewalText(preparedRenewalMessage, messages.messageSetup.messageCopied)}
                >
                  {messages.messageSetup.copyMessage}
                </button>
                {preparedRenewalCharge?.pixKey ? (
                  <button
                    type="button"
                    className="ui-secondary-button"
                    onClick={() => void copyManualRenewalText(preparedRenewalCharge.pixKey ?? '', messages.messageSetup.pixCopied)}
                  >
                    {messages.messageSetup.copyPix}
                  </button>
                ) : null}
              </div>
            </div>
            {preparedRenewalCharge ? (
              <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 xl:grid-cols-3">
                {[
                  [screenCopy.plan, preparedRenewalCharge.planName || screenCopy.planMissing],
                  [screenCopy.client, preparedRenewalCharge.clientName || screenCopy.clientMissing],
                  [screenCopy.pet, preparedRenewalCharge.petName || screenCopy.petMissing],
                  [screenCopy.amount, formatCurrency(preparedRenewalCharge.outstandingAmount ?? preparedRenewalCharge.amount ?? 0)],
                  [screenCopy.pixKey, preparedRenewalCharge.pixKey || screenCopy.pixKeyMissing],
                  [screenCopy.billingName, preparedRenewalCharge.billingDisplayName || screenCopy.billingNameMissing]
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-[var(--muted)]">{label}</dt>
                    <dd className="break-all text-[var(--ink)]">{value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            {preparedRenewalCharge?.invoiceId ? (
              <p className="text-xs text-[var(--muted)]">
                {screenCopy.linkedInvoice} <span className="ui-mono">{preparedRenewalCharge.invoiceId}</span>
                {preparedRenewalCharge.status ? <> · {preparedRenewalCharge.status}</> : null}
              </p>
            ) : null}
            <FormTextarea
              label={messages.messageSetup.preparedRenewalLabel}
              value={preparedRenewalMessage}
              onChange={setPreparedRenewalMessage}
              rows={6}
            />
          </section>
        ) : null}

        <DataTable
          columns={columns}
          rows={rows}
          getRowKey={(row) => row.id}
          loading={loading}
          loadingTitle={messages.loadingTitle}
          loadingDescription={messages.loadingDescription}
          emptyState={{
            title: messages.emptyTitle,
            description: messages.emptyDescription,
            action: canManagePlan ? (
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setIsPlanEditorOpen(true);
                  document.getElementById('pet-plan-form-section')?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
                }}
                className="ui-primary-button"
              >
                {messages.firstPlan}
              </button>
            ) : undefined
          }}
        />

        <Pagination
          page={pageData.page}
          totalPages={pageData.totalPages}
          totalElements={resolveTotalItems(pageData)}
          pageSize={pageSize}
          onPageChange={(nextPage) => load(nextPage)}
        />

        <div id="pet-plan-form-section">
          {isPlanEditorOpen ? (
          <PermissionGuard permission="pet.plan.create">
            <form onSubmit={handleSubmit} className="ui-surface-panel p-4 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {editingId ? messages.form.editTitle : messages.form.createTitle}
                </h3>
                <p className="text-xs text-[color:var(--app-shell-muted)] mt-0.5">
                  {editingId
                    ? messages.form.editDescription
                    : messages.form.createDescription}
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <FormSelect
                  label={messages.form.client}
                  value={clientId}
                  options={formClientOptions}
                  onChange={(value) => {
                    setClientId(value);
                    setPetId('');
                  }}
                  disabled={!!editingId || !canReadClients}
                />
                <FormSelect
                  label={screenCopy.pet}
                  value={petId}
                  options={formPetOptions}
                  onChange={setPetId}
                  disabled={!!editingId || !canReadPets}
                />
                <FormSelect
                  label={screenCopy.catalogPlan}
                  value={planTemplateId}
                  options={templateOptions}
                  onChange={handlePlanTemplateChange}
                  disabled={!!editingId}
                />
                <FormInput
                  label={messages.form.planName}
                  value={planName}
                  onChange={setPlanName}
                  placeholder={messages.columns.planNamePlaceholder}
                  required
                />
                <FormInput
                  label={messages.form.totalSessions}
                  value={totalSessions}
                  onChange={setTotalSessions}
                  type="number"
                  placeholder="10"
                  required
                />
                <FormInput
                  label={screenCopy.startDate}
                  value={startedAt}
                  onChange={setStartedAt}
                  type="date"
                />
                <FormInput
                  label={messages.form.expiresOn}
                  value={expiresAt}
                  onChange={setExpiresAt}
                  type="date"
                />
                <FormInput
                  label={screenCopy.finalPrice}
                  value={finalPrice}
                  onChange={setFinalPrice}
                  type="number"
                />
                <FormSelect
                  label={screenCopy.status}
                  value={soldPlanStatus}
                  options={buildSoldPlanStatusOptions(screenCopy)}
                  onChange={setSoldPlanStatus}
                />
                <FormTextarea
                  label={screenCopy.notes}
                  value={soldPlanNotes}
                  onChange={setSoldPlanNotes}
                  rows={3}
                  wrapperClassName="md:col-span-2 lg:col-span-4"
                />
              </div>

              {selectedTemplate ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  {screenCopy.saleBasedOn} {selectedTemplate.commercialName}: {selectedTemplate.totalSessions} {screenCopy.saleSessionsValidity} {selectedTemplate.validityDays} {screenCopy.saleDaysPrice} {formatCurrency(selectedTemplate.price)}.
                </div>
              ) : null}

              <div className="flex gap-2">
                <button type="submit" disabled={submitting} className="ui-primary-button">
                  {submitting ? messages.form.save : editingId ? messages.form.update : messages.form.create}
                </button>
                <button type="button" onClick={() => { resetForm(); setIsPlanEditorOpen(false); }} className="ui-secondary-button">
                    {messages.form.cancel}
                </button>
              </div>
            </form>
          </PermissionGuard>
          ) : null}
        </div>

        <details className="rounded-md border border-[color:var(--line)]">
          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-[var(--ink)]">
            {messages.messageSetup.title}
          </summary>
          <div className="space-y-4 border-t border-[color:var(--line)] p-4">
            <p className="text-xs text-[var(--muted)]">{messages.messageSetup.description}</p>
          <div className="grid gap-4 md:grid-cols-2">
            <FormInput
              label={messages.messageSetup.pixKey}
              value={billingPixKey}
              onChange={setBillingPixKey}
              placeholder="pix@petshop.com.br"
              disabled={billingSettingsLoading}
            />
            <FormInput
              label={messages.messageSetup.billingDisplayName}
              value={billingDisplayName}
              onChange={setBillingDisplayName}
              placeholder={screenCopy.billingNamePlaceholder}
              disabled={billingSettingsLoading}
            />
            <FormTextarea
              label={messages.messageSetup.renewalTemplate}
              value={planRenewalTemplate}
              onChange={setPlanRenewalTemplate}
              placeholder={screenCopy.renewalTemplateHint}
              rows={4}
              disabled={billingSettingsLoading}
            />
            <FormTextarea
              label={messages.messageSetup.pickupTemplate}
              value={petReadyTemplate}
              onChange={setPetReadyTemplate}
              placeholder={screenCopy.pickupTemplateHint}
              rows={4}
              disabled={billingSettingsLoading}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <PermissionGuard permission="pet.plan.create">
              <button
                type="button"
                onClick={() => void handleSaveBillingSettings()}
                className="ui-primary-button"
                disabled={billingSettingsSaving}
              >
                {billingSettingsSaving ? messages.messageSetup.saving : messages.messageSetup.save}
              </button>
            </PermissionGuard>
            <p className="text-sm text-[color:var(--app-shell-muted)]">
              {messages.messageSetup.manualNotice}
            </p>
          </div>
          </div>
        </details>

        <ConfirmDialog
          open={Boolean(deleteCandidate)}
          title={messages.dialog.title}
          description={deleteCandidate ? messages.dialog.description.replace('{name}', deleteCandidate.planName) : undefined}
          confirmLabel={messages.dialog.confirm}
          onCancel={() => setDeleteCandidate(null)}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </PermissionGuard>
  );
}
