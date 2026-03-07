'use client';

import { useEffect, useState } from 'react';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { ApiClientError } from '@/shared/lib/http';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { crmService } from '@/shared/services/crm-service';
import { CrmActivityItem } from '@/shared/types/crm';
import { PageResponse } from '@/shared/types/common';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { PageTitle } from '@/shared/ui/page-title';
import { Pagination } from '@/shared/ui/pagination';

const pageSize = 10;
const initialPage: PageResponse<CrmActivityItem> = { items: [], totalItems: 0, totalPages: 0, page: 0, size: pageSize };

function payloadSummary(payload: Record<string, unknown>) {
  const json = JSON.stringify(payload);
  if (!json || json === '{}') {
    return '-';
  }
  return json.length > 120 ? `${json.slice(0, 117)}...` : json;
}

export function CrmActivityPage() {
  const [pageData, setPageData] = useState<PageResponse<CrmActivityItem>>(initialPage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void load(0);
  }, []);

  async function load(page: number) {
    setLoading(true);
    setError(null);
    try {
      const result = await crmService.listActivity(page, pageSize);
      setPageData(result);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Erro ao carregar atividade.');
    } finally {
      setLoading(false);
    }
  }

  const rows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);
  const columns: DataTableColumn<CrmActivityItem>[] = [
    { key: 'eventType', header: 'Evento', render: (row) => row.eventType },
    { key: 'entity', header: 'Entidade', render: (row) => `${row.entity} ${row.entityId.slice(0, 8)}` },
    { key: 'user', header: 'Usuário', render: (row) => row.userId ?? '-' },
    { key: 'payload', header: 'Payload', render: (row) => payloadSummary(row.payload) },
    { key: 'createdAt', header: 'Data', render: (row) => new Date(row.createdAt).toLocaleString('pt-BR') }
  ];

  return (
    <PermissionGuard
      permission="crm.activity.read"
      fallback={<div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">Você não possui permissão para visualizar a atividade do CRM.</div>}
    >
      <div className="space-y-5">
        <PageTitle title="CRM Activity" description="Feed de eventos auditáveis para contatos, leads, negócios, tarefas e notas." />

        {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

        <DataTable columns={columns} rows={rows} getRowKey={(row) => row.id} loading={loading} emptyMessage="Nenhum evento encontrado." />

        <Pagination page={pageData.page} totalPages={pageData.totalPages} totalElements={totalItems} onPageChange={(nextPage) => void load(nextPage)} />
      </div>
    </PermissionGuard>
  );
}
