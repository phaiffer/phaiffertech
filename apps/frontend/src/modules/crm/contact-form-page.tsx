'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { crmService } from '@/shared/services/crm-service';
import { petClientContactSupportService } from '@/shared/services/pet-client-contact-support-service';
import { ApiClientError } from '@/shared/lib/http';
import { resolvePageItems } from '@/shared/lib/pagination';
import { CrmCompany } from '@/shared/types/crm';
import { FormInput } from '@/shared/ui/form-input';
import { FormSelect } from '@/shared/ui/form-select';
import { PageTitle } from '@/shared/ui/page-title';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';

const statusOptions = [
  { value: 'ACTIVE', label: 'ACTIVE' },
  { value: 'INACTIVE', label: 'INACTIVE' }
];

type ContactFormPageProps = {
  contactId?: string;
  surface?: 'crm' | 'pet';
};

export function ContactFormPage({ contactId, surface = 'crm' }: ContactFormPageProps) {
  const router = useRouter();
  const isPetSurface = surface === 'pet';
  const isEdit = Boolean(contactId);
  const contactService = isPetSurface ? petClientContactSupportService : crmService;
  const basePath = isPetSurface ? '/pet/clients/contacts' : '/crm/contacts';
  const requiredPermission = isEdit ? 'crm.contact.update' : 'crm.contact.create';

  const [loading, setLoading] = useState(isEdit);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [companies, setCompanies] = useState<CrmCompany[]>([]);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [manualCompany, setManualCompany] = useState('');
  const [status, setStatus] = useState('ACTIVE');

  useEffect(() => {
    if (isPetSurface) {
      setCompanies([]);
      setLoadingCompanies(false);
      return;
    }

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
        const message = err instanceof ApiClientError ? err.message : 'Erro ao carregar companies para vínculo.';
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
  }, [isPetSurface]);

  useEffect(() => {
    if (!isEdit || !contactId) {
      return;
    }

    let active = true;
    setLoading(true);
    contactService.getContact(contactId)
      .then((contact) => {
        if (!active) {
          return;
        }
        setFirstName(contact.firstName);
        setLastName(contact.lastName ?? '');
        setEmail(contact.email ?? '');
        setPhone(contact.phone ?? '');
        setCompanyId(contact.companyId ?? '');
        setManualCompany(contact.company ?? '');
        setStatus(contact.status ?? 'ACTIVE');
      })
      .catch((err) => {
        if (!active) {
          return;
        }
        const message = err instanceof ApiClientError
          ? err.message
          : isPetSurface
            ? 'Erro ao carregar contato de apoio.'
            : 'Erro ao carregar contato.';
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
  }, [contactId, contactService, isEdit, isPetSurface]);

  const title = useMemo(() => {
    if (isPetSurface) {
      return isEdit ? 'Editar contato de apoio' : 'Novo contato de apoio';
    }

    return isEdit ? 'Editar contato' : 'Novo contato';
  }, [isEdit, isPetSurface]);
  const companyOptions = useMemo(() => [
    { value: '', label: loadingCompanies ? 'Carregando companies...' : 'Sem vínculo com company' },
    ...companies.map((company) => ({
      value: company.id,
      label: company.name
    }))
  ], [companies, loadingCompanies]);

  function handleCompanyChange(nextCompanyId: string) {
    setCompanyId(nextCompanyId);
    if (nextCompanyId) {
      setManualCompany('');
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const normalizedCompanyId = companyId.trim() || undefined;
      const normalizedManualCompany = normalizedCompanyId
        ? undefined
        : manualCompany.trim() || undefined;
      const payload = {
        firstName,
        lastName: lastName || undefined,
        email: email || undefined,
        phone: phone || undefined,
        ...(normalizedCompanyId ? { companyId: normalizedCompanyId } : {}),
        ...(normalizedManualCompany ? { company: normalizedManualCompany } : {}),
        status
      };

      if (isEdit && contactId) {
        await contactService.updateContact(contactId, payload);
        setSuccess(isPetSurface ? 'Contato de apoio atualizado com sucesso.' : 'Contato atualizado com sucesso.');
      } else {
        await contactService.createContact(payload);
        setSuccess(isPetSurface ? 'Contato de apoio criado com sucesso.' : 'Contato criado com sucesso.');
      }

      setTimeout(() => router.push(basePath), 600);
    } catch (err) {
      const message = err instanceof ApiClientError
        ? err.message
        : isPetSurface
          ? 'Erro ao salvar contato de apoio.'
          : 'Erro ao salvar contato.';
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
            ? 'Você não possui permissão para gerenciar contatos de apoio.'
            : 'Você não possui permissão para esta ação.'}
        </div>
      )}
    >
      <div className="space-y-5">
        <PageTitle
          title={title}
          description={isPetSurface
            ? 'Cadastre contatos adicionais, financeiros ou operacionais usados no relacionamento com clientes do PetFlow. Campos de company ficam apenas como compatibilidade legada.'
            : 'Formulário de cadastro/edição de contato CRM.'}
        />

        <div className="flex justify-end">
          <Link href={basePath} className="ui-secondary-button">
            {isPetSurface ? 'Voltar para contatos de apoio' : 'Voltar para listagem'}
          </Link>
        </div>

        {loading ? (
          <div className="ui-surface-panel px-4 py-6 text-sm text-[color:var(--app-shell-muted)]">
            {isPetSurface ? 'Carregando contato de apoio...' : 'Carregando contato...'}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-3 ui-surface-panel p-4 md:grid-cols-2">
            <FormInput
              label={isPetSurface ? 'Nome do contato de apoio' : 'Nome'}
              value={firstName}
              onChange={setFirstName}
              required
            />
            <FormInput
              label={isPetSurface ? 'Sobrenome ou complemento' : 'Sobrenome'}
              value={lastName}
              onChange={setLastName}
            />
            <FormInput
              label={isPetSurface ? 'E-mail do contato' : 'Email'}
              value={email}
              onChange={setEmail}
              type="email"
            />
            <FormInput
              label={isPetSurface ? 'Telefone do contato' : 'Telefone'}
              value={phone}
              onChange={setPhone}
            />
            {!isPetSurface ? (
              <FormSelect
                label="Company vinculada"
                value={companyId}
                options={companyOptions}
                onChange={handleCompanyChange}
                disabled={loadingCompanies}
              />
            ) : null}
            <FormSelect label="Status" value={status} options={statusOptions} onChange={setStatus} />

            {isPetSurface && companyId ? (
              <div className="md:col-span-2 ui-notice-neutral">
                Vínculo legado com company preservado automaticamente{manualCompany ? `: ${manualCompany}.` : '.'}
              </div>
            ) : null}

            {(!companyId || isPetSurface) ? (
              <div className="md:col-span-2 space-y-2">
                <FormInput
                  label={isPetSurface ? 'Contexto legado (opcional)' : 'Empresa manual (compatibilidade)'}
                  value={manualCompany}
                  onChange={setManualCompany}
                  disabled={isPetSurface && Boolean(companyId)}
                />
                <p className="text-xs text-[color:var(--app-shell-muted)]">
                  {isPetSurface
                    ? 'Use este campo apenas quando precisar preservar uma referência histórica de company para um contato antigo.'
                    : 'Use este campo apenas quando o contato ainda não estiver vinculado a uma company cadastrada.'}
                </p>
              </div>
            ) : null}

            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="ui-primary-button"
              >
                {submitting
                  ? 'Salvando...'
                  : isPetSurface
                    ? isEdit ? 'Atualizar contato de apoio' : 'Criar contato de apoio'
                    : isEdit ? 'Atualizar contato' : 'Criar contato'}
              </button>
            </div>
          </form>
        )}

        {error ? <div className="ui-notice-error">{error}</div> : null}
        {success ? <div className="ui-notice-success">{success}</div> : null}
      </div>
    </PermissionGuard>
  );
}
