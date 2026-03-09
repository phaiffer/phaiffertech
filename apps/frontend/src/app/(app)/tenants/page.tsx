'use client';

import { useEffect, useState } from 'react';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { usePermissions } from '@/shared/auth/usePermissions';
import { resolvePageItems } from '@/shared/lib/pagination';
import { tenantService } from '@/shared/services/tenant-service';
import { Tenant } from '@/shared/types/tenant';
import { PageTitle } from '@/shared/ui/page-title';
import { Table } from '@/shared/ui/table';

export default function TenantsPage() {
  const { hasPermission } = usePermissions();
  const canReadTenants = hasPermission('TENANT_READ');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canReadTenants) {
      return;
    }

    tenantService
      .list()
      .then((page) => setTenants(resolvePageItems(page)))
      .catch((err: Error) => setError(err.message));
  }, [canReadTenants]);

  return (
    <PermissionGuard
      permission="TENANT_READ"
      fallback={<div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">Você não possui permissão para visualizar tenants.</div>}
    >
      <div className="space-y-5">
        <PageTitle title="Tenants" description="Gestão de tenants da plataforma." />

        {error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        ) : (
          <Table headers={['ID', 'Nome', 'Código', 'Status']}>
            {tenants.map((tenant) => (
              <tr key={tenant.id}>
                <td className="px-4 py-2 font-mono text-xs text-slate-500">{tenant.id}</td>
                <td className="px-4 py-2">{tenant.name}</td>
                <td className="px-4 py-2">{tenant.code}</td>
                <td className="px-4 py-2">{tenant.status}</td>
              </tr>
            ))}
          </Table>
        )}
      </div>
    </PermissionGuard>
  );
}
