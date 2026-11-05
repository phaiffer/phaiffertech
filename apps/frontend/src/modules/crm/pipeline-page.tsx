'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { petCommercialPermissions } from '@/shared/auth/pet-commercial-permissions';
import { sharedPageStackClass } from '@/shared/components/public-visual-system';
import { useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { resolveApiErrorMessage } from '@/shared/lib/api-error-message';
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

const pageSize = 14;
const defaultColor = '#475569';
const initialPage: PageResponse<PetCommercialPipelineStage> = { items: [], totalItems: 0, totalPages: 0, page: 0, size: pageSize };

export function CrmPipelinePage() {
  const copy = useAppMessages().screens.petCommercial;
  const commercialService = petCommercialService;
  const pipelinePermissions = petCommercialPermissions.pipeline;
  const [pageData, setPageData] = useState<PageResponse<PetCommercialPipelineStage>>(initialPage);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<PetCommercialPipelineStage | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [position, setPosition] = useState('');
  const [color, setColor] = useState(defaultColor);
  const [isDefault, setIsDefault] = useState('false');

  const load = useCallback(async (page: number, currentSearch: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await commercialService.listPipelineStages(page, pageSize, currentSearch);
      setPageData(result);
    } catch (err) {
      setError(resolveApiErrorMessage(err, copy.stagesLoadError));
    } finally {
      setLoading(false);
    }
  }, [commercialService, copy.stagesLoadError]);

  useEffect(() => {
    void load(0, search);
  }, [load, search]);

  function closeEditor() {
    setIsEditorOpen(false);
    setEditingId(null);
    setName('');
    setCode('');
    setPosition('');
    setColor(defaultColor);
    setIsDefault('false');
  }

  function beginEdit(row: PetCommercialPipelineStage) {
    setEditingId(row.id);
    setName(row.name);
    setCode(row.code);
    setPosition(String(row.position));
    setColor(row.color ?? defaultColor);
    setIsDefault(String(row.isDefault));
    setIsEditorOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const numericPosition = Number(position);
    if (!name.trim() || !numericPosition) {
      setError(copy.stageRequired);
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
      closeEditor();
      await load(pageData.page, search);
    } catch (err) {
      setError(resolveApiErrorMessage(err, copy.stageSaveError));
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
      setError(resolveApiErrorMessage(err, copy.stageDeleteError));
    }
  }

  const rows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);
  const defaultOptions = [
    { value: 'false', label: copy.no },
    { value: 'true', label: copy.yes }
  ];
  const columns: DataTableColumn<PetCommercialPipelineStage>[] = [
    {
      key: 'position',
      header: copy.columnPosition,
      className: 'text-right ui-mono',
      render: (row) => row.position
    },
    {
      key: 'name',
      header: copy.columnStage,
      render: (row) => (
        <span className="inline-flex items-center gap-2 font-medium text-[var(--ink)]">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: row.color ?? defaultColor }} aria-hidden="true" />
          {row.name}
        </span>
      )
    },
    { key: 'code', header: copy.columnCode, render: (row) => <span className="ui-mono text-[var(--ink-2)]">{row.code}</span> },
    { key: 'color', header: copy.columnColor, render: (row) => <span className="ui-mono text-[var(--ink-2)]">{row.color ?? defaultColor}</span> },
    { key: 'default', header: copy.columnDefault, render: (row) => (row.isDefault ? copy.yes : copy.no) },
    {
      key: 'actions',
      header: copy.columnActions,
      render: (row) => (
        <div className="flex gap-2">
          <PermissionGuard permission={pipelinePermissions.update}>
            <button type="button" onClick={() => beginEdit(row)} className="ui-inline-button">{copy.edit}</button>
          </PermissionGuard>
          <PermissionGuard permission={pipelinePermissions.delete}>
            <button type="button" onClick={() => setDeleteCandidate(row)} className="ui-inline-danger-button">{copy.delete}</button>
          </PermissionGuard>
        </div>
      )
    }
  ];

  return (
    <PermissionGuard
      permission={pipelinePermissions.read}
      fallback={<div className="ui-notice-warning">{copy.noPermission}</div>}
    >
      <div className={sharedPageStackClass}>
        <PageTitle
          title={copy.stagesTitle}
          description={copy.stagesDescription}
          count={totalItems}
          actions={!isEditorOpen ? (
            <PermissionGuard permission={pipelinePermissions.create}>
              <button type="button" onClick={() => setIsEditorOpen(true)} className="ui-primary-button">{copy.newStage}</button>
            </PermissionGuard>
          ) : undefined}
        />

        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setSearch(searchInput);
          }}
        >
          <div className="min-w-[14rem] flex-1">
            <SearchBar value={searchInput} onChange={setSearchInput} placeholder={copy.stagesSearchPlaceholder} />
          </div>
          <button type="submit" className="ui-secondary-button">{copy.search}</button>
          <button
            type="button"
            onClick={() => {
              setSearchInput('');
              setSearch('');
            }}
            className="ui-inline-button"
          >
            {copy.clear}
          </button>
        </form>

        {isEditorOpen ? (
          <PermissionGuard permission={editingId ? pipelinePermissions.update : pipelinePermissions.create}>
            <form onSubmit={handleSubmit} className="grid gap-4 rounded-md border border-[color:var(--line)] p-4 md:grid-cols-2">
              <FormInput label={copy.fieldStageName} value={name} onChange={setName} required />
              <FormInput label={copy.fieldCode} value={code} onChange={setCode} />
              <FormInput label={copy.fieldPosition} value={position} onChange={setPosition} type="number" required />
              <FormInput label={copy.fieldColor} value={color} onChange={setColor} />
              <FormSelect label={copy.fieldDefaultStage} value={isDefault} options={defaultOptions} onChange={setIsDefault} />
              <div className="flex gap-2 md:col-span-2">
                <button type="submit" disabled={saving || !name.trim()} className="ui-primary-button">
                  {saving ? copy.saving : editingId ? copy.saveStage : copy.createStage}
                </button>
                <button type="button" onClick={closeEditor} className="ui-secondary-button">{copy.cancel}</button>
              </div>
            </form>
          </PermissionGuard>
        ) : null}

        {error ? <div className="ui-notice-error">{error}</div> : null}

        <DataTable
          columns={columns}
          rows={rows}
          getRowKey={(row) => row.id}
          loading={loading}
          emptyState={{ title: copy.stagesEmpty, description: '' }}
        />

        <Pagination
          page={pageData.page}
          totalPages={pageData.totalPages}
          totalElements={totalItems}
          pageSize={pageSize}
          onPageChange={(nextPage) => void load(nextPage, search)}
        />

        <ConfirmDialog
          open={Boolean(deleteCandidate)}
          title={copy.stageDeleteTitle}
          description={deleteCandidate ? copy.stageDeleteDescription.replace('{name}', deleteCandidate.name) : undefined}
          confirmLabel={copy.delete}
          onCancel={() => setDeleteCandidate(null)}
          onConfirm={() => void handleDelete()}
        />
      </div>
    </PermissionGuard>
  );
}
