'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  sharedCompactTextClass,
  sharedFormActionsClass,
  sharedPageStackClass
} from '@/shared/components/public-visual-system';
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
  const selectedCompanyLabel = companyOptions.find((option) => option.value === companyId)?.label ?? 'Sem company vinculada';
  const selectedContactLabel = contactOptions.find((option) => option.value === contactId)?.label ?? 'Nenhum contato relacionado';

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
          <>
            <PageSection
              tone="muted"
              title="Workflow context"
              description="Keep the commercial mode, relationship links, and downstream CRM context explicit before editing the lead payload itself."
            >
              <div className="grid gap-4 xl:grid-cols-2">
                <div className="ui-surface-muted p-4 lg:p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--tenant-accent)]">
                    Record mode
                  </p>
                  <p className="mt-3 text-base font-semibold text-[color:var(--app-shell-heading)]">
                    {isEdit ? 'Updating an existing lead' : 'Creating a new lead'}
                  </p>
                  <p className={`mt-2 ${sharedCompactTextClass}`}>
                    Keep qualification, relationship context, and notes aligned so list and detail pages read the same way across the CRM workspace.
                  </p>
                </div>

                <div className="ui-surface-muted p-4 lg:p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--tenant-accent)]">
                    Current relationship
                  </p>
                  <p className="mt-3 text-base font-semibold text-[color:var(--app-shell-heading)]">
                    {selectedCompanyLabel}
                  </p>
                  <p className={`mt-2 ${sharedCompactTextClass}`}>Contact: {selectedContactLabel}</p>
                </div>
              </div>
            </PageSection>

            <PageSection
              title={isEdit ? 'Lead details' : 'Lead capture'}
              description="Group the core identity fields, relationship selectors, and sales notes so the form stays dense without feeling cramped."
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 xl:grid-cols-2">
                  <FormInput label="Nome" value={name} onChange={setName} required />
                  <FormSelect label="Status" value={status} options={statusOptions} onChange={setStatus} />
                  <FormInput label="Email" value={email} onChange={setEmail} type="email" />
                  <FormInput label="Telefone" value={phone} onChange={setPhone} />
                  <FormInput label="Origem" value={source} onChange={setSource} />
                  <div className="hidden xl:block" />
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  <FormSelect
                    label="Company relacionada"
                    value={companyId}
                    options={companyOptions}
                    onChange={handleCompanyChange}
                    disabled={loadingCompanies}
                    description="A seleção da company mantém o vínculo comercial e redefine a lista de contatos disponíveis."
                  />
                  <FormSelect
                    label="Contato relacionado"
                    value={contactId}
                    options={contactOptions}
                    onChange={setContactId}
                    disabled={loadingContacts}
                    description="O contato acompanha a company selecionada quando houver relacionamento comercial definido."
                  />
                </div>

                <FormTextarea
                  label="Observações comerciais"
                  value={notes}
                  onChange={setNotes}
                  rows={5}
                  description="Use este campo para registrar o contexto comercial que precisa sobreviver entre a captura, a qualificação e a conversão."
                />

                <div className={sharedFormActionsClass}>
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
          </>
        )}

        {error ? <div className="ui-notice-error">{error}</div> : null}
        {success ? <div className="ui-notice-success">{success}</div> : null}
      </div>
    </PermissionGuard>
  );
}
