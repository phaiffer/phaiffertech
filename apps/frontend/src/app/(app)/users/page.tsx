'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { useAuth } from '@/shared/auth/use-auth';
import { usePermissions } from '@/shared/auth/usePermissions';
import { sharedPageStackClass } from '@/shared/components/public-visual-system';
import { StatusBadge } from '@/shared/dashboard/status-badge';
import { resolveTotalItems } from '@/shared/lib/pagination';
import { userService } from '@/shared/services/user-service';
import { PageResponse } from '@/shared/types/common';
import { PlatformUser } from '@/shared/types/user';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { FormInput } from '@/shared/ui/form-input';
import { FormSelect } from '@/shared/ui/form-select';
import { PageSection } from '@/shared/ui/page-section';
import { PageTitle } from '@/shared/ui/page-title';
import { Pagination } from '@/shared/ui/pagination';

const pageSize = 10;

const initialPage: PageResponse<PlatformUser> = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: pageSize
};

const platformAdminRoles = [
  'PLATFORM_ADMIN',
  'TENANT_OWNER',
  'TENANT_ADMIN',
  'MANAGER',
  'OPERATOR',
  'VIEWER',
  'CUSTOMER_PORTAL_USER'
];

const tenantRoles = [
  'TENANT_OWNER',
  'TENANT_ADMIN',
  'MANAGER',
  'OPERATOR',
  'VIEWER',
  'CUSTOMER_PORTAL_USER'
];

export default function UsersPage() {
  const { session } = useAuth();
  const { hasPermission } = usePermissions();
  const canReadUsers = hasPermission('USER_READ');
  const canWriteUsers = hasPermission('USER_WRITE');
  const availableRoles = session?.user.platformAdmin ? platformAdminRoles : tenantRoles;
  const [pageData, setPageData] = useState<PageResponse<PlatformUser>>(initialPage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [roleCode, setRoleCode] = useState('OPERATOR');

  async function loadUsers(page = 0) {
    setLoading(true);
    try {
      const data = await userService.list(page, pageSize);
      setPageData(data);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canWriteUsers) {
      return;
    }

    setSubmitting(true);
    try {
      await userService.create({ email, fullName, password, roleCode });
      setEmail('');
      setFullName('');
      setPassword('');
      setRoleCode('OPERATOR');
      await loadUsers(pageData.page);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (!canReadUsers) {
      return;
    }

    void loadUsers();
  }, [canReadUsers]);

  const users = pageData.items ?? pageData.content ?? [];
  const totalItems = resolveTotalItems(pageData);
  const workspaceLabel = session?.user.tenantName ?? 'Current tenant';
  const workspaceCode = session?.user.tenantCode ?? 'workspace';
  const roleOptions = useMemo(
    () => availableRoles.map((role) => ({ value: role, label: role.replace(/_/g, ' ') })),
    [availableRoles]
  );
  const columns: DataTableColumn<PlatformUser>[] = [
    {
      key: 'name',
      header: 'User',
      render: (user) => (
        <div>
          <p className="font-medium text-[color:var(--app-shell-heading)]">{user.fullName}</p>
          <p className="text-xs text-[color:var(--app-shell-muted)]">{user.email}</p>
        </div>
      )
    },
    {
      key: 'role',
      header: 'Role',
      render: (user) => <StatusBadge status={user.role} />
    },
    {
      key: 'workspace',
      header: 'Tenant workspace',
      render: () => (
        <div>
          <p className="font-medium text-[color:var(--app-shell-heading)]">{workspaceLabel}</p>
          <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--app-shell-muted)]">{workspaceCode}</p>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Access',
      render: (user) => <StatusBadge status={user.active ? 'active' : 'inactive'} />
    }
  ];

  return (
    <PermissionGuard
      permission="USER_READ"
      fallback={<div className="ui-notice-warning">Você não possui permissão para visualizar usuários.</div>}
    >
      <div className={sharedPageStackClass}>
        <PageTitle
          eyebrow="Access control"
          title="Users"
          description="Tenant-scoped user administration with clearer role, workspace, and access signals."
        />

        <div className="grid gap-5 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
          <PageSection
            tone="muted"
            title="Tenant scope"
            description="Keep access administration anchored to the authenticated workspace before expanding into deeper role policies."
          >
            <div className="space-y-4">
              <div className="ui-notice-neutral">
                The current list is scoped to <strong>{workspaceLabel}</strong> and uses the active tenant context from your authenticated workspace.
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="ui-surface-panel p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--app-shell-muted)]">
                    Workspace
                  </p>
                  <p className="mt-2 text-base font-semibold text-[color:var(--app-shell-heading)]">{workspaceLabel}</p>
                  <p className="mt-1 text-sm text-[color:var(--app-shell-muted)]">{workspaceCode}</p>
                </div>
                <div className="ui-surface-panel p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--app-shell-muted)]">
                    Available roles
                  </p>
                  <p className="mt-2 text-base font-semibold text-[color:var(--app-shell-heading)]">
                    {availableRoles.length} roles
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--app-shell-muted)]">
                    Tenant-safe role options for this workspace context.
                  </p>
                </div>
              </div>
            </div>
          </PageSection>

          <PermissionGuard permission="USER_WRITE">
            <PageSection
              title="Create workspace user"
              description="Keep temporary credentials and role assignment balanced so new access does not dominate the page visually."
            >
              <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <FormInput
                  label="Full name"
                  value={fullName}
                  onChange={setFullName}
                  placeholder="Operator One"
                  required
                />
                <FormInput
                  label="Email"
                  value={email}
                  onChange={setEmail}
                  type="email"
                  placeholder="operator@example.test"
                  required
                />
                <FormInput
                  label="Temporary password"
                  value={password}
                  onChange={setPassword}
                  placeholder="Create a secure password"
                  required
                />
                <FormSelect
                  label="Role"
                  value={roleCode}
                  options={roleOptions}
                  onChange={setRoleCode}
                />
                <div className="flex flex-wrap items-center gap-3 md:col-span-2 xl:col-span-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="ui-primary-button"
                  >
                    {submitting ? 'Saving user...' : 'Create user'}
                  </button>
                </div>
              </form>
            </PageSection>
          </PermissionGuard>
        </div>

        {error ? (
          <div className="ui-notice-error">{error}</div>
        ) : null}

        <DataTable
          columns={columns}
          rows={users}
          getRowKey={(user) => user.id}
          loading={loading}
          loadingTitle="Loading workspace users"
          loadingDescription="Preparing the users, roles, and access state for the current tenant workspace."
          emptyState={{
            title: 'No users registered in this tenant',
            description:
              'Create the first user to start assigning roles and controlled access inside this workspace.'
          }}
        />

        <Pagination
          page={pageData.page}
          totalPages={pageData.totalPages}
          totalElements={totalItems}
          onPageChange={(nextPage) => void loadUsers(nextPage)}
        />
      </div>
    </PermissionGuard>
  );
}
