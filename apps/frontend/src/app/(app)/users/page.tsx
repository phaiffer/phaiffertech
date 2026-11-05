'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { AccountTabs } from '@/modules/account/account-tabs';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { useAuth } from '@/shared/auth/use-auth';
import { usePermissions } from '@/shared/auth/usePermissions';
import { sharedInlineActionsClass, sharedPageStackClass } from '@/shared/components/public-visual-system';
import { StatusBadge } from '@/shared/dashboard/status-badge';
import { useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { resolveApiErrorMessage } from '@/shared/lib/api-error-message';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { userService } from '@/shared/services/user-service';
import { PageResponse } from '@/shared/types/common';
import { PlatformUser } from '@/shared/types/user';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { DataTable, DataTableColumn } from '@/shared/ui/data-table';
import { FormInput } from '@/shared/ui/form-input';
import { FormSection } from '@/shared/ui/form-section';
import { FormSelect } from '@/shared/ui/form-select';
import { PageTitle } from '@/shared/ui/page-title';
import { Pagination } from '@/shared/ui/pagination';

const pageSize = 14;

const initialPage: PageResponse<PlatformUser> = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: pageSize
};

const tenantRoles = [
  'TENANT_OWNER',
  'TENANT_ADMIN',
  'MANAGER',
  'OPERATOR',
  'VIEWER',
  'CUSTOMER_PORTAL_USER'
];
const platformAdminRoles = ['PLATFORM_ADMIN', ...tenantRoles];

