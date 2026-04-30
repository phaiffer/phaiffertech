'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import {
  sharedFilterToolbarClass,
  sharedFormActionsClass,
  sharedInlineActionsClass,
  sharedPageStackClass
} from '@/shared/components/public-visual-system';
import { MetricGrid } from '@/shared/dashboard/metric-grid';
import { ApiClientError } from '@/shared/lib/http';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { useFrontendPlatform } from '@/shared/platform/use-frontend-platform';
import { petService } from '@/shared/services/pet-service';
import { PageResponse } from '@/shared/types/common';
import { DashboardSummaryCard } from '@/shared/types/dashboard';
import { PetProduct, PetServiceCatalog, PetServiceCategory } from '@/shared/types/pet';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { FormInput } from '@/shared/ui/form-input';
import { FormSelect } from '@/shared/ui/form-select';
import { PageSection } from '@/shared/ui/page-section';
import { PageTitle } from '@/shared/ui/page-title';
import { Pagination } from '@/shared/ui/pagination';
import { SearchBar } from '@/shared/ui/search-bar';
import {
  describePetServiceCatalogItem,
  formatPetServiceCategory,
  resolveAllowedPetServiceCategories,
  resolvePetServiceBookingMode
} from '@/modules/pet/pet-service-catalog-policy';

const pageSize = 10;

const initialPage: PageResponse<PetServiceCatalog> = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: pageSize
};

type ServiceInventoryLinkFormState = {
  inventoryItemId: string;
  inventoryItemName?: string;
  inventoryItemSku?: string | null;
  unitOfMeasure?: string;
  expectedQuantity: string;
  consumptionRule: 'FIXED_PER_SERVICE';
  active: boolean;
};

const defaultInventoryRule: ServiceInventoryLinkFormState['consumptionRule'] = 'FIXED_PER_SERVICE';

function formatExpectedQuantity(quantity: number) {
  return Number.isInteger(quantity) ? String(quantity) : quantity.toFixed(2).replace(/\.?0+$/, '');
}

function formatInventoryLinkSummary(service: Pick<PetServiceCatalog, 'inventoryLinks'>) {
  const activeLinks = service.inventoryLinks.filter((link) => link.active);
  if (activeLinks.length === 0) {
    return 'No planned stock usage';
  }

  const preview = activeLinks
    .slice(0, 2)
    .map((link) => `${link.inventoryItemName} x${formatExpectedQuantity(link.expectedQuantity)} ${link.unitOfMeasure}`)
    .join(' • ');

  return activeLinks.length > 2
    ? `${preview} • +${activeLinks.length - 2} more`
    : preview;
}

function ServiceFlagToggle({
  label,
  description,
  checked,
  onChange
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel-muted)] px-4 py-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-[color:var(--app-shell-border)]"
      />
      <span className="space-y-1">
        <span className="block text-sm font-medium text-[color:var(--app-shell-heading)]">{label}</span>
        <span className="block text-xs leading-5 text-[color:var(--app-shell-muted)]">{description}</span>
      </span>
    </label>
  );
}

function buildServiceAvailabilityLabel(service: Pick<PetServiceCatalog, 'allowInPlans' | 'allowStandaloneBooking'>) {
  switch (resolvePetServiceBookingMode(service)) {
    case 'PLAN_ONLY':
      return 'Somente sessoes de plano';
    case 'STANDALONE_ONLY':
      return 'Somente atendimento avulso';
    case 'UNAVAILABLE':
      return 'Indisponivel para novos atendimentos';
    default:
      return 'Avulso e plano habilitados';
  }
}

