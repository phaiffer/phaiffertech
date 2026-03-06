'use client';

import { FormEvent, useEffect, useState } from 'react';
import { crmService } from '@/shared/services/crm-service';
import { CrmContact } from '@/shared/types/crm';
import { PageTitle } from '@/shared/ui/page-title';
import { Table } from '@/shared/ui/table';

export function CrmHome() {
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');

  async function load() {
    try {
      const page = await crmService.listContacts();
      setContacts(page.content);
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
      await crmService.createContact({ firstName, lastName, email });
      setFirstName('');
      setLastName('');
      setEmail('');
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="space-y-5">
      <PageTitle title="CRM" description="Recurso inicial: contatos multi-tenant." />

      <form onSubmit={handleCreate} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-4">
        <input
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder="Nome"
          required
        />
        <input
          value={lastName}
          onChange={(event) => setLastName(event.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder="Sobrenome"
        />
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          placeholder="E-mail"
        />
        <button type="submit" className="rounded-lg bg-action px-4 py-2 text-sm font-medium text-white">
          Novo contato
        </button>
      </form>

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}

      <Table headers={['Nome', 'Email', 'Status']}>
        {contacts.map((contact) => (
          <tr key={contact.id}>
            <td className="px-4 py-2">{`${contact.firstName} ${contact.lastName ?? ''}`.trim()}</td>
            <td className="px-4 py-2">{contact.email ?? '-'}</td>
            <td className="px-4 py-2">{contact.status}</td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
