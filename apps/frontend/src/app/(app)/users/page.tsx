'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { useAuth } from '@/shared/auth/use-auth';
import { usePermissions } from '@/shared/auth/usePermissions';
import { sharedPageStackClass, sharedInlineActionsClass } from '@/shared/components/public-visual-system';
import { StatusBadge } from '@/shared/dashboard/status-badge';
import { resolveTotalItems } from '@/shared/lib/pagination';
import { userService } from '@/shared/services/user-service';
import { PageResponse } from '@/shared/types/common';
import { PlatformUser } from '@/shared/types/user';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
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
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<PlatformUser | null>(null);

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [roleCode, setRoleCode] = useState('OPERATOR');
  // Optional active flag just for edits
  const [activeStatus, setActiveStatus] = useState<string>('true');

  async function loadUsers(page = 0) {
    setLoading(true);
    try {
      const data = await userService.list(page, pageSize);
      setPageData(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setEditingId(null);
    setEmail('');
    setFullName('');
    setPassword('');
    setRoleCode('OPERATOR');
    setActiveStatus('true');
    setError(null);
    setSuccess(null);
  }

  function beginCreate() {
    resetForm();
    setIsEditorOpen(true);
  }

  function beginEdit(user: PlatformUser) {
    resetForm();
    setEditingId(user.id);
    setEmail(user.email);
    setFullName(user.fullName);
    setRoleCode(user.role);
    setActiveStatus(user.active ? 'true' : 'false');
    setIsEditorOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canWriteUsers) return;

    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      if (editingId) {
        // Edit mode
        await userService.update(editingId, {
          email,
          fullName,
          password: password || undefined, // Only send if changed
          roleCode,
          active: activeStatus === 'true'
        });
        setSuccess(`User ${fullName} updated successfully.`);
      } else {
        // Create mode
        if (!password) {
           setError("Password is required for new users.");
           setSubmitting(false);
           return;
        }
        await userService.create({ email, fullName, password, roleCode });
        setSuccess(`User ${fullName} created. Please share the temporary password securely.`);
      }
      setIsEditorOpen(false);
      await loadUsers(pageData.page);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteCandidate) return;
    try {
      await userService.delete(deleteCandidate.id);
      setSuccess(`User ${deleteCandidate.fullName} deleted successfully.`);
      setDeleteCandidate(null);
      await loadUsers(pageData.page);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  useEffect(() => {
    if (canReadUsers) {
      void loadUsers();
    }
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
      header: 'Workspace',
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
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (user) => (
         <div className={sharedInlineActionsClass}>
           <PermissionGuard permission="USER_WRITE">
             <button
               type="button"
               onClick={() => beginEdit(user)}
               className="ui-inline-button"
             >
               Edit
             </button>
             <button
               type="button"
               onClick={() => setDeleteCandidate(user)}
               className="ui-inline-danger-button"
             >
               Delete
             </button>
           </PermissionGuard>
         </div>
      )
    }
  ];

  return (
    <PermissionGuard
      permission="USER_READ"
      fallback={<div className="ui-notice-warning">You do not have permission to view users.</div>}
    >
      <div className={sharedPageStackClass}>
        <PageTitle
          eyebrow="Access control"
          title="Users"
          description="Workspace user administration with role, access, and identity signals."
          actions={
            <PermissionGuard permission="USER_WRITE">
              <button onClick={beginCreate} className="ui-primary-button">
                Create user
              </button>
            </PermissionGuard>
          }
        />

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <PageSection
            tone="muted"
            title="Workspace"
            description="Keep access administration anchored to the authenticated workspace before expanding into deeper role policies."
          >
            <div className="space-y-4">
              <div className="ui-notice-neutral">
                The current list is scoped to <strong>{workspaceLabel}</strong> in your authenticated workspace.
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
                    Role options available in this workspace.
                  </p>
                </div>
              </div>
            </div>
          </PageSection>
          
          <div className="flex items-center justify-center p-6 border-2 border-dashed border-[color:var(--app-shell-border)] rounded-xl bg-[color:var(--app-shell-surface-muted)]">
             <div className="text-center">
                 <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--app-shell-panel-muted)] mb-4">
                    <svg className="h-8 w-8 text-[color:var(--app-shell-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                 </div>
                 <h3 className="text-lg font-semibold text-[color:var(--app-shell-heading)]">Manage Access Securely</h3>
                 <p className="mt-2 text-sm text-[color:var(--app-shell-muted)] max-w-sm mx-auto">
                    Centralized workspace to invite team members and define granular permissions safely within your workspace. Use the &quot;Create user&quot; button or edit an existing row in the table below.
                 </p>
             </div>
          </div>
        </div>

        {error ? (
          <div className="ui-notice-error">{error}</div>
        ) : null}

        {success ? (
          <div className="ui-notice-success">{success}</div>
        ) : null}

        <DataTable
          columns={columns}
          rows={users}
          getRowKey={(user) => user.id}
          loading={loading}
          loadingTitle="Loading workspace users"
          loadingDescription="Preparing the users, roles, and access state for the current workspace."
          emptyState={{
            title: 'No users in this workspace yet',
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

        {/* SIDE DRAWER MODAL FOR USER REGISTRATION / UPDATES */}
        {isEditorOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm transition-opacity">
            <div className="w-full max-w-md h-full overflow-y-auto bg-[color:var(--app-shell-surface)] p-[var(--space-6)] shadow-2xl animate-in slide-in-from-right duration-300 border-l border-[color:var(--app-shell-border)]">
              <div className="mb-8 flex items-center justify-between">
                 <div>
                   <h2 className="text-xl font-bold tracking-tight text-[color:var(--app-shell-heading)]">
                     {editingId ? 'Edit workspace user' : 'Create workspace user'}
                   </h2>
                   <p className="text-sm mt-1 text-[color:var(--app-shell-muted)]">
                     {editingId ? 'Adjust role and profile settings' : 'Define access for a new colleague'}
                   </p>
                 </div>
                 <button 
                   onClick={() => setIsEditorOpen(false)} 
                   className="rounded-full p-2 text-[color:var(--app-shell-muted)] hover:bg-[color:var(--app-shell-panel-muted)] hover:text-[color:var(--app-shell-heading)]"
                 >
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
              </div>

              <div className="space-y-6">
                 {!editingId && (
                   <div className="ui-notice-neutral mb-4 text-xs">
                     Choose the initial role deliberately, and share the temporary password only through an approved support channel.
                   </div>
                 )}

                 <form onSubmit={handleSubmit} className="space-y-5 flex flex-col h-full">
                    <FormInput
                      label="Full name"
                      value={fullName}
                      onChange={setFullName}
                      placeholder="Operator One"
                      disabled={submitting}
                      required
                    />
                    <FormInput
                      label="Email"
                      value={email}
                      onChange={setEmail}
                      type="email"
                      placeholder="operator@example.test"
                      disabled={submitting}
                      required
                    />
                    
                    <FormSelect
                      label="Role"
                      value={roleCode}
                      options={roleOptions}
                      onChange={setRoleCode}
                      description="Role scope stays constrained to this workspace."
                      disabled={submitting}
                    />
                    
                    {editingId && (
                      <FormSelect
                        label="Status"
                        value={activeStatus}
                        options={[{value: 'true', label: 'Active (Can login)'}, {value: 'false', label: 'Inactive (Revoked)'}]}
                        onChange={setActiveStatus}
                        description="Temporarily or permanently revoke access."
                        disabled={submitting}
                      />
                    )}

                    <FormInput
                      label={editingId ? 'New password (optional)' : 'Temporary password'}
                      value={password}
                      onChange={setPassword}
                      type="password"
                      placeholder={editingId ? 'Leave blank to keep current' : 'Create a secure password'}
                      description="This password is only shown here during creation or reset."
                      disabled={submitting}
                      required={!editingId}
                    />

                    <div className="mt-8 pt-6 border-t border-[color:var(--app-shell-border)] flex gap-3">
                      <button
                        type="submit"
                        disabled={submitting || !email || !fullName || (!editingId && !password)}
                        className="ui-primary-button"
                      >
                        {submitting ? 'Saving user...' : editingId ? 'Save changes' : 'Create user'}
                      </button>
                      <button type="button" onClick={() => setIsEditorOpen(false)} className="ui-secondary-button">
                        Cancel
                      </button>
                    </div>
                </form>
              </div>

            </div>
          </div>
        )}

        {/* CONFIRM DELETE MODAL */}
        <ConfirmDialog
          open={Boolean(deleteCandidate)}
          title="Delete user"
          description={deleteCandidate ? `Are you sure you want to permanently delete ${deleteCandidate.fullName}? This action cannot be undone.` : undefined}
          confirmLabel="Delete forever"
          onCancel={() => setDeleteCandidate(null)}
          onConfirm={() => void handleDelete()}
        />

      </div>
    </PermissionGuard>
  );
}
