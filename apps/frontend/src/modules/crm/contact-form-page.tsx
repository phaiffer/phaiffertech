'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { crmService } from '@/shared/services/crm-service';
import { ApiClientError } from '@/shared/lib/http';
import { FormInput } from '@/shared/ui/form-input';
import { FormSelect } from '@/shared/ui/form-select';
import { PageTitle } from '@/shared/ui/page-title';
import { PermissionGate } from '@/shared/permissions/permission-gate';

const statusOptions = [
  { value: 'ACTIVE', label: 'ACTIVE' },
  { value: 'INACTIVE', label: 'INACTIVE' }
];

type ContactFormPageProps = {
  contactId?: string;
};

export function ContactFormPage({ contactId }: ContactFormPageProps) {
  const router = useRouter();
  const isEdit = Boolean(contactId);
  const requiredPermission = isEdit ? 'crm.contact.update' : 'crm.contact.create';

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [status, setStatus] = useState('ACTIVE');

  useEffect(() => {
    if (!isEdit || !contactId) {
      return;
    }

    setLoading(true);
    crmService.getContact(contactId)
      .then((contact) => {
        setFirstName(contact.firstName);
        setLastName(contact.lastName ?? '');
        setEmail(contact.email ?? '');
        setPhone(contact.phone ?? '');
        setCompany(contact.company ?? '');
        setStatus(contact.status ?? 'ACTIVE');
      })
      .catch((err) => {
        const message = err instanceof ApiClientError ? err.message : 'Erro ao carregar contato.';
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [contactId, isEdit]);

  const title = useMemo(() => (isEdit ? 'Editar contato' : 'Novo contato'), [isEdit]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        firstName,
        lastName: lastName || undefined,
        email: email || undefined,
        phone: phone || undefined,
        company: company || undefined,
        status
      };

      if (isEdit && contactId) {
        await crmService.updateContact(contactId, payload);
        setSuccess('Contato atualizado com sucesso.');
      } else {
        await crmService.createContact(payload);
        setSuccess('Contato criado com sucesso.');
      }

      setTimeout(() => router.push('/crm/contacts'), 600);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Erro ao salvar contato.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PermissionGate
      permission={requiredPermission}
      fallback={<div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">Você não possui permissão para esta ação.</div>}
    >
      <div className="space-y-5">
        <PageTitle title={title} description="Formulário de cadastro/edição de contato CRM." />

        <div className="flex justify-end">
          <Link href="/crm/contacts" className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700">
            Voltar para listagem
          </Link>
        </div>

        {loading ? (
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">Carregando contato...</div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-2">
            <FormInput label="Nome" value={firstName} onChange={setFirstName} required />
            <FormInput label="Sobrenome" value={lastName} onChange={setLastName} />
            <FormInput label="Email" value={email} onChange={setEmail} type="email" />
            <FormInput label="Telefone" value={phone} onChange={setPhone} />
            <FormInput label="Empresa" value={company} onChange={setCompany} />
            <FormSelect label="Status" value={status} options={statusOptions} onChange={setStatus} />

            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-action px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {submitting ? 'Salvando...' : isEdit ? 'Atualizar contato' : 'Criar contato'}
              </button>
            </div>
          </form>
        )}

        {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
        {success ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}
      </div>
    </PermissionGate>
  );
}
