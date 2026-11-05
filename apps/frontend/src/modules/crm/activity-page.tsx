'use client';

import { useCallback, useEffect, useState } from 'react';
import { resolveCanonicalReference } from '@/modules/crm/crm-reference-utils';
import { CrmRelatedReferenceType } from '@/modules/crm/crm-related-reference-catalog';
import {
  readRelationFilterFromUrl,
  ReferenceCell,
  RelationFilterChips,
  resolveRowReference,
  useFollowUpReferences
} from '@/modules/crm/follow-up-shared';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { sharedPageStackClass } from '@/shared/components/public-visual-system';
import { useAppI18n, useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { formatDateTimeForLocale } from '@/shared/i18n/formatters';
import { resolveApiErrorMessage } from '@/shared/lib/api-error-message';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { petFollowUpService } from '@/shared/services/pet-follow-up-service';
import { PageResponse } from '@/shared/types/common';
import { CrmActivityItem } from '@/shared/types/crm';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { Pagination } from '@/shared/ui/pagination';

const pageSize = 14;
const initialPage: PageResponse<CrmActivityItem> = { items: [], totalItems: 0, totalPages: 0, page: 0, size: pageSize };

export function CrmActivityPage() {
  const { locale } = useAppI18n();
  const copy = useAppMessages().screens.petFollowUp;
  const { typeOptions, recordOptions, error: referencesError } = useFollowUpReferences();
  const [pageData, setPageData] = useState<PageResponse<CrmActivityItem>>(initialPage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtersReady, setFiltersReady] = useState(false);
  const [relationTypeFilter, setRelationTypeFilter] = useState<CrmRelatedReferenceType | ''>('');
  const [relationIdFilter, setRelationIdFilter] = useState('');

  useEffect(() => {
    if (filtersReady) {
      return;
    }

    const initial = readRelationFilterFromUrl(typeOptions);
    setRelationTypeFilter(initial.relationType);
    setRelationIdFilter(initial.relationId);
    setFiltersReady(true);
  }, [filtersReady, typeOptions]);

  const load = useCallback(async (page: number, currentRelationType: CrmRelatedReferenceType | '', currentRelationId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await petFollowUpService.listActivity(page, pageSize, {
        relatedReferenceType: currentRelationType || undefined,
        relatedId: currentRelationId || undefined
      });
      setPageData(result);
    } catch (err) {
      setError(resolveApiErrorMessage(err, copy.activityLoadError));
    } finally {
      setLoading(false);
    }
  }, [copy.activityLoadError]);

  useEffect(() => {
    if (filtersReady) {
      void load(0, relationTypeFilter, relationIdFilter);
    }
  }, [filtersReady, load, relationIdFilter, relationTypeFilter]);

  const rows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);
  const eventLabels: Record<string, string> = copy.events;
  const columns: DataTableColumn<CrmActivityItem>[] = [
    {
      key: 'eventType',
      header: copy.columnEvent,
      render: (row) => <span className="text-[var(--ink)]">{eventLabels[row.eventType] ?? row.eventType}</span>
    },
    {
      key: 'entity',
      header: copy.columnEntity,
      render: (row) => (
        <ReferenceCell
          reference={resolveCanonicalReference({
            referenceType: row.entityReferenceType,
            moduleCode: row.entityModule,
            entityType: row.entityType,
            fallbackReferenceType: row.entity.replace('_', '.')
          })}
        />
      )
    },
    {
      key: 'related',
      header: copy.columnRelated,
      render: (row) => (row.relatedId ? (
        <ReferenceCell
          reference={resolveRowReference(row)}
          displayName={row.relatedDisplayName}
          displayContext={row.relatedDisplayContext}
        />
      ) : '-')
    },
    {
      key: 'createdAt',
      header: copy.columnDate,
      render: (row) => (
        <span className="ui-mono whitespace-nowrap text-[var(--ink-2)]">{formatDateTimeForLocale(locale, row.createdAt)}</span>
      )
    }
  ];

  return (
    <PermissionGuard
      permission="crm.activity.read"
      fallback={<div className="ui-notice-warning">{copy.activityNoPermission}</div>}
    >
      <div className={sharedPageStackClass}>
        <h2 className="text-sm font-semibold text-[var(--ink)]">
          {copy.activityTitle}
          {loading ? null : <span className="ui-mono ml-2 font-normal text-[var(--muted)]">{totalItems}</span>}
        </h2>

        <div className="flex flex-wrap items-end gap-2">
          <RelationFilterChips
            relationType={relationTypeFilter}
            relationId={relationIdFilter}
            typeOptions={typeOptions}
            recordOptions={recordOptions}
            onRelationTypeChange={setRelationTypeFilter}
            onRelationIdChange={setRelationIdFilter}
          />
          <button
            type="button"
            onClick={() => {
              setRelationTypeFilter('');
              setRelationIdFilter('');
            }}
            className="ui-inline-button"
          >
            {copy.clear}
          </button>
        </div>

        {referencesError ? <div className="ui-notice-error">{referencesError}</div> : null}
        {error ? <div className="ui-notice-error">{error}</div> : null}

        <DataTable
          columns={columns}
          rows={rows}
          getRowKey={(row) => row.id}
          loading={loading}
          emptyState={{ title: copy.activityEmptyTitle, description: copy.activityEmptyDescription }}
        />

        <Pagination
          page={pageData.page}
          totalPages={pageData.totalPages}
          totalElements={totalItems}
          pageSize={pageSize}
          onPageChange={(nextPage) => void load(nextPage, relationTypeFilter, relationIdFilter)}
        />
      </div>
    </PermissionGuard>
  );
}
