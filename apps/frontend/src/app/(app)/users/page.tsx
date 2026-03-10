'use client';

import { FormEvent, useEffect, useState } from 'react';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { useAuth } from '@/shared/auth/use-auth';
import { usePermissions } from '@/shared/auth/usePermissions';
import { resolvePageItems } from '@/shared/lib/pagination';
import { userService } from '@/shared/services/user-service';
import { PlatformUser } from '@/shared/types/user';
import { PageTitle } from '@/shared/ui/page-title';
import { Table } from '@/shared/ui/table';

export default function UsersPage() {
  const { session } = useAuth();
  const { hasPermission } = usePermissions();
  const canReadUsers = hasPermission('USER_READ');
  const canWriteUsers = hasPermission('USER_WRITE');
  const availableRoles = session?.user.platformAdmin
    ? ['PLATFORM_ADMIN', 'TENANT_OWNER', 'TENANT_ADMIN', 'MANAGER', 'OPERATOR', 'VIEWER', 'CUSTOMER_PORTAL_USER']
    : ['TENANT_OWNER', 'TENANT_ADMIN', 'MANAGER', 'OPERATOR', 'VIEWER', 'CUSTOMER_PORTAL_USER'];
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [roleCode, setRoleCode] = useState('OPERATOR');

  async function loadUsers() {
    try {
      const data = await userService.list();
      setUsers(resolvePageItems(data));
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  useEffect(() => {
    if (!canReadUsers) {
      return;
    }

    void loadUsers();
  }, [canReadUsers]);

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
      await loadUsers();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PermissionGuard
      permission="USER_READ"
      fallback={<div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">Você não possui permissão para visualizar usuários.</div>}
    >
      <div className="space-y-5">
        <PageTitle title="Users" description="Gestão inicial de usuários por tenant com RBAC." />

        <PermissionGuard permission="USER_WRITE">
          <form
            onSubmit={handleCreate}
            className="grid gap-3 rounded-xl border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] p-4 shadow-card md:grid-cols-5"
          >
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="rounded-lg border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel-muted)] px-3 py-2 text-sm text-[color:var(--app-shell-text)]"
              placeholder="Nome completo"
              required
            />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-lg border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel-muted)] px-3 py-2 text-sm text-[color:var(--app-shell-text)]"
              placeholder="E-mail"
              required
            />
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-lg border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel-muted)] px-3 py-2 text-sm text-[color:var(--app-shell-text)]"
              placeholder="Senha"
              required
            />
            <select
              value={roleCode}
              onChange={(event) => setRoleCode(event.target.value)}
              className="rounded-lg border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel-muted)] px-3 py-2 text-sm text-[color:var(--app-shell-text)]"
            >
              {availableRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              style={{ backgroundColor: 'var(--tenant-accent)' }}
            >
              {submitting ? 'Salvando...' : 'Criar usuário'}
            </button>
          </form>
        </PermissionGuard>

        {error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        ) : null}

        <Table headers={['Nome', 'E-mail', 'Role', 'Ativo']}>
          {users.map((user) => (
            <tr key={user.id}>
              <td className="px-4 py-2">{user.fullName}</td>
              <td className="px-4 py-2">{user.email}</td>
              <td className="px-4 py-2">{user.role}</td>
              <td className="px-4 py-2">{user.active ? 'Sim' : 'Não'}</td>
            </tr>
          ))}
        </Table>
      </div>
    </PermissionGuard>
  );
}
