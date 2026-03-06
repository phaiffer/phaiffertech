'use client';

import { FormEvent, useEffect, useState } from 'react';
import { resolvePageItems } from '@/shared/lib/pagination';
import { userService } from '@/shared/services/user-service';
import { PlatformUser } from '@/shared/types/user';
import { PageTitle } from '@/shared/ui/page-title';
import { Table } from '@/shared/ui/table';

const roles = ['TENANT_ADMIN', 'MANAGER', 'OPERATOR', 'VIEWER', 'CUSTOMER_PORTAL_USER'];

export default function UsersPage() {
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
    loadUsers();
  }, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
    <div className="space-y-5">
      <PageTitle title="Users" description="Gestão inicial de usuários por tenant com RBAC." />

      <form onSubmit={handleCreate} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-card md:grid-cols-5">
        <input
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder="Nome completo"
          required
        />
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder="E-mail"
          required
        />
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder="Senha"
          required
        />
        <select
          value={roleCode}
          onChange={(event) => setRoleCode(event.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          {roles.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-action px-4 py-2 text-sm font-medium text-white disabled:bg-blue-300"
        >
          {submitting ? 'Salvando...' : 'Criar usuário'}
        </button>
      </form>

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
  );
}
