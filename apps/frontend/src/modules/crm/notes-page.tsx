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
import { useAppI18n, useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { formatDateTimeForLocale } from '@/shared/i18n/formatters';
import { resolveApiErrorMessage } from '@/shared/lib/api-error-message';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { CreateNoteInput } from '@/shared/services/crm-service';
import { petFollowUpService } from '@/shared/services/pet-follow-up-service';
import { PageResponse } from '@/shared/types/common';
import { CrmNote } from '@/shared/types/crm';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { FormTextarea } from '@/shared/ui/form-textarea';
import { Pagination } from '@/shared/ui/pagination';
import { SearchBar } from '@/shared/ui/search-bar';

const pageSize = 14;
const initialPage: PageResponse<CrmNote> = { items: [], totalItems: 0, totalPages: 0, page: 0, size: pageSize };

export function CrmNotesPage() {
  const { locale } = useAppI18n();
  const copy = useAppMessages().screens.petFollowUp;
  const { typeOptions, recordOptions, error: referencesError } = useFollowUpReferences();
  const [pageData, setPageData] = useState<PageResponse<CrmNote>>(initialPage);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<CrmNote | null>(null);
  const [filtersReady, setFiltersReady] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [relationTypeFilter, setRelationTypeFilter] = useState<CrmRelatedReferenceType | ''>('');
  const [relationIdFilter, setRelationIdFilter] = useState('');
  const [relationType, setRelationType] = useState<CrmRelatedReferenceType>('PET.CLIENT');
  const [relationId, setRelationId] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (filtersReady) {
      return;
    }

    const initial = readRelationFilterFromUrl(typeOptions);
    const initialSearch = initial.params.get('search')?.trim() ?? '';
    setSearchInput(initialSearch);
    setSearch(initialSearch);
    setRelationTypeFilter(initial.relationType);
    setRelationIdFilter(initial.relationId);
    setFiltersReady(true);
  }, [filtersReady, typeOptions]);

  const load = useCallback(async (
    page: number,
    currentSearch: string,
    currentRelationType: CrmRelatedReferenceType | '',
    currentRelationId: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const result = await petFollowUpService.listNotes(page, pageSize, currentSearch, {
        relatedReferenceType: currentRelationType || undefined,
        relatedId: currentRelationId || undefined
      });
      setPageData(result);
    } catch (err) {
      setError(resolveApiErrorMessage(err, copy.notesLoadError));
    } finally {
      setLoading(false);
    }
  }, [copy.notesLoadError]);

  useEffect(() => {
    if (filtersReady) {
      void load(0, search, relationTypeFilter, relationIdFilter);
    }
  }, [filtersReady, load, relationIdFilter, relationTypeFilter, search]);

  function reload() {
    return load(pageData.page, search, relationTypeFilter, relationIdFilter);
  }

  function resetForm() {
    setEditorOpen(false);
    setEditingId(null);
    setContent('');
    setRelationId('');
  }

  function openNewNote() {
    resetForm();
    setRelationType(typeOptions[0]?.value ?? 'PET.CLIENT');
    setError(null);
    setEditorOpen(true);
  }

  function openEditNote(row: CrmNote, editableRelation: CrmRelatedReferenceType) {
    setEditingId(row.id);
    setContent(row.content);
    setRelationType(editableRelation);
    setRelationId(row.relatedId);
    setError(null);
    setEditorOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!content.trim() || !relationId) {
      setError(copy.noteRequired);
      return;
    }

    const payload: CreateNoteInput = { content, relatedReferenceType: relationType, relatedId: relationId };

    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await petFollowUpService.updateNote(editingId, payload);
      } else {
        await petFollowUpService.createNote(payload);
      }
      resetForm();
      await reload();
    } catch (err) {
      setError(resolveApiErrorMessage(err, copy.noteSaveError));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteCandidate) {
      return;
    }

    try {
      await petFollowUpService.deleteNote(deleteCandidate.id);
      setDeleteCandidate(null);
      await reload();
    } catch (err) {
      setError(resolveApiErrorMessage(err, copy.noteDeleteError));
    }
  }

  function clearFilters() {
    setSearchInput('');
    setSearch('');
    setRelationTypeFilter('');
    setRelationIdFilter('');
  }

  const rows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);
  const columns: DataTableColumn<CrmNote>[] = [
    { key: 'content', header: copy.columnNote, render: (row) => <span className="text-[var(--ink)]">{row.content}</span> },
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
    { key: 'author', header: copy.columnAuthor, render: (row) => row.createdBy ?? '-' },
    {
      key: 'createdAt',
      header: copy.columnCreatedAt,
      render: (row) => (
        <span className="ui-mono whitespace-nowrap text-[var(--ink-2)]">{formatDateTimeForLocale(locale, row.createdAt)}</span>
      )
    },
    {
      key: 'actions',
      header: copy.columnActions,
      render: (row) => {
        const editableRelation = resolveEditableReferenceType(resolveRowReference(row));
        const canEditRelation = typeOptions.some((option) => option.value === editableRelation);

        return (
          <div className={sharedInlineActionsClass}>
            <PermissionGuard permission="crm.note.update">
              {editableRelation && canEditRelation ? (
                <button type="button" onClick={() => openEditNote(row, editableRelation)} className="ui-inline-button">
                  {copy.edit}
                </button>
              ) : (
                <span className="text-xs text-[var(--muted)]">{copy.readOnly}</span>
              )}
            </PermissionGuard>
            <PermissionGuard permission="crm.note.delete">
              <button type="button" onClick={() => setDeleteCandidate(row)} className="ui-inline-danger-button">
                {copy.delete}
              </button>
            </PermissionGuard>
          </div>
        );
      }
    }
  ];

  const newNoteButton = (
    <PermissionGuard permission="crm.note.create">
      <button type="button" onClick={openNewNote} className="ui-primary-button">{copy.newNote}</button>
    </PermissionGuard>
  );

  return (
    <PermissionGuard
      permission="crm.note.read"
      fallback={<div className="ui-notice-warning">{copy.notesNoPermission}</div>}
    >
      <div className={sharedPageStackClass}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-[var(--ink)]">
            {copy.notesTitle}
            {loading ? null : <span className="ui-mono ml-2 font-normal text-[var(--muted)]">{totalItems}</span>}
          </h2>
          {newNoteButton}
        </div>

        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setSearch(searchInput);
          }}
        >
          <div className="min-w-[14rem] flex-1">
            <SearchBar label={copy.search} value={searchInput} onChange={setSearchInput} placeholder={copy.notesSearchPlaceholder} />
          </div>
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
          <PermissionGuard permission={editingId ? 'crm.note.update' : 'crm.note.create'}>
            <form onSubmit={handleSubmit} className="grid gap-3 rounded-md border border-[color:var(--line)] p-4 md:grid-cols-2">
              <h3 className="text-sm font-semibold text-[var(--ink)] md:col-span-2">{editingId ? copy.editNote : copy.newNote}</h3>
              <FormTextarea
                label={copy.fieldContent}
                value={content}
                onChange={setContent}
                rows={3}
                wrapperClassName="md:col-span-2"
              />
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
                  {editingId ? copy.saveNote : copy.createNote}
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
          emptyState={{ title: copy.notesEmptyTitle, description: copy.notesEmptyDescription, action: newNoteButton }}
        />

        <Pagination
          page={pageData.page}
          totalPages={pageData.totalPages}
          totalElements={totalItems}
          pageSize={pageSize}
          onPageChange={(nextPage) => void load(nextPage, search, relationTypeFilter, relationIdFilter)}
        />

        <ConfirmDialog
          open={Boolean(deleteCandidate)}
          title={copy.noteDeleteTitle}
          description={deleteCandidate ? copy.noteDeleteDescription : undefined}
          confirmLabel={copy.delete}
          cancelLabel={copy.cancel}
          onCancel={() => setDeleteCandidate(null)}
          onConfirm={() => void handleDelete()}
        />
      </div>
    </PermissionGuard>
  );
}
