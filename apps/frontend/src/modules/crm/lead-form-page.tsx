'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  sharedCompactTextClass,
  sharedFormActionsClass,
  sharedPageStackClass
} from '@/shared/components/public-visual-system';
import { petCommercialPermissions } from '@/shared/auth/pet-commercial-permissions';
import {
  petCommercialService,
  type CreatePetCommercialLeadInput,
  type UpdatePetCommercialLeadInput
} from '@/shared/services/pet-commercial-service';
import { ApiClientError } from '@/shared/lib/http';
import { resolvePageItems } from '@/shared/lib/pagination';
import { PetCommercialAccount, PetCommercialSupportContact } from '@/shared/types/pet-commercial';
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
  surface?: 'crm' | 'pet';
};

export function LeadFormPage({ leadId, surface = 'crm' }: LeadFormPageProps) {
  const router = useRouter();
  const isPetSurface = surface === 'pet';
  const isEdit = Boolean(leadId);
  const commercialService = petCommercialService;
  const listPath = isPetSurface ? '/pet/commercial?tab=leads' : '/crm/leads';
  const leadPermissions = petCommercialPermissions.leads;
  const requiredPermission = isEdit ? leadPermissions.update : leadPermissions.create;

  const [loading, setLoading] = useState(isEdit);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [companies, setCompanies] = useState<PetCommercialAccount[]>([]);
  const [contacts, setContacts] = useState<PetCommercialSupportContact[]>([]);

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
    commercialService.listCompanies(0, 100)
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
        const message = err instanceof ApiClientError
          ? err.message
          : isPetSurface
            ? 'Erro ao carregar contas comerciais para o lead.'
            : 'Erro ao carregar companies para o lead.';
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
  }, [commercialService, isPetSurface]);

  useEffect(() => {
    let active = true;

    setLoadingContacts(true);
    commercialService.listContacts(0, 100, '', {
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
        const message = err instanceof ApiClientError
          ? err.message
          : isPetSurface
            ? 'Erro ao carregar contatos de apoio para o lead.'
            : 'Erro ao carregar contatos para vínculo.';
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
  }, [commercialService, companyId, isPetSurface]);

  useEffect(() => {
    if (!isEdit || !leadId) {
      return;
    }

    let active = true;
    setLoading(true);
    commercialService.getLead(leadId)
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
        const message = err instanceof ApiClientError
          ? err.message
          : isPetSurface
            ? 'Erro ao carregar lead comercial.'
            : 'Erro ao carregar lead.';
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
  }, [commercialService, isEdit, isPetSurface, leadId]);

  const title = useMemo(() => {
    if (isPetSurface) {
      return isEdit ? 'Editar lead comercial' : 'Novo lead comercial';
    }

    return isEdit ? 'Editar lead' : 'Novo lead';
  }, [isEdit, isPetSurface]);
  const companyOptions = useMemo(() => [
    {
      value: '',
      label: loadingCompanies
        ? (isPetSurface ? 'Carregando contas comerciais...' : 'Carregando companies...')
        : (isPetSurface ? 'Sem conta comercial vinculada' : 'Sem company vinculada')
    },
    ...companies.map((company) => ({
      value: company.id,
      label: company.name
    }))
  ], [companies, isPetSurface, loadingCompanies]);
  const contactOptions = useMemo(() => [
    {
      value: '',
      label: loadingContacts
        ? (isPetSurface ? 'Carregando contatos de apoio...' : 'Carregando contatos...')
        : (isPetSurface ? 'Nenhum contato de apoio relacionado' : 'Nenhum contato relacionado')
    },
    ...contacts.map((contact) => ({
      value: contact.id,
      label: `${contact.firstName} ${contact.lastName ?? ''}`.trim()
    }))
  ], [contacts, isPetSurface, loadingContacts]);
  const selectedCompanyLabel = companyOptions.find((option) => option.value === companyId)?.label ?? (isPetSurface ? 'Sem conta comercial vinculada' : 'Sem company vinculada');
  const selectedContactLabel = contactOptions.find((option) => option.value === contactId)?.label ?? (isPetSurface ? 'Nenhum contato de apoio relacionado' : 'Nenhum contato relacionado');

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
      const basePayload: CreatePetCommercialLeadInput = {
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
        const payload: UpdatePetCommercialLeadInput = {
          ...basePayload,
          status
        };
        await commercialService.updateLead(leadId, payload);
        setSuccess(isPetSurface ? 'Lead comercial atualizado com sucesso.' : 'Lead atualizado com sucesso.');
      } else {
        await commercialService.createLead(basePayload);
        setSuccess(isPetSurface ? 'Lead comercial criado com sucesso.' : 'Lead criado com sucesso.');
      }

      setTimeout(() => router.push(listPath), 600);
    } catch (err) {
      const message = err instanceof ApiClientError
        ? err.message
        : isPetSurface
          ? 'Erro ao salvar lead comercial.'
          : 'Erro ao salvar lead.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PermissionGuard
      permission={requiredPermission}
      fallback={(
        <div className="ui-notice-warning">
          {isPetSurface
            ? 'Você não possui permissão para esta ação comercial do PetFlow.'
            : 'Você não possui permissão para esta ação.'}
        </div>
      )}
    >
      <div className={sharedPageStackClass}>
        <PageTitle
          eyebrow={isPetSurface ? 'PetFlow commercial' : 'CRM workspace'}
          title={title}
          description={isPetSurface
            ? 'Cadastre e qualifique leads no contexto comercial do PetFlow. Os vínculos de conta e contato permanecem como camada temporária de compatibilidade.'
            : 'Formulário de cadastro/edição de lead comercial.'}
          actions={(
            <Link href={listPath} className="ui-secondary-button">
              {isPetSurface ? 'Voltar para o comercial' : 'Voltar para listagem'}
            </Link>
          )}
        />

        {loading ? (
          <PageSection>
            <div className="text-sm text-[color:var(--app-shell-muted)]">
              {isPetSurface ? 'Carregando lead comercial...' : 'Carregando lead...'}
            </div>
          </PageSection>
        ) : (
          <>
            <PageSection
              tone="muted"
              title={isPetSurface ? 'Contexto comercial' : 'Workflow context'}
              description={isPetSurface
                ? 'Mantenha captação, relacionamento e conversão legados explícitos antes de editar o payload do lead.'
                : 'Keep the commercial mode, relationship links, and downstream CRM context explicit before editing the lead payload itself.'}
            >
              <div className="grid gap-4 xl:grid-cols-2">
                <div className="ui-surface-muted p-4 lg:p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--tenant-accent)]">
                    {isPetSurface ? 'Modo comercial' : 'Record mode'}
                  </p>
                  <p className="mt-3 text-base font-semibold text-[color:var(--app-shell-heading)]">
                    {isPetSurface
                      ? (isEdit ? 'Atualizando um lead em andamento' : 'Capturando um novo lead comercial')
                      : (isEdit ? 'Updating an existing lead' : 'Creating a new lead')}
                  </p>
                  <p className={`mt-2 ${sharedCompactTextClass}`}>
                    {isPetSurface
                      ? 'Mantenha qualificação, contexto de relacionamento e notas alinhados para que o lead siga coerente dentro do comercial do PetFlow.'
                      : 'Keep qualification, relationship context, and notes aligned so list and detail pages read the same way across the CRM workspace.'}
                  </p>
                </div>

                <div className="ui-surface-muted p-4 lg:p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--tenant-accent)]">
                    {isPetSurface ? 'Contexto atual' : 'Current relationship'}
                  </p>
                  <p className="mt-3 text-base font-semibold text-[color:var(--app-shell-heading)]">
                    {selectedCompanyLabel}
                  </p>
                  <p className={`mt-2 ${sharedCompactTextClass}`}>
                    {isPetSurface ? 'Contato de apoio' : 'Contact'}: {selectedContactLabel}
                  </p>
                </div>
              </div>
            </PageSection>

            <PageSection
              title={isPetSurface
                ? (isEdit ? 'Detalhes do lead comercial' : 'Captação do lead comercial')
                : (isEdit ? 'Lead details' : 'Lead capture')}
              description={isPetSurface
                ? 'Agrupe identidade, relacionamento e notas comerciais para preparar a conversão sem reviver uma superfície separada de CRM.'
                : 'Group the core identity fields, relationship selectors, and sales notes so the form stays dense without feeling cramped.'}
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 xl:grid-cols-2">
                  <FormInput label={isPetSurface ? 'Nome do lead' : 'Nome'} value={name} onChange={setName} required />
                  <FormSelect label="Status" value={status} options={statusOptions} onChange={setStatus} />
                  <FormInput label={isPetSurface ? 'Email do lead' : 'Email'} value={email} onChange={setEmail} type="email" />
                  <FormInput label={isPetSurface ? 'Telefone do lead' : 'Telefone'} value={phone} onChange={setPhone} />
                  <FormInput label={isPetSurface ? 'Origem comercial' : 'Origem'} value={source} onChange={setSource} />
                  <div className="hidden xl:block" />
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  <FormSelect
                    label={isPetSurface ? 'Conta comercial (legado)' : 'Company relacionada'}
                    value={companyId}
                    options={companyOptions}
                    onChange={handleCompanyChange}
                    disabled={loadingCompanies}
                    description={isPetSurface
                      ? 'A conta comercial continua disponível apenas como compatibilidade enquanto o modelo do PetFlow absorve a conversão.'
                      : 'A seleção da company mantém o vínculo comercial e redefine a lista de contatos disponíveis.'}
                  />
                  <FormSelect
                    label={isPetSurface ? 'Contato de apoio (opcional)' : 'Contato relacionado'}
                    value={contactId}
                    options={contactOptions}
                    onChange={setContactId}
                    disabled={loadingContacts}
                    description={isPetSurface
                      ? 'Use um contato de apoio quando ele ainda for necessário para preservar o relacionamento legado do lead.'
                      : 'O contato acompanha a company selecionada quando houver relacionamento comercial definido.'}
                  />
                </div>

                <FormTextarea
                  label="Observações comerciais"
                  value={notes}
                  onChange={setNotes}
                  rows={5}
                  description={isPetSurface
                    ? 'Use este campo para registrar o contexto comercial que precisa sobreviver entre captação, qualificação e conversão para cliente.'
                    : 'Use este campo para registrar o contexto comercial que precisa sobreviver entre a captura, a qualificação e a conversão.'}
                />

                <div className={sharedFormActionsClass}>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="ui-primary-button"
                  >
                    {submitting
                      ? 'Salvando...'
                      : isPetSurface
                        ? isEdit ? 'Atualizar lead comercial' : 'Criar lead comercial'
                        : isEdit ? 'Atualizar lead' : 'Criar lead'}
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
