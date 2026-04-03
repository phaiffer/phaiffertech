'use client';

import { useCallback, useEffect, useState } from 'react';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { petCommercialPermissions } from '@/shared/auth/pet-commercial-permissions';
import { ApiClientError } from '@/shared/lib/http';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import {
  petCommercialService,
  type CreatePetCommercialPipelineStageInput,
  type UpdatePetCommercialPipelineStageInput
} from '@/shared/services/pet-commercial-service';
import { PageResponse } from '@/shared/types/common';
import { PetCommercialPipelineStage } from '@/shared/types/pet-commercial';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { FormInput } from '@/shared/ui/form-input';
import { FormSelect } from '@/shared/ui/form-select';
import { PageTitle } from '@/shared/ui/page-title';
import { Pagination } from '@/shared/ui/pagination';
import { SearchBar } from '@/shared/ui/search-bar';

const pageSize = 10;
const defaultOptions = [
  { value: 'false', label: 'Não' },
  { value: 'true', label: 'Sim' }
];
const initialPage: PageResponse<PetCommercialPipelineStage> = { items: [], totalItems: 0, totalPages: 0, page: 0, size: pageSize };

type CrmPipelinePageProps = {
  surface?: 'crm' | 'pet';
};

export function CrmPipelinePage({ surface = 'crm' }: CrmPipelinePageProps) {
  const isPetSurface = surface === 'pet';
  const commercialService = petCommercialService;
  const pipelinePermissions = petCommercialPermissions.pipeline;
  const [pageData, setPageData] = useState<PageResponse<PetCommercialPipelineStage>>(initialPage);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<PetCommercialPipelineStage | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [position, setPosition] = useState('');
  const [color, setColor] = useState('#475569');
  const [isDefault, setIsDefault] = useState('false');

  const load = useCallback(async (page: number, currentSearch: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await commercialService.listPipelineStages(page, pageSize, currentSearch);
      setPageData(result);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : isPetSurface
            ? 'Erro ao carregar o pipeline comercial.'
            : 'Erro ao carregar pipeline.'
      );
    } finally {
      setLoading(false);
    }
  }, [commercialService, isPetSurface]);

  useEffect(() => {
    void load(0, search);
  }, [load, search]);

  function resetForm() {
    setEditingId(null);
    setName('');
    setCode('');
    setPosition('');
    setColor('#475569');
    setIsDefault('false');
  }

  async function handleSubmit() {
    const numericPosition = Number(position);
    if (!name.trim() || !numericPosition) {
      setError(isPetSurface ? 'Nome e posicao sao obrigatorios.' : 'Nome e posicao sao obrigatorios.');
      return;
    }

    const payload: CreatePetCommercialPipelineStageInput | UpdatePetCommercialPipelineStageInput = {
      name,
      code: code || undefined,
      position: numericPosition,
      color: color || undefined,
      isDefault: isDefault === 'true'
    };

    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await commercialService.updatePipelineStage(editingId, payload as UpdatePetCommercialPipelineStageInput);
      } else {
        await commercialService.createPipelineStage(payload);
      }
      resetForm();
      await load(pageData.page, search);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : isPetSurface
            ? 'Erro ao salvar etapa do pipeline comercial.'
            : 'Erro ao salvar etapa.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteCandidate) return;
    try {
      await commercialService.deletePipelineStage(deleteCandidate.id);
      setDeleteCandidate(null);
      await load(pageData.page, search);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : isPetSurface
            ? 'Erro ao excluir etapa do pipeline comercial.'
            : 'Erro ao excluir etapa.'
      );
    }
  }

  const rows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);
  const columns: DataTableColumn<PetCommercialPipelineStage>[] = [
    { key: 'name', header: 'Etapa', render: (row) => row.name },
    { key: 'code', header: 'Código', render: (row) => row.code },
    { key: 'position', header: 'Posição', render: (row) => row.position },
    {
      key: 'color',
      header: 'Cor',
      render: (row) => (
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full border border-[color:var(--app-shell-border)]" style={{ backgroundColor: row.color ?? '#475569' }} />
          {row.color ?? '#475569'}
        </span>
      )
    },
    { key: 'default', header: 'Padrão', render: (row) => (row.isDefault ? 'Sim' : 'Não') },
    {
      key: 'actions',
      header: 'Ações',
      render: (row) => (
        <div className="flex gap-2">
          <PermissionGuard permission={pipelinePermissions.update}>
            <button
              type="button"
              onClick={() => {
                setEditingId(row.id);
                setName(row.name);
                setCode(row.code);
                setPosition(String(row.position));
                setColor(row.color ?? '#475569');
                setIsDefault(String(row.isDefault));
              }}
              className="ui-inline-button"
            >
              Editar
            </button>
          </PermissionGuard>
          <PermissionGuard permission={pipelinePermissions.delete}>
            <button
              type="button"
              onClick={() => setDeleteCandidate(row)}
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
      permission={pipelinePermissions.read}
      fallback={(
        <div className="ui-notice-warning">
          {isPetSurface
            ? 'Voce nao possui permissao para visualizar o comercial do PetFlow.'
            : 'Voce nao possui permissao para visualizar o pipeline.'}
        </div>
      )}
    >
      <div className="space-y-5">
        <PageTitle
          eyebrow={isPetSurface ? 'PetFlow commercial' : 'CRM workspace'}
          title={isPetSurface ? 'Pipeline comercial' : 'CRM Pipeline'}
          description={isPetSurface
            ? 'Gerencie as etapas do pipeline comercial do PetFlow mantendo o backend atual apenas como compatibilidade.'
            : 'Gestao das etapas do pipeline comercial.'}
        />

        <div className="grid gap-3 ui-surface-panel p-4 md:grid-cols-[1fr_auto_auto]">
          <SearchBar
            label={isPetSurface ? 'Buscar etapa' : undefined}
            value={searchInput}
            onChange={setSearchInput}
            placeholder={isPetSurface ? 'Nome ou codigo da etapa comercial' : 'Nome ou codigo da etapa'}
          />
          <button type="button" onClick={() => setSearch(searchInput)} className="ui-primary-button">
            {isPetSurface ? 'Buscar' : 'Buscar'}
          </button>
          <button type="button" onClick={() => { setSearchInput(''); setSearch(''); }} className="ui-secondary-button">
            {isPetSurface ? 'Limpar' : 'Limpar'}
          </button>
        </div>

        <PermissionGuard permission={editingId ? pipelinePermissions.update : pipelinePermissions.create}>
          <div className="grid gap-3 ui-surface-panel p-4 md:grid-cols-2">
            <FormInput label={isPetSurface ? 'Nome da etapa' : 'Nome'} value={name} onChange={setName} required />
            <FormInput label="Codigo" value={code} onChange={setCode} />
            <FormInput label="Posicao" value={position} onChange={setPosition} type="number" required />
            <FormInput label="Cor" value={color} onChange={setColor} />
            <FormSelect label={isPetSurface ? 'Etapa padrao' : 'Etapa padrao'} value={isDefault} options={defaultOptions} onChange={setIsDefault} />
            <div className="flex gap-2 md:col-span-2">
              <button
                type="button"
                disabled={saving || !name.trim()}
                onClick={() => void handleSubmit()}
                className="ui-primary-button"
              >
                {editingId
                  ? isPetSurface ? 'Salvar etapa comercial' : 'Salvar etapa'
                  : isPetSurface ? 'Criar etapa comercial' : 'Criar etapa'}
              </button>
              <button type="button" onClick={resetForm} className="ui-secondary-button">
                {isPetSurface ? 'Cancelar' : 'Cancelar'}
              </button>
            </div>
          </div>
        </PermissionGuard>

        {error ? <div className="ui-notice-error">{error}</div> : null}

        <DataTable
          columns={columns}
          rows={rows}
          getRowKey={(row) => row.id}
          loading={loading}
          emptyMessage={isPetSurface ? 'Nenhuma etapa comercial encontrada.' : 'Nenhuma etapa encontrada.'}
        />

        <Pagination page={pageData.page} totalPages={pageData.totalPages} totalElements={totalItems} onPageChange={(nextPage) => void load(nextPage, search)} />

        <ConfirmDialog
          open={Boolean(deleteCandidate)}
          title={isPetSurface ? 'Excluir etapa comercial' : 'Excluir etapa'}
          description={deleteCandidate ? `Confirma a exclusao de ${deleteCandidate.name}?` : undefined}
          confirmLabel={isPetSurface ? 'Excluir' : 'Excluir'}
          onCancel={() => setDeleteCandidate(null)}
          onConfirm={() => void handleDelete()}
        />
      </div>
    </PermissionGuard>
  );
}