export function PetServicesPage() {
  const platform = useFrontendPlatform();
  const allowedCategories = useMemo(
    () => resolveAllowedPetServiceCategories(platform.user),
    [platform.user]
  );
  const defaultCategory = allowedCategories[0] ?? 'GROOMING';

  const [pageData, setPageData] = useState<PageResponse<PetServiceCatalog>>(initialPage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [products, setProducts] = useState<PetProduct[]>([]);
  const [productsLookupError, setProductsLookupError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<PetServiceCategory>(defaultCategory);
  const [active, setActive] = useState(true);
  const [basePrice, setBasePrice] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [commissionEligible, setCommissionEligible] = useState(true);
  const [allowInPlans, setAllowInPlans] = useState(true);
  const [allowStandaloneBooking, setAllowStandaloneBooking] = useState(true);
  const [inventoryLinks, setInventoryLinks] = useState<ServiceInventoryLinkFormState[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [deleteCandidate, setDeleteCandidate] = useState<PetServiceCatalog | null>(null);

  const load = useCallback(async (
    page: number,
    currentSearch: string,
    currentCategoryFilter: string,
    currentActiveFilter: 'all' | 'active' | 'inactive'
  ) => {
    setLoading(true);
    setError(null);
    try {
      const result = await petService.listServices(page, pageSize, currentSearch, {
        category: currentCategoryFilter ? currentCategoryFilter as PetServiceCategory : undefined,
        active: currentActiveFilter === 'all' ? undefined : currentActiveFilter === 'active'
      });
      setPageData(result);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Nao foi possivel carregar o catalogo PetFlow.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(0, search, categoryFilter, activeFilter);
  }, [activeFilter, categoryFilter, load, search]);

  const loadProducts = useCallback(async () => {
    try {
      const result = await petService.listProducts(0, 200, '');
      setProducts(resolvePageItems(result));
      setProductsLookupError(null);
    } catch (err) {
      setProducts([]);
      setProductsLookupError(err instanceof ApiClientError ? err.message : 'Unable to load products for inventory linking.');
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    if (editingId) {
      return;
    }

    if (!allowedCategories.includes(category)) {
      setCategory(defaultCategory);
    }
  }, [allowedCategories, category, defaultCategory, editingId]);

  function resetForm() {
    setEditingId(null);
    setName('');
    setDescription('');
    setCategory(defaultCategory);
    setActive(true);
    setBasePrice('');
    setDurationMinutes('60');
    setCommissionEligible(true);
    setAllowInPlans(true);
    setAllowStandaloneBooking(true);
    setInventoryLinks([]);
  }

  function scrollToServiceForm() {
    document.getElementById('pet-service-form-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function beginCreateService() {
    resetForm();
    scrollToServiceForm();
  }

  function beginEdit(item: PetServiceCatalog) {
    setEditingId(item.id);
    setName(item.name);
    setDescription(item.description ?? '');
    setCategory(item.category);
    setActive(item.active);
    setBasePrice(String(item.basePrice));
    setDurationMinutes(String(item.durationMinutes));
    setCommissionEligible(item.commissionEligible);
    setAllowInPlans(item.allowInPlans);
    setAllowStandaloneBooking(item.allowStandaloneBooking);
    setInventoryLinks(item.inventoryLinks.map((link) => ({
      inventoryItemId: link.inventoryItemId,
      inventoryItemName: link.inventoryItemName,
      inventoryItemSku: link.inventoryItemSku ?? undefined,
      unitOfMeasure: link.unitOfMeasure,
      expectedQuantity: formatExpectedQuantity(link.expectedQuantity),
      consumptionRule: link.consumptionRule,
      active: link.active
    })));
    setError(null);
    setSuccess(null);
    scrollToServiceForm();
  }

  function handleAddInventoryLink() {
    setInventoryLinks((current) => [
      ...current,
      {
        inventoryItemId: '',
        expectedQuantity: '1',
        consumptionRule: defaultInventoryRule,
        active: true
      }
    ]);
  }

  function handleInventoryLinkChange(
    index: number,
    updates: Partial<ServiceInventoryLinkFormState>
  ) {
    setInventoryLinks((current) => current.map((link, currentIndex) => {
      if (currentIndex !== index) {
        return link;
      }

      const next = { ...link, ...updates };
      if (updates.inventoryItemId !== undefined) {
        const selectedProduct = products.find((product) => product.inventoryItemId === updates.inventoryItemId);
        next.inventoryItemName = selectedProduct?.name ?? link.inventoryItemName;
        next.inventoryItemSku = selectedProduct?.sku ?? link.inventoryItemSku;
        next.unitOfMeasure = selectedProduct?.unitOfMeasure ?? link.unitOfMeasure;
      }
      return next;
    }));
  }

  function handleRemoveInventoryLink(index: number) {
    setInventoryLinks((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const parsedBasePrice = Number(basePrice);
    const parsedDuration = Number(durationMinutes);
    if (Number.isNaN(parsedBasePrice) || Number.isNaN(parsedDuration) || parsedDuration < 1) {
      setError('Informe preco base e duracao validos.');
      return;
    }

    if (active && !allowInPlans && !allowStandaloneBooking) {
      setError('Servicos ativos precisam permitir agendamento avulso ou por plano.');
      return;
    }

    const parsedInventoryLinks = inventoryLinks.map((link) => ({
      ...link,
      expectedQuantityNumber: Number(link.expectedQuantity)
    }));

    if (parsedInventoryLinks.some((link) => !link.inventoryItemId || Number.isNaN(link.expectedQuantityNumber) || link.expectedQuantityNumber <= 0)) {
      setError('Select an inventory item and enter a positive quantity for every linked recipe line.');
      return;
    }

    const selectedInventoryIds = parsedInventoryLinks.map((link) => link.inventoryItemId);
    if (new Set(selectedInventoryIds).size !== selectedInventoryIds.length) {
      setError('A service recipe cannot repeat the same inventory item.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        name,
        description: description || undefined,
        category,
        active,
        basePrice: parsedBasePrice,
        durationMinutes: parsedDuration,
        commissionEligible,
        allowInPlans,
        allowStandaloneBooking,
        inventoryLinks: parsedInventoryLinks.map((link) => ({
          inventoryItemId: link.inventoryItemId,
          expectedQuantity: link.expectedQuantityNumber,
          consumptionRule: link.consumptionRule,
          active: link.active
        }))
      };

      if (editingId) {
        await petService.updateService(editingId, payload);
        setSuccess('Servico atualizado.');
      } else {
        await petService.createService(payload);
        setSuccess('Servico criado.');
      }

      resetForm();
      await load(pageData.page, search, categoryFilter, activeFilter);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Nao foi possivel salvar o servico.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteCandidate) {
      return;
    }

    try {
      await petService.deleteService(deleteCandidate.id);
      setDeleteCandidate(null);
      setSuccess('Servico removido.');
      await load(pageData.page, search, categoryFilter, activeFilter);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Nao foi possivel excluir o servico selecionado.');
    }
  }

  const rows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);
  const activeFilterCount = [search, categoryFilter, activeFilter !== 'all' ? activeFilter : ''].filter(Boolean).length;
  const activeServices = rows.filter((item) => item.active).length;
  const planReadyServices = rows.filter((item) => item.allowInPlans).length;
  const averageDuration = rows.length > 0
    ? Math.round(rows.reduce((total, item) => total + item.durationMinutes, 0) / rows.length)
    : 0;
  const averageBasePrice = rows.length > 0
    ? Math.round(rows.reduce((total, item) => total + item.basePrice, 0) / rows.length)
    : 0;
  const parsedDraftBasePrice = Number(basePrice);
  const parsedDraftDuration = Number(durationMinutes);
  const activeSchedulingConflict = active && !allowInPlans && !allowStandaloneBooking;
  const inventoryOptions = useMemo(() => {
    const knownOptions = products.map((product) => ({
      value: product.inventoryItemId,
      label: `${product.name} (${product.sku})`
    }));
    const fallbackOptions = inventoryLinks
      .filter((link) => link.inventoryItemId && !products.some((product) => product.inventoryItemId === link.inventoryItemId))
      .map((link) => ({
        value: link.inventoryItemId,
        label: link.inventoryItemName
          ? (link.inventoryItemSku ? `${link.inventoryItemName} (${link.inventoryItemSku})` : link.inventoryItemName)
          : `Linked item ${link.inventoryItemId}`
      }));

    return [
      { value: '', label: 'Select an inventory item' },
      ...knownOptions,
      ...fallbackOptions
    ];
  }, [inventoryLinks, products]);
  const activeInventoryLinks = inventoryLinks.filter((link) => link.inventoryItemId && link.active);
  const inventoryPreview = activeInventoryLinks.length > 0
    ? activeInventoryLinks
      .map((link) => {
        const itemLabel = link.inventoryItemName
          ?? products.find((product) => product.inventoryItemId === link.inventoryItemId)?.name
          ?? 'Linked inventory item';
        const unit = link.unitOfMeasure
          ?? products.find((product) => product.inventoryItemId === link.inventoryItemId)?.unitOfMeasure
          ?? 'UNIT';
        return `${itemLabel} x${link.expectedQuantity || '0'} ${unit}`;
      })
      .join(' • ')
    : 'No planned inventory consumption.';
  const draftServicePreview = describePetServiceCatalogItem({
    id: editingId ?? 'draft-service',
    name: name.trim() || 'Servico em preparo',
    description: description.trim() || undefined,
    category,
    active,
    basePrice: Number.isFinite(parsedDraftBasePrice) ? parsedDraftBasePrice : 0,
    durationMinutes: Number.isFinite(parsedDraftDuration) && parsedDraftDuration > 0 ? parsedDraftDuration : 0,
    commissionEligible,
    allowInPlans,
    allowStandaloneBooking,
    inventoryLinks: [],
    createdAt: '',
    updatedAt: ''
  }, 'en-US');
  const draftAvailabilityLabel = buildServiceAvailabilityLabel({ allowInPlans, allowStandaloneBooking });

  const summaryCards: DashboardSummaryCard[] = [
    {
      key: 'services-in-scope',
      label: 'Catalogo visivel',
      value: totalItems,
      trend: activeFilterCount > 0
        ? 'Recorte atual do catalogo usado na agenda.'
        : 'Servicos disponiveis para demonstrar banho e tosa.'
    },
    {
      key: 'active-services',
      label: 'Ativos para agenda',
      value: activeServices,
      trend: 'Somente servicos ativos entram em novos atendimentos.'
    },
    {
      key: 'plan-ready-services',
      label: 'Aceitam plano',
      value: planReadyServices,
      trend: 'Base para pacotes recorrentes de banho e tosa.'
    },
    {
      key: 'average-service-duration',
      label: 'Duracao media',
      value: averageDuration,
      trend: `Ticket base medio visivel: R$ ${averageBasePrice}.`
    }
  ];

  const categoryOptions = allowedCategories.map((value) => ({
    value,
    label: formatPetServiceCategory(value)
  }));

  const filterCategoryOptions = [
    { value: '', label: 'Todas as categorias' },
    ...categoryOptions
  ];

  const activeFilterOptions = [
    { value: 'all', label: 'Todos os status' },
    { value: 'active', label: 'Somente ativos' },
    { value: 'inactive', label: 'Somente inativos' }
  ];

  const columns: DataTableColumn<PetServiceCatalog>[] = [
    {
      key: 'service',
      header: 'Servico',
      render: (item) => (
        <div>
          <p className="font-medium text-slate-900">{item.name}</p>
          <p className="mt-1 text-sm text-[color:var(--app-shell-muted)]">
            {item.description ?? 'Sem resumo operacional cadastrado.'}
          </p>
        </div>
      )
    },
    {
      key: 'category',
      header: 'Categoria',
      render: (item) => (
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-900">{formatPetServiceCategory(item.category)}</p>
          <p className="text-xs text-[color:var(--app-shell-muted)]">
            {item.active ? 'Ativo para novos atendimentos' : 'Inativo para novos atendimentos'}
          </p>
        </div>
      )
    },
    {
      key: 'basePrice',
      header: 'Preco base',
      render: (item) => item.basePrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    },
    {
      key: 'durationMinutes',
      header: 'Duracao',
      render: (item) => `${item.durationMinutes} min`
    },
    {
      key: 'bookingRules',
      header: 'Uso na agenda',
      render: (item) => (
        <div className="space-y-1 text-xs text-[color:var(--app-shell-muted)]">
          <p>{item.allowStandaloneBooking ? 'Pode ser avulso' : 'Exige plano vinculado'}</p>
          <p>{item.allowInPlans ? 'Pode consumir sessoes de plano' : 'Somente atendimento avulso'}</p>
          <p>{item.commissionEligible ? 'Gera comissao' : 'Fora da comissao'}</p>
        </div>
      )
    },
    {
      key: 'inventoryRecipe',
      header: 'Inventory recipe',
      render: (item) => (
        <div className="space-y-1 text-xs text-[color:var(--app-shell-muted)]">
          <p className="font-medium text-slate-900">
            {item.inventoryLinks.filter((link) => link.active).length} active linked item(s)
          </p>
          <p>{formatInventoryLinkSummary(item)}</p>
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Acoes',
      render: (item) => (
        <div className={sharedInlineActionsClass}>
          <PermissionGuard permission="pet.service.update">
            <button
              type="button"
              onClick={() => beginEdit(item)}
              className="ui-inline-button"
            >
              Editar
            </button>
          </PermissionGuard>
          <PermissionGuard permission="pet.service.delete">
            <button
              type="button"
              onClick={() => setDeleteCandidate(item)}
              className="ui-inline-danger-button"
            >
              Excluir
            </button>
          </PermissionGuard>
        </div>
      )
    }
  ];

  return (
    <PermissionGuard
      permission="pet.service.read"
      fallback={<div className="ui-notice-warning">Voce nao tem permissao para visualizar o catalogo de servicos do PetFlow.</div>}
    >
      <div className={sharedPageStackClass}>
        <PageTitle
          eyebrow="PetFlow workspace"
          title="Catalogo de Banho e Tosa"
          description="Estruture banho, tosa, servicos combinados e itens clinicos disponiveis no pacote contratado, com preco, duracao, plano e regra de comissao claros para a agenda."
          actions={(
            <PermissionGuard permission="pet.service.create">
              <button type="button" onClick={beginCreateService} className="ui-primary-button">
                Novo servico
              </button>
            </PermissionGuard>
          )}
        />

        <MetricGrid cards={summaryCards} columns="md:grid-cols-2 xl:grid-cols-4" />

        <PageSection
          tone="muted"
          title="Filtros do catalogo"
          description="Encontre rapidamente o servico certo para montar um atendimento de banho e tosa durante a demo."
        >
          <div className={sharedFilterToolbarClass}>
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1.45fr)_repeat(2,minmax(0,0.9fr))] xl:items-end">
              <SearchBar
                label="Busca"
                value={searchInput}
                onChange={setSearchInput}
                placeholder="Nome do servico ou resumo"
              />
              <FormSelect
                label="Categoria"
                value={categoryFilter}
                options={filterCategoryOptions}
                onChange={setCategoryFilter}
              />
              <FormSelect
                label="Status"
                value={activeFilter}
                options={activeFilterOptions}
                onChange={(value) => setActiveFilter(value as 'all' | 'active' | 'inactive')}
              />
            </div>
            <div className={sharedFormActionsClass}>
              <button
                type="button"
                onClick={() => setSearch(searchInput)}
                className="ui-primary-button"
              >
                Buscar
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setSearch('');
                  setCategoryFilter('');
                  setActiveFilter('all');
                }}
                className="ui-secondary-button"
              >
                Limpar
              </button>
              <p className="text-sm text-[color:var(--app-shell-muted)]">
                {activeFilterCount > 0
                  ? 'Catalogo filtrado para o recorte operacional da demo.'
                  : 'Sem filtros ativos. Exibindo o mix completo de servicos.'}
              </p>
            </div>
          </div>
        </PageSection>

        <PermissionGuard permission={editingId ? 'pet.service.update' : 'pet.service.create'}>
          <div id="pet-service-form-section">
            <PageSection
              title={editingId ? 'Editar servico' : 'Criar servico'}
              description="Cadastre a definicao que a agenda usa: categoria, status, duracao, preco base, plano e regra de comissao."
            >
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-4 xl:grid-cols-2">
                  <FormInput label="Nome" value={name} onChange={setName} required />
                  <FormSelect label="Categoria" value={category} options={categoryOptions} onChange={(value) => setCategory(value as PetServiceCategory)} />
                  <FormInput label="Preco base" value={basePrice} onChange={setBasePrice} type="number" required />
                  <FormInput label="Duracao (min)" value={durationMinutes} onChange={setDurationMinutes} type="number" required />
                  <FormInput label="Resumo operacional" value={description} onChange={setDescription} wrapperClassName="xl:col-span-2" />
                </div>

                <div className="grid gap-3 xl:grid-cols-2">
                  <ServiceFlagToggle
                    label="Ativo para agenda"
                    description="Servicos inativos ficam no historico, mas nao entram em novos atendimentos."
                    checked={active}
                    onChange={setActive}
                  />
                  <ServiceFlagToggle
                    label="Gera comissao"
                    description="Mostra na demo quais servicos entram no fechamento de producao da equipe."
                    checked={commissionEligible}
                    onChange={setCommissionEligible}
                  />
                  <ServiceFlagToggle
                    label="Permitido em planos"
                    description="Use para banho recorrente, pacotes mensais e sessoes pre-pagas."
                    checked={allowInPlans}
                    onChange={setAllowInPlans}
                  />
                  <ServiceFlagToggle
                    label="Permitido como avulso"
                    description="Use quando o servico pode ser vendido fora de um plano recorrente."
                    checked={allowStandaloneBooking}
                    onChange={setAllowStandaloneBooking}
                  />
                </div>

                <div className="rounded-2xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel-muted)] px-4 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--app-shell-muted)]">
                        Inventory recipe
                      </p>
                      <p className="mt-2 text-sm text-[color:var(--app-shell-muted)]">
                        Link the products or materials this service is expected to consume. This first step is read-only and keeps current stock flows stable.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddInventoryLink}
                      disabled={Boolean(productsLookupError)}
                      className="ui-secondary-button"
                    >
                      Add linked item
                    </button>
                  </div>

                  {productsLookupError ? (
                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                      {productsLookupError}
                    </div>
                  ) : null}

                  {inventoryLinks.length > 0 ? (
                    <div className="mt-4 space-y-3">
                      {inventoryLinks.map((link, index) => (
                        <div
                          key={`${link.inventoryItemId || 'draft'}-${index}`}
                          className="rounded-xl border border-[color:var(--app-shell-border)] bg-white/80 px-3 py-3"
                        >
                          <div className="grid gap-3 xl:grid-cols-[minmax(0,1.5fr)_180px_auto] xl:items-end">
                            <FormSelect
                              label="Inventory item"
                              value={link.inventoryItemId}
                              options={inventoryOptions}
                              onChange={(value) => handleInventoryLinkChange(index, { inventoryItemId: value })}
                              disabled={Boolean(productsLookupError)}
                            />
                            <FormInput
                              label="Qty per service"
                              value={link.expectedQuantity}
                              onChange={(value) => handleInventoryLinkChange(index, { expectedQuantity: value })}
                              type="number"
                              step="0.01"
                              min="0.01"
                            />
                            <div className="flex gap-2 xl:justify-end">
                              <label className="flex items-center gap-2 text-sm text-[color:var(--app-shell-muted)]">
                                <input
                                  type="checkbox"
                                  checked={link.active}
                                  onChange={(event) => handleInventoryLinkChange(index, { active: event.target.checked })}
                                  className="h-4 w-4 rounded border-[color:var(--app-shell-border)]"
                                />
                                Active
                              </label>
                              <button
                                type="button"
                                onClick={() => handleRemoveInventoryLink(index)}
                                className="ui-inline-button"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                          <p className="mt-2 text-xs text-[color:var(--app-shell-muted)]">
                            {link.inventoryItemName
                              ? `${link.inventoryItemName}${link.inventoryItemSku ? ` (${link.inventoryItemSku})` : ''}`
                              : 'Pick a product or material from the current inventory catalog.'}
                            {link.unitOfMeasure ? ` • Unit ${link.unitOfMeasure}` : ''}
                            {link.active ? ' • Visible in appointment consumption previews.' : ' • Stored but hidden from appointment previews until reactivated.'}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 text-xs text-[color:var(--app-shell-muted)]">
                      Leave this empty for services that do not need planned stock visibility yet.
                    </p>
                  )}
                </div>

                <div className={`rounded-2xl border px-4 py-3 ${
                  activeSchedulingConflict
                    ? 'border-amber-200 bg-amber-50'
                    : 'border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel-muted)]'
                }`}>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--app-shell-muted)]">
                    Previa para a agenda
                  </p>
                  <p className="mt-2 text-sm font-medium text-[color:var(--app-shell-heading)]">
                    {draftServicePreview}
                  </p>
                  <div className="mt-3 grid gap-2 text-xs text-[color:var(--app-shell-muted)] xl:grid-cols-2">
                    <p>Categoria: {formatPetServiceCategory(category)}</p>
                    <p>Status: {active ? 'Ativo para novos atendimentos' : 'Oculto de novos atendimentos'}</p>
                    <p>Uso: {draftAvailabilityLabel}</p>
                    <p>{commissionEligible ? 'Entra na comissao' : 'Fora da comissao'}</p>
                    <p>Category: {formatPetServiceCategory(category)}</p>
                    <p>Status: {active ? 'Active for new appointments' : 'Hidden from new appointments'}</p>
                    <p>Scheduling mode: {draftAvailabilityLabel}</p>
                    <p>{commissionEligible ? 'Commission ready' : 'Commission excluded'}</p>
                    <p className="xl:col-span-2">Inventory preview: {inventoryPreview}</p>
                  </div>
                  <p className={`mt-3 text-xs ${activeSchedulingConflict ? 'text-amber-800' : 'text-[color:var(--app-shell-muted)]'}`}>
                    {activeSchedulingConflict
                      ? 'Servicos ativos precisam de pelo menos um caminho de agendamento habilitado.'
                      : active
                        ? 'Esta previa corresponde ao que o operador ve ao montar um atendimento.'
                        : 'Servicos inativos ficam disponiveis apenas para leitura historica e edicoes seguras.'}
                  </p>
                </div>

                <div className={sharedFormActionsClass}>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="ui-primary-button"
                  >
                    {submitting ? 'Salvando...' : editingId ? 'Atualizar servico' : 'Criar servico'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="ui-secondary-button"
                  >
                    {editingId ? 'Cancelar edicao' : 'Limpar formulario'}
                  </button>
                </div>
              </form>
            </PageSection>
          </div>
        </PermissionGuard>

        {error ? <div className="ui-notice-error">{error}</div> : null}
        {success ? <div className="ui-notice-success">{success}</div> : null}

        <PageSection
          title="Catalogo operacional"
          description="Revise o mix que sera usado para explicar preco, duracao, profissional, plano e comissao no fluxo de banho e tosa."
          actions={<p className="text-sm text-[color:var(--app-shell-muted)]">Total {totalItems} servico(s)</p>}
        >
          <div className="space-y-5">
            <DataTable
              columns={columns}
              rows={rows}
              getRowKey={(row) => row.id}
              loading={loading}
              loadingTitle="Carregando catalogo"
              loadingDescription="Preparando servicos com categoria, regra de agendamento e preco."
              emptyState={{
                title: 'Nenhum servico encontrado',
                description: activeFilterCount > 0
                  ? 'Ajuste os filtros ou cadastre um servico para manter a demo pronta.'
                  : 'Crie o primeiro servico para que a agenda, os planos e a comissao fiquem estruturados.',
                action: (
                  <PermissionGuard permission="pet.service.create">
                    <button type="button" onClick={beginCreateService} className="ui-primary-button">
                      Criar primeiro servico
                    </button>
                  </PermissionGuard>
                )
              }}
            />

            <Pagination
              page={pageData.page}
              totalPages={pageData.totalPages}
              totalElements={totalItems}
              onPageChange={(page) => void load(page, search, categoryFilter, activeFilter)}
            />
          </div>
        </PageSection>

        <ConfirmDialog
          open={deleteCandidate !== null}
          title="Excluir servico?"
          description={deleteCandidate ? `O servico "${describePetServiceCatalogItem(deleteCandidate, 'pt-BR')}" sera removido do catalogo.` : undefined}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteCandidate(null)}
        />
      </div>
    </PermissionGuard>
  );
}
