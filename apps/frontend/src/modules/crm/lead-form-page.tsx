'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { crmService } from '@/shared/services/crm-service';
import { ApiClientError } from '@/shared/lib/http';
import { FormInput } from '@/shared/ui/form-input';
import { FormSelect } from '@/shared/ui/form-select';
import { PageTitle } from '@/shared/ui/page-title';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';

const statusOptions = [
  { value: 'NEW', label: 'NEW' },
  { value: 'QUALIFIED', label: 'QUALIFIED' },
  { value: 'WON', label: 'WON' },
  { value: 'LOST', label: 'LOST' }
];

type LeadFormPageProps = {
  leadId?: string;
};

export function LeadFormPage({ leadId }: LeadFormPageProps) {
  const router = useRouter();
  const isEdit = Boolean(leadId);
  const requiredPermission = isEdit ? 'crm.lead.update' : 'crm.lead.create';

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState('');
  const [status, setStatus] = useState('NEW');

  useEffect(() => {
    if (!isEdit || !leadId) {
      return;
    }

    setLoading(true);
    crmService.getLead(leadId)
      .then((lead) => {
        setName(lead.name);
        setEmail(lead.email ?? '');
        setPhone(lead.phone ?? '');
        setSource(lead.source ?? '');
        setStatus(lead.status ?? 'NEW');
      })
      .catch((err) => {
        const message = err instanceof ApiClientError ? err.message : 'Erro ao carregar lead.';
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [isEdit, leadId]);

  const title = useMemo(() => (isEdit ? 'Editar lead' : 'Novo lead'), [isEdit]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        name,
        email: email || undefined,
        phone: phone || undefined,
        source: source || undefined,
        status
      };

      if (isEdit && leadId) {
        await crmService.updateLead(leadId, payload);
        setSuccess('Lead atualizado com sucesso.');
      } else {
        await crmService.createLead(payload);
        setSuccess('Lead criado com sucesso.');
      }

      setTimeout(() => router.push('/crm/leads'), 600);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Erro ao salvar lead.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PermissionGuard
      permission={requiredPermission}
      fallback={<div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">Você não possui permissão para esta ação.</div>}
    >
      <div className="space-y-5">
        <PageTitle title={title} description="Formulário de cadastro/edição de lead CRM." />

        <div className="flex justify-end">
          <Link href="/crm/leads" className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700">
            Voltar para listagem
          </Link>
        </div>

        {loading ? (
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">Carregando lead...</div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-2">
            <FormInput label="Nome" value={name} onChange={setName} required />
            <FormInput label="Email" value={email} onChange={setEmail} type="email" />
            <FormInput label="Telefone" value={phone} onChange={setPhone} />
            <FormInput label="Origem" value={source} onChange={setSource} />
            <FormSelect label="Status" value={status} options={statusOptions} onChange={setStatus} />

            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-action px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {submitting ? 'Salvando...' : isEdit ? 'Atualizar lead' : 'Criar lead'}
              </button>
            </div>
          </form>
        )}

        {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
        {success ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}
      </div>
    </PermissionGuard>
  );
}
