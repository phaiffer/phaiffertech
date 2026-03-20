'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { crmService } from '@/shared/services/crm-service';
import { ApiClientError } from '@/shared/lib/http';
import { resolvePageItems } from '@/shared/lib/pagination';
import { CrmCompany, CrmContact } from '@/shared/types/crm';
import { FormInput } from '@/shared/ui/form-input';
import { FormSelect } from '@/shared/ui/form-select';
import { FormTextarea } from '@/shared/ui/form-textarea';
import { PageSection } from '@/shared/ui/page-section';
import { PageTitle } from '@/shared/ui/page-title';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { sharedPageStackClass } from '@/shared/components/public-visual-system';

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
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [companies, setCompanies] = useState<CrmCompany[]>([]);
  const [contacts, setContacts] = useState<CrmContact[]>([]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [contactId, setContactId] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('NEW');

  useEffect(() => {
    let active = true;

    setLoadingCompanies(true);
    crmService.listCompanies(0, 100)
      .then((companiesPage) => {
        if (!active) {
          return;
        }
        setCompanies(resolvePageItems(companiesPage));
      })
      .catch((err) => {
        if (!active) {
          return;
        }
        const message = err instanceof ApiClientError ? err.message : 'Erro ao carregar companies para o lead.';
        setError((current) => current ?? message);
      })
      .finally(() => {
        if (active) {
          setLoadingCompanies(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    setLoadingContacts(true);
    crmService.listContacts(0, 100, '', {
      companyId: companyId || undefined
    })
      .then((contactsPage) => {
        if (!active) {
          return;
        }
        setContacts(resolvePageItems(contactsPage));
      })
      .catch((err) => {
        if (!active) {
          return;
        }
        const message = err instanceof ApiClientError ? err.message : 'Erro ao carregar contatos para vínculo.';
        setError((current) => current ?? message);
      })
      .finally(() => {
        if (active) {
          setLoadingContacts(false);
        }
      });

    return () => {
      active = false;
    };
  }, [companyId]);

  useEffect(() => {
    if (!isEdit || !leadId) {
      return;
    }

    let active = true;
    setLoading(true);
    crmService.getLead(leadId)
      .then((lead) => {
        if (!active) {
          return;
        }
        setName(lead.name);
        setEmail(lead.email ?? '');
        setPhone(lead.phone ?? '');
        setSource(lead.source ?? '');
        setCompanyId(lead.companyId ?? '');
        setContactId(lead.contactId ?? '');
        setNotes(lead.notes ?? '');
        setStatus(lead.status ?? 'NEW');
      })
      .catch((err) => {
        if (!active) {
          return;
        }
        const message = err instanceof ApiClientError ? err.message : 'Erro ao carregar lead.';
        setError(message);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [isEdit, leadId]);

  const title = useMemo(() => (isEdit ? 'Editar lead' : 'Novo lead'), [isEdit]);
  const companyOptions = useMemo(() => [
    { value: '', label: loadingCompanies ? 'Carregando companies...' : 'Sem company vinculada' },
    ...companies.map((company) => ({
      value: company.id,
      label: company.name
    }))
  ], [companies, loadingCompanies]);
  const contactOptions = useMemo(() => [
    { value: '', label: loadingContacts ? 'Carregando contatos...' : 'Nenhum contato relacionado' },
    ...contacts.map((contact) => ({
      value: contact.id,
      label: `${contact.firstName} ${contact.lastName ?? ''}`.trim()
    }))
  ], [contacts, loadingContacts]);

  function handleCompanyChange(nextCompanyId: string) {
    setCompanyId(nextCompanyId);
    setContactId('');
  }

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
        companyId: companyId || undefined,
        contactId: contactId || undefined,
        notes: notes.trim() || undefined,
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
      fallback={<div className="ui-notice-warning">Você não possui permissão para esta ação.</div>}
    >
      <div className={sharedPageStackClass}>
        <PageTitle
          eyebrow="CRM workspace"
          title={title}
          description="Formulário de cadastro/edição de lead CRM."
          actions={(
            <Link href="/crm/leads" className="ui-secondary-button">
              Voltar para listagem
            </Link>
          )}
        />

        {loading ? (
          <PageSection>
            <div className="text-sm text-[color:var(--app-shell-muted)]">Carregando lead...</div>
          </PageSection>
        ) : (
          <PageSection
            title={isEdit ? 'Lead details' : 'Lead capture'}
            description="Keep the company, contact, and commercial context aligned so future CRM drill-down pages inherit a stable composition."
          >
            <form onSubmit={handleSubmit} className="grid gap-4 xl:grid-cols-2">
              <FormInput label="Nome" value={name} onChange={setName} required />
              <FormInput label="Email" value={email} onChange={setEmail} type="email" />
              <FormInput label="Telefone" value={phone} onChange={setPhone} />
              <FormInput label="Origem" value={source} onChange={setSource} />
              <FormSelect
                label="Company relacionada"
                value={companyId}
                options={companyOptions}
                onChange={handleCompanyChange}
                disabled={loadingCompanies}
              />
              <FormSelect
                label="Contato relacionado"
                value={contactId}
                options={contactOptions}
                onChange={setContactId}
                disabled={loadingContacts}
              />
              <FormSelect label="Status" value={status} options={statusOptions} onChange={setStatus} />
              <div className="hidden xl:block" />
              <FormTextarea
                label="Observações comerciais"
                value={notes}
                onChange={setNotes}
                rows={4}
                wrapperClassName="xl:col-span-2"
              />

              <div className="flex flex-wrap items-center gap-3 xl:col-span-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="ui-primary-button"
                >
                  {submitting ? 'Salvando...' : isEdit ? 'Atualizar lead' : 'Criar lead'}
                </button>
              </div>
            </form>
          </PageSection>
        )}

        {error ? <div className="ui-notice-error">{error}</div> : null}
        {success ? <div className="ui-notice-success">{success}</div> : null}
      </div>
    </PermissionGuard>
  );
}