export default function UsersPage() {
  const messages = useAppMessages();
  const copy = messages.screens.accountUsers;
  const roleLabels: Record<string, string> = messages.workspaceSettings.overview.roles;
  const { session } = useAuth();
  const { hasPermission } = usePermissions();
  const canReadUsers = hasPermission('USER_READ');
  const canWriteUsers = hasPermission('USER_WRITE');
  const availableRoles = session?.user.platformAdmin ? platformAdminRoles : tenantRoles;

  const [pageData, setPageData] = useState<PageResponse<PlatformUser>>(initialPage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<PlatformUser | null>(null);

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [roleCode, setRoleCode] = useState('OPERATOR');
  const [activeStatus, setActiveStatus] = useState('true');

  const loadUsers = useCallback(async (page = 0) => {
    setLoading(true);
    try {
      setPageData(await userService.list(page, pageSize));
    } catch (err) {
      setError(resolveApiErrorMessage(err, copy.loadError));
    } finally {
      setLoading(false);
    }
  }, [copy.loadError]);

  useEffect(() => {
    if (canReadUsers) {
      void loadUsers();
    }
  }, [canReadUsers, loadUsers]);

  function resetForm() {
    setEditorOpen(false);
    setEditingId(null);
    setEmail('');
    setFullName('');
    setPassword('');
    setRoleCode('OPERATOR');
    setActiveStatus('true');
  }

  function beginCreate() {
    resetForm();
    setError(null);
    setSuccess(null);
    setEditorOpen(true);
  }

  function beginEdit(user: PlatformUser) {
    resetForm();
    setError(null);
    setSuccess(null);
    setEditingId(user.id);
    setEmail(user.email);
    setFullName(user.fullName);
    setRoleCode(user.role);
    setActiveStatus(user.active ? 'true' : 'false');
    setEditorOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canWriteUsers) {
      return;
    }
    if (!editingId && !password) {
      setError(copy.passwordRequired);
      return;
    }

    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      if (editingId) {
        await userService.update(editingId, {
          email,
          fullName,
          password: password || undefined,
          roleCode,
          active: activeStatus === 'true'
        });
        setSuccess(copy.updated.replace('{name}', fullName));
      } else {
        await userService.create({ email, fullName, password, roleCode });
        setSuccess(copy.created.replace('{name}', fullName));
      }
      resetForm();
      await loadUsers(pageData.page);
    } catch (err) {
      setError(resolveApiErrorMessage(err, copy.saveError));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteCandidate) {
      return;
    }

    try {
      await userService.delete(deleteCandidate.id);
      setSuccess(copy.deleted.replace('{name}', deleteCandidate.fullName));
      setDeleteCandidate(null);
      await loadUsers(pageData.page);
    } catch (err) {
      setDeleteCandidate(null);
      setError(resolveApiErrorMessage(err, copy.deleteError));
    }
  }

  const users = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);
  // The stored role may be outside this list, for example an owner edited by a tenant admin.
  const roleOptions = Array.from(new Set([...availableRoles, roleCode])).map((role) => ({
    value: role,
    label: roleLabels[role] ?? role
  }));

  const columns: DataTableColumn<PlatformUser>[] = [
    {
      key: 'name',
      header: copy.columnUser,
      render: (user) => (
        <div>
          <p className="font-medium text-[var(--ink)]">{user.fullName}</p>
          <p className="text-xs text-[var(--ink-2)]">{user.email}</p>
        </div>
      )
    },
    { key: 'role', header: copy.columnRole, render: (user) => roleLabels[user.role] ?? user.role },
    {
      key: 'status',
      header: copy.columnStatus,
      render: (user) => <StatusBadge status={user.active ? 'active' : 'inactive'} />
    },
    {
      key: 'actions',
      header: copy.columnActions,
      render: (user) => (
        <PermissionGuard permission="USER_WRITE">
          <div className={sharedInlineActionsClass}>
            <button type="button" onClick={() => beginEdit(user)} className="ui-inline-button">{copy.edit}</button>
            <button type="button" onClick={() => setDeleteCandidate(user)} className="ui-inline-danger-button">{copy.delete}</button>
          </div>
        </PermissionGuard>
      )
    }
  ];

  const newUserButton = (
    <PermissionGuard permission="USER_WRITE">
      <button type="button" onClick={beginCreate} className="ui-primary-button">{copy.newUser}</button>
    </PermissionGuard>
  );

  return (
    <PermissionGuard
      permission="USER_READ"
      fallback={<div className="ui-notice-warning">{copy.noPermission}</div>}
    >
      <div className={sharedPageStackClass}>
        <AccountTabs />

        <PageTitle
          title={copy.title}
          description={copy.description}
          count={loading ? undefined : totalItems}
          actions={newUserButton}
        />

        {error ? <div className="ui-notice-error">{error}</div> : null}
        {success ? <div className="ui-notice-success">{success}</div> : null}

        {editorOpen ? (
          <form onSubmit={handleSubmit} className="max-w-3xl space-y-4 rounded-md border border-[color:var(--line)] p-4">
            <FormSection title={editingId ? copy.editUser : copy.newUser}>
              <FormInput label={copy.fieldName} value={fullName} onChange={setFullName} disabled={submitting} required />
              <FormInput label={copy.fieldEmail} value={email} onChange={setEmail} type="email" disabled={submitting} required />
              <FormSelect label={copy.fieldRole} value={roleCode} options={roleOptions} onChange={setRoleCode} disabled={submitting} />
              {editingId ? (
                <FormSelect
                  label={copy.fieldStatus}
                  value={activeStatus}
                  options={[
                    { value: 'true', label: copy.statusActive },
                    { value: 'false', label: copy.statusInactive }
                  ]}
                  onChange={setActiveStatus}
                  disabled={submitting}
                />
              ) : null}
              <FormInput
                label={editingId ? copy.fieldNewPassword : copy.fieldTemporaryPassword}
                value={password}
                onChange={setPassword}
                type="password"
                autoComplete="new-password"
                description={editingId ? copy.keepPasswordHint : copy.temporaryPasswordHint}
                disabled={submitting}
                required={!editingId}
              />
            </FormSection>
            <div className="flex gap-2">
              <button type="submit" disabled={submitting} className="ui-primary-button">
                {submitting ? copy.saving : editingId ? copy.saveUser : copy.createUser}
              </button>
              <button type="button" onClick={resetForm} className="ui-secondary-button">{copy.cancel}</button>
            </div>
          </form>
        ) : null}

        <DataTable
          columns={columns}
          rows={users}
          getRowKey={(user) => user.id}
          loading={loading}
          emptyState={{ title: copy.emptyTitle, description: copy.emptyDescription, action: newUserButton }}
        />

        <Pagination
          page={pageData.page}
          totalPages={pageData.totalPages}
          totalElements={totalItems}
          pageSize={pageSize}
          onPageChange={(nextPage) => void loadUsers(nextPage)}
        />

        <ConfirmDialog
          open={Boolean(deleteCandidate)}
          title={copy.deleteTitle}
          description={deleteCandidate ? copy.deleteDescription.replace('{name}', deleteCandidate.fullName) : undefined}
          confirmLabel={copy.delete}
          cancelLabel={copy.cancel}
          onCancel={() => setDeleteCandidate(null)}
          onConfirm={() => void handleDelete()}
        />
      </div>
    </PermissionGuard>
  );
}
