'use client';

import { FormEvent, useEffect, useState } from 'react';
import { resolvePageItems } from '@/shared/lib/pagination';
import { petService } from '@/shared/services/pet-service';
import { PetClient } from '@/shared/types/pet';
import { PageTitle } from '@/shared/ui/page-title';
import { Table } from '@/shared/ui/table';

export function PetHome() {
  const [clients, setClients] = useState<PetClient[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  async function load() {
    try {
      const page = await petService.listClients();
      setClients(resolvePageItems(page));
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await petService.createClient({ fullName, email, phone });
      setFullName('');
      setEmail('');
      setPhone('');
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="space-y-5">
      <PageTitle title="Pet" description="Recurso inicial: clientes do módulo pet." />

      <form onSubmit={handleCreate} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-4">
        <input
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder="Nome do cliente"
          required
        />
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder="E-mail"
        />
        <input
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder="Telefone"
        />
        <button type="submit" className="rounded-lg bg-action px-4 py-2 text-sm font-medium text-white">
          Novo cliente
        </button>
      </form>

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}

      <Table headers={['Nome', 'Email', 'Telefone']}>
        {clients.map((client) => (
          <tr key={client.id}>
            <td className="px-4 py-2">{client.fullName}</td>
            <td className="px-4 py-2">{client.email ?? '-'}</td>
            <td className="px-4 py-2">{client.phone ?? '-'}</td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
