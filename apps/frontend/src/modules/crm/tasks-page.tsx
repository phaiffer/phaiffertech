'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { CrmRelatedReferenceType, resolveEditableReferenceType } from '@/modules/crm/crm-related-reference-catalog';
import {
  readRelationFilterFromUrl,
  ReferenceCell,
  RelationFields,
  RelationFilterChips,
  resolveRowReference,
  useFollowUpReferences
} from '@/modules/crm/follow-up-shared';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { sharedInlineActionsClass, sharedPageStackClass } from '@/shared/components/public-visual-system';
import { StatusBadge } from '@/shared/dashboard/status-badge';
import { useAppI18n, useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { formatDateForLocale } from '@/shared/i18n/formatters';
import { resolveApiErrorMessage } from '@/shared/lib/api-error-message';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { CreateTaskInput, UpdateTaskInput } from '@/shared/services/crm-service';
import { petFollowUpService } from '@/shared/services/pet-follow-up-service';
import { PageResponse } from '@/shared/types/common';
import { CrmTask } from '@/shared/types/crm';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { DateInput } from '@/shared/ui/date-input';
import { FilterChip } from '@/shared/ui/filter-chip';
import { FormInput } from '@/shared/ui/form-input';
import { FormSelect } from '@/shared/ui/form-select';
import { Pagination } from '@/shared/ui/pagination';
import { SearchBar } from '@/shared/ui/search-bar';

const pageSize = 14;
const initialPage: PageResponse<CrmTask> = { items: [], totalItems: 0, totalPages: 0, page: 0, size: pageSize };

export function CrmTasksPage() {
  const { locale } = useAppI18n();
  const copy = useAppMessages().screens.petFollowUp;
  const { typeOptions, recordOptions, error: referencesError } = useFollowUpReferences();
  const [pageData, setPageData] = useState<PageResponse<CrmTask>>(initialPage);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<CrmTask | null>(null);
  const [filtersReady, setFiltersReady] = useState(false);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [relationTypeFilter, setRelationTypeFilter] = useState<CrmRelatedReferenceType | ''>('');
  const [relationIdFilter, setRelationIdFilter] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('OPEN');
  const [priority, setPriority] = useState('MEDIUM');
  const [relationType, setRelationType] = useState<CrmRelatedReferenceType>('PET.CLIENT');
  const [relationId, setRelationId] = useState('');

  useEffect(() => {
    if (filtersReady) {
      return;
    }

    const initial = readRelationFilterFromUrl(typeOptions);
    const initialSearch = initial.params.get('search')?.trim() ?? '';
    setSearchInput(initialSearch);
    setSearch(initialSearch);
    setStatusFilter(initial.params.get('status')?.trim() ?? '');
    setPriorityFilter(initial.params.get('priority')?.trim() ?? '');
    setRelationTypeFilter(initial.relationType);
    setRelationIdFilter(initial.relationId);
    setFiltersReady(true);
  }, [filtersReady, typeOptions]);

  const load = useCallback(async (
    page: number,
    currentSearch: string,
    currentStatus: string,
    currentPriority: string,
    currentRelationType: CrmRelatedReferenceType | '',
    currentRelationId: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const result = await petFollowUpService.listTasks(page, pageSize, currentSearch, {
        status: currentStatus || undefined,
        priority: currentPriority || undefined,
        relatedReferenceType: currentRelationType || undefined,
        relatedId: currentRelationId || undefined
      });
      setPageData(result);
    } catch (err) {
      setError(resolveApiErrorMessage(err, copy.tasksLoadError));
    } finally {
      setLoading(false);
    }
  }, [copy.tasksLoadError]);

  useEffect(() => {
    if (filtersReady) {
      void load(0, search, statusFilter, priorityFilter, relationTypeFilter, relationIdFilter);
    }
  }, [filtersReady, load, priorityFilter, relationIdFilter, relationTypeFilter, search, statusFilter]);

  function reload() {
    return load(pageData.page, search, statusFilter, priorityFilter, relationTypeFilter, relationIdFilter);
  }

  function resetForm() {
    setEditorOpen(false);
    setEditingId(null);
    setTitle('');
    setDescription('');
    setDueDate('');
    setStatus('OPEN');
    setPriority('MEDIUM');
    setRelationId('');
  }

  function openNewTask() {
    resetForm();
    setRelationType(typeOptions[0]?.value ?? 'PET.CLIENT');
    setError(null);
    setEditorOpen(true);
  }

  function openEditTask(row: CrmTask, editableRelation: CrmRelatedReferenceType) {
    setEditingId(row.id);
    setTitle(row.title);
    setDescription(row.description ?? '');
    setDueDate(row.dueDate ? row.dueDate.slice(0, 10) : '');
    setStatus(row.status);
    setPriority(row.priority);
    setRelationType(editableRelation);
    setRelationId(row.relatedId);
    setError(null);
    setEditorOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !relationId) {
      setError(copy.taskRequired);
      return;
    }

    const payload: CreateTaskInput | UpdateTaskInput = {
      title,
      description: description || undefined,
      dueDate: dueDate ? new Date(`${dueDate}T12:00:00Z`).toISOString() : undefined,
      status,
      priority,
      relatedReferenceType: relationType,
      relatedId: relationId
    };

    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await petFollowUpService.updateTask(editingId, payload as UpdateTaskInput);
      } else {
        await petFollowUpService.createTask(payload);
      }
      resetForm();
      await reload();
    } catch (err) {
      setError(resolveApiErrorMessage(err, copy.taskSaveError));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteCandidate) {
      return;
    }

    try {
      await petFollowUpService.deleteTask(deleteCandidate.id);
      setDeleteCandidate(null);
      await reload();
    } catch (err) {
      setError(resolveApiErrorMessage(err, copy.taskDeleteError));
    }
  }

  function clearFilters() {
    setSearchInput('');
    setSearch('');
    setStatusFilter('');
    setPriorityFilter('');
    setRelationTypeFilter('');
    setRelationIdFilter('');
  }

  const rows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);
  const statusOptions = [
    { value: 'OPEN', label: copy.statusOpen },
    { value: 'IN_PROGRESS', label: copy.statusInProgress },
    { value: 'DONE', label: copy.statusDone }
  ];
  const priorityOptions = [
    { value: 'LOW', label: copy.priorityLow },
    { value: 'MEDIUM', label: copy.priorityMedium },
    { value: 'HIGH', label: copy.priorityHigh }
  ];

  const columns: DataTableColumn<CrmTask>[] = [
    {
      key: 'title',
      header: copy.columnTask,
      render: (row) => (
        <div>
          <p className="font-medium text-[var(--ink)]">{row.title}</p>
          {row.description ? <p className="text-xs text-[var(--ink-2)]">{row.description}</p> : null}
        </div>
      )
    },
    {
      key: 'relation',
      header: copy.columnRelation,
      render: (row) => (
        <ReferenceCell
          reference={resolveRowReference(row)}
          displayName={row.relatedDisplayName}
          displayContext={row.relatedDisplayContext}
        />
      )
    },
    {
      key: 'dueDate',
      header: copy.fieldDueDate,
      render: (row) => (
        <span className="ui-mono whitespace-nowrap text-[var(--ink-2)]">
          {formatDateForLocale(locale, row.dueDate, '-', { timeZone: 'UTC' })}
        </span>
      )
    },
    { key: 'status', header: copy.filterStatus, render: (row) => <StatusBadge status={row.status} /> },
    { key: 'priority', header: copy.filterPriority, render: (row) => <StatusBadge status={row.priority} /> },
    {
      key: 'actions',
      header: copy.columnActions,
      render: (row) => {
        const editableRelation = resolveEditableReferenceType(resolveRowReference(row));
        const canEditRelation = typeOptions.some((option) => option.value === editableRelation);

        return (
          <div className={sharedInlineActionsClass}>
            <PermissionGuard permission="crm.task.update">
              {editableRelation && canEditRelation ? (
                <button type="button" onClick={() => openEditTask(row, editableRelation)} className="ui-inline-button">
                  {copy.edit}
                </button>
              ) : (
                <span className="text-xs text-[var(--muted)]">{copy.readOnly}</span>
              )}
            </PermissionGuard>
            <PermissionGuard permission="crm.task.delete">
              <button type="button" onClick={() => setDeleteCandidate(row)} className="ui-inline-danger-button">
                {copy.delete}
              </button>
            </PermissionGuard>
          </div>
        );
      }
    }
  ];

  const newTaskButton = (
    <PermissionGuard permission="crm.task.create">
      <button type="button" onClick={openNewTask} className="ui-primary-button">{copy.newTask}</button>
    </PermissionGuard>
  );

  return (
    <PermissionGuard
      permission="crm.task.read"
      fallback={<div className="ui-notice-warning">{copy.tasksNoPermission}</div>}
    >
      <div className={sharedPageStackClass}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-[var(--ink)]">
            {copy.tasksTitle}
            {loading ? null : <span className="ui-mono ml-2 font-normal text-[var(--muted)]">{totalItems}</span>}
          </h2>
          {newTaskButton}
        </div>

        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setSearch(searchInput);
          }}
        >
          <div className="min-w-[14rem] flex-1">
            <SearchBar label={copy.search} value={searchInput} onChange={setSearchInput} placeholder={copy.tasksSearchPlaceholder} />
          </div>
          <FilterChip
            label={copy.filterStatus}
            value={statusFilter}
            options={[{ value: '', label: copy.all }, ...statusOptions]}
            onChange={setStatusFilter}
          />
          <FilterChip
            label={copy.filterPriority}
            value={priorityFilter}
            options={[{ value: '', label: copy.allPriorities }, ...priorityOptions]}
            onChange={setPriorityFilter}
          />
          <RelationFilterChips
            relationType={relationTypeFilter}
            relationId={relationIdFilter}
            typeOptions={typeOptions}
            recordOptions={recordOptions}
            onRelationTypeChange={setRelationTypeFilter}
            onRelationIdChange={setRelationIdFilter}
          />
          <button type="submit" className="ui-secondary-button">{copy.search}</button>
          <button type="button" onClick={clearFilters} className="ui-inline-button">{copy.clear}</button>
        </form>

        {editorOpen ? (
          <PermissionGuard permission={editingId ? 'crm.task.update' : 'crm.task.create'}>
            <form onSubmit={handleSubmit} className="grid gap-3 rounded-md border border-[color:var(--line)] p-4 md:grid-cols-2">
              <h3 className="text-sm font-semibold text-[var(--ink)] md:col-span-2">{editingId ? copy.editTask : copy.newTask}</h3>
              <FormInput label={copy.fieldTitle} value={title} onChange={setTitle} required />
              <FormInput label={copy.fieldDescription} value={description} onChange={setDescription} />
              <DateInput label={copy.fieldDueDate} value={dueDate} onChange={setDueDate} />
              <FormSelect label={copy.filterStatus} value={status} options={statusOptions} onChange={setStatus} />
              <FormSelect label={copy.filterPriority} value={priority} options={priorityOptions} onChange={setPriority} />
              <RelationFields
                relationType={relationType}
                relationId={relationId}
                typeOptions={typeOptions}
                recordOptions={recordOptions}
                onRelationTypeChange={setRelationType}
                onRelationIdChange={setRelationId}
              />
              <div className="flex gap-2 md:col-span-2">
                <button type="submit" disabled={saving} className="ui-primary-button">
                  {editingId ? copy.saveTask : copy.createTask}
                </button>
                <button type="button" onClick={resetForm} className="ui-secondary-button">{copy.cancel}</button>
              </div>
            </form>
          </PermissionGuard>
        ) : null}

        {referencesError ? <div className="ui-notice-error">{referencesError}</div> : null}
        {error ? <div className="ui-notice-error">{error}</div> : null}

        <DataTable
          columns={columns}
          rows={rows}
          getRowKey={(row) => row.id}
          loading={loading}
          emptyState={{ title: copy.tasksEmptyTitle, description: copy.tasksEmptyDescription, action: newTaskButton }}
        />

        <Pagination
          page={pageData.page}
          totalPages={pageData.totalPages}
          totalElements={totalItems}
          pageSize={pageSize}
          onPageChange={(nextPage) => void load(nextPage, search, statusFilter, priorityFilter, relationTypeFilter, relationIdFilter)}
        />

        <ConfirmDialog
          open={Boolean(deleteCandidate)}
          title={copy.taskDeleteTitle}
          description={deleteCandidate ? copy.taskDeleteDescription.replace('{title}', deleteCandidate.title) : undefined}
          confirmLabel={copy.delete}
          cancelLabel={copy.cancel}
          onCancel={() => setDeleteCandidate(null)}
          onConfirm={() => void handleDelete()}
        />
      </div>
    </PermissionGuard>
  );
}
