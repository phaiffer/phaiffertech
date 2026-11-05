'use client';

import { useCallback, useEffect, useState } from 'react';
import { AccountTabs } from '@/modules/account/account-tabs';
import { TenantEditor } from '@/modules/account/tenant-editor';
import { resolvePlanCode } from '@/modules/account/tenant-plans';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { useAuth } from '@/shared/auth/use-auth';
import { usePermissions } from '@/shared/auth/usePermissions';
import { sharedPageStackClass } from '@/shared/components/public-visual-system';
import { StatusBadge } from '@/shared/dashboard/status-badge';
import { useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { resolveApiErrorMessage } from '@/shared/lib/api-error-message';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { filterVisibleWorkspaceModuleCodes } from '@/shared/modules/visible-product-modules';
import { tenantService } from '@/shared/services/tenant-service';
import { PageResponse } from '@/shared/types/common';
import { Tenant } from '@/shared/types/tenant';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { PageTitle } from '@/shared/ui/page-title';
import { Pagination } from '@/shared/ui/pagination';

const pageSize = 14;

const initialPage: PageResponse<Tenant> = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: pageSize
};

type EditorState = { open: false } | { open: true; tenant: Tenant | null };

export default function TenantsPage() {
  const copy = useAppMessages().screens.accountTenants;
  const { session } = useAuth();
  const { hasPermission } = usePermissions();
  const canReadTenants = hasPermission('TENANT_READ');
  const canWriteTenants = hasPermission('TENANT_WRITE');
  const canManagePlatform = Boolean(session?.user.platformAdmin);

  const [pageData, setPageData] = useState<PageResponse<Tenant>>(initialPage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorState>({ open: false });

  const loadTenants = useCallback(async (page = 0) => {
    setLoading(true);
    try {
      setPageData(await tenantService.list(page, pageSize));
      setError(null);
    } catch (err) {
      setError(resolveApiErrorMessage(err, copy.loadError));
    } finally {
      setLoading(false);
    }
  }, [copy.loadError]);

  useEffect(() => {
    if (canReadTenants && canManagePlatform) {
      void loadTenants();
    }
  }, [canManagePlatform, canReadTenants, loadTenants]);

  function openEditor(tenant: Tenant | null) {
    setSuccess(null);
    setEditor({ open: true, tenant });
  }

  function handleSaved(message: string) {
    setEditor({ open: false });
    setSuccess(message);
    void loadTenants(pageData.page);
  }

  const tenants = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);
  const planCopy: Record<string, { label: string }> = copy.plans;

  const columns: DataTableColumn<Tenant>[] = [
    {
      key: 'tenant',
      header: copy.columnTenant,
      render: (tenant) => (
        <div>
          <p className="font-medium text-[var(--ink)]">{tenant.name}</p>
          <p className="ui-mono text-xs text-[var(--ink-2)]">{tenant.code}</p>
        </div>
      )
    },
    {
      key: 'plan',
      header: copy.columnPlan,
      render: (tenant) => (
        <div>
          <p className="text-[var(--ink)]">{planCopy[resolvePlanCode(tenant.planCode)].label}</p>
          <p className="ui-mono text-xs text-[var(--ink-2)]">{tenant.planCode ?? '-'}</p>
        </div>
      )
    },
    {
      key: 'modules',
      header: copy.columnModules,
      render: (tenant) => (
        <span className="ui-mono text-xs text-[var(--ink-2)]">{filterVisibleWorkspaceModuleCodes(tenant.contractedModules).join(', ')}</span>
      )
    },
    { key: 'status', header: copy.columnStatus, render: (tenant) => <StatusBadge status={tenant.status} /> },
    {
      key: 'actions',
      header: copy.columnActions,
      render: (tenant) => (canWriteTenants ? (
        <button type="button" onClick={() => openEditor(tenant)} className="ui-inline-button">{copy.edit}</button>
      ) : null)
    }
  ];

  const newTenantButton = canWriteTenants ? (
    <button type="button" onClick={() => openEditor(null)} className="ui-primary-button">{copy.newTenant}</button>
  ) : undefined;

  return (
    <PermissionGuard
      permission="TENANT_READ"
      fallback={<div className="ui-notice-warning">{copy.noPermission}</div>}
    >
      {!canManagePlatform ? (
        <div className="ui-notice-warning">{copy.platformOnly}</div>
      ) : (
        <div className={sharedPageStackClass}>
          <AccountTabs />

          <PageTitle
            title={copy.title}
            description={copy.description}
            count={loading ? undefined : totalItems}
            actions={newTenantButton}
          />

          {error ? <div className="ui-notice-error">{error}</div> : null}
          {success ? <div className="ui-notice-success">{success}</div> : null}

          {editor.open ? (
            <TenantEditor
              key={editor.tenant?.id ?? 'new'}
              tenant={editor.tenant}
              onSaved={handleSaved}
              onCancel={() => setEditor({ open: false })}
            />
          ) : null}

          <DataTable
            columns={columns}
            rows={tenants}
            getRowKey={(tenant) => tenant.id}
            loading={loading}
            emptyState={{ title: copy.emptyTitle, description: copy.emptyDescription, action: newTenantButton }}
          />

          <Pagination
            page={pageData.page}
            totalPages={pageData.totalPages}
            totalElements={totalItems}
            pageSize={pageSize}
            onPageChange={(nextPage) => void loadTenants(nextPage)}
          />
        </div>
      )}
    </PermissionGuard>
  );
}
