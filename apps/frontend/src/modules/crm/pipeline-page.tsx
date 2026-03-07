'use client';

import { useEffect, useState } from 'react';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { ApiClientError } from '@/shared/lib/http';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { crmService, CreatePipelineStageInput, UpdatePipelineStageInput } from '@/shared/services/crm-service';
import { CrmPipelineStage } from '@/shared/types/crm';
import { PageResponse } from '@/shared/types/common';
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
const initialPage: PageResponse<CrmPipelineStage> = { items: [], totalItems: 0, totalPages: 0, page: 0, size: pageSize };

export function CrmPipelinePage() {
  const [pageData, setPageData] = useState<PageResponse<CrmPipelineStage>>(initialPage);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<CrmPipelineStage | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [position, setPosition] = useState('');
  const [color, setColor] = useState('#475569');
  const [isDefault, setIsDefault] = useState('false');

  useEffect(() => {
    void load(0, search);
  }, [search]);

  async function load(page: number, currentSearch: string) {
    setLoading(true);
    setError(null);
    try {
      const result = await crmService.listPipelineStages(page, pageSize, currentSearch);
      setPageData(result);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao carregar pipeline.');
    } finally {
      setLoading(false);
    }
  }

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
      setError('Nome e posição são obrigatórios.');
      return;
    }

    const payload: CreatePipelineStageInput | UpdatePipelineStageInput = {
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
        await crmService.updatePipelineStage(editingId, payload as UpdatePipelineStageInput);
      } else {
        await crmService.createPipelineStage(payload);
      }
      resetForm();
      await load(pageData.page, search);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao salvar etapa.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteCandidate) return;
    try {
      await crmService.deletePipelineStage(deleteCandidate.id);
      setDeleteCandidate(null);
      await load(pageData.page, search);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao excluir etapa.');
    }
  }

  const rows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);
  const columns: DataTableColumn<CrmPipelineStage>[] = [
    { key: 'name', header: 'Etapa', render: (row) => row.name },
    { key: 'code', header: 'Código', render: (row) => row.code },
    { key: 'position', header: 'Posição', render: (row) => row.position },
    {
      key: 'color',
      header: 'Cor',
      render: (row) => (
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full border border-slate-300" style={{ backgroundColor: row.color ?? '#475569' }} />
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
          <PermissionGuard permission="crm.pipeline.update">
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
              className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700"
            >
              Editar
            </button>
          </PermissionGuard>
          <PermissionGuard permission="crm.pipeline.delete">
            <button
              type="button"
              onClick={() => setDeleteCandidate(row)}
              className="rounded-lg border border-rose-300 px-2 py-1 text-xs font-medium text-rose-700"
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
      permission="crm.pipeline.read"
      fallback={<div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">Você não possui permissão para visualizar o pipeline.</div>}
    >
      <div className="space-y-5">
        <PageTitle title="CRM Pipeline" description="Gestão das etapas do pipeline comercial." />

        <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_auto_auto]">
          <SearchBar value={searchInput} onChange={setSearchInput} placeholder="Nome ou código da etapa" />
          <button type="button" onClick={() => setSearch(searchInput)} className="rounded-lg bg-action px-4 py-2 text-sm font-medium text-white">
            Buscar
          </button>
          <button type="button" onClick={() => { setSearchInput(''); setSearch(''); }} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
            Limpar
          </button>
        </div>

        <PermissionGuard permission={editingId ? 'crm.pipeline.update' : 'crm.pipeline.create'}>
          <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-2">
            <FormInput label="Nome" value={name} onChange={setName} required />
            <FormInput label="Código" value={code} onChange={setCode} />
            <FormInput label="Posição" value={position} onChange={setPosition} type="number" required />
            <FormInput label="Cor" value={color} onChange={setColor} />
            <FormSelect label="Etapa padrão" value={isDefault} options={defaultOptions} onChange={setIsDefault} />
            <div className="flex gap-2 md:col-span-2">
              <button
                type="button"
                disabled={saving || !name.trim()}
                onClick={() => void handleSubmit()}
                className="rounded-lg bg-action px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {editingId ? 'Salvar etapa' : 'Criar etapa'}
              </button>
              <button type="button" onClick={resetForm} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
                Cancelar
              </button>
            </div>
          </div>
        </PermissionGuard>

        {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

        <DataTable columns={columns} rows={rows} getRowKey={(row) => row.id} loading={loading} emptyMessage="Nenhuma etapa encontrada." />

        <Pagination page={pageData.page} totalPages={pageData.totalPages} totalElements={totalItems} onPageChange={(nextPage) => void load(nextPage, search)} />

        <ConfirmDialog
          open={Boolean(deleteCandidate)}
          title="Excluir etapa"
          description={deleteCandidate ? `Confirma a exclusão de ${deleteCandidate.name}?` : undefined}
          confirmLabel="Excluir"
          onCancel={() => setDeleteCandidate(null)}
          onConfirm={() => void handleDelete()}
        />
      </div>
    </PermissionGuard>
  );
}
