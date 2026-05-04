'use client';

import type { FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Mail, Phone, Users } from 'lucide-react';
import {
  sharedCompactTextClass,
  sharedFilterToolbarClass,
  sharedFormActionsClass,
  sharedInlineActionsClass,
  sharedPageStackClass,
  sharedSummaryCardClass,
  sharedSummaryCardLabelClass
} from '@/shared/components/public-visual-system';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { StatusBadge } from '@/shared/dashboard/status-badge';
import { ApiClientError } from '@/shared/lib/http';
import {
  formatPetClientDocumentDisplay,
  formatPetClientDocumentInput,
  inferPetClientDocumentType,
  isValidPetClientDocument,
  normalizePetClientDocumentNumber,
  normalizePetClientDocumentType
} from '@/shared/lib/pet-client-document';
import { resolvePetClientPrimaryResponsible } from '@/shared/lib/pet-client-primary-responsible';
import { formatPhoneDisplay, maskPhoneInput, stripPhoneMask } from '@/shared/lib/phone';
import { resolvePageItems, resolveTotalItems } from '@/shared/lib/pagination';
import { petService } from '@/shared/services/pet-service';
import type { PageResponse } from '@/shared/types/common';
import type { PetClient, PetClientDocumentType } from '@/shared/types/pet';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { DataTable, type DataTableColumn } from '@/shared/ui/data-table';
import { FormInput } from '@/shared/ui/form-input';
import { FormSelect } from '@/shared/ui/form-select';
import { PageSection } from '@/shared/ui/page-section';
import { PageTitle } from '@/shared/ui/page-title';
import { Pagination } from '@/shared/ui/pagination';
import { SearchBar } from '@/shared/ui/search-bar';

type PetClientsPageProps = {
  initialView?: 'list' | 'create';
};

const pageSize = 10;

const statusOptions = [
  { value: '', label: 'Todos' },
  { value: 'ACTIVE', label: 'Ativo' },
  { value: 'INACTIVE', label: 'Inativo' }
];

const formStatusOptions = [
  { value: 'ACTIVE', label: 'Ativo' },
  { value: 'INACTIVE', label: 'Inativo' }
];

const documentTypeOptions = [
  { value: '', label: 'Selecione o tipo' },
  { value: 'CPF', label: 'CPF' },
  { value: 'RG', label: 'RG' }
];

const initialPage: PageResponse<PetClient> = {
  items: [],
  totalItems: 0,
  totalPages: 0,
  page: 0,
  size: pageSize
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value));
}

export function PetClientsPage({ initialView = 'list' }: PetClientsPageProps) {
  const router = useRouter();
  const isCreateRoute = initialView === 'create';

  const [pageData, setPageData] = useState<PageResponse<PetClient>>(initialPage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [isEditorOpen, setIsEditorOpen] = useState(isCreateRoute);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [documentType, setDocumentType] = useState<PetClientDocumentType | ''>('');
  const [document, setDocument] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [submitting, setSubmitting] = useState(false);

  const [deleteCandidate, setDeleteCandidate] = useState<PetClient | null>(null);

  const load = useCallback(async (page: number, currentSearch: string, currentStatus: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await petService.listClients(page, pageSize, currentSearch, {
        status: currentStatus || undefined
      });
      setPageData(result);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Nao foi possivel carregar os clientes.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(0, search, statusFilter);
  }, [load, search, statusFilter]);

  function resetForm() {
    setEditingId(null);
    setName('');
    setEmail('');
    setPhone('');
    setDocumentType('');
    setDocument('');
    setAddress('');
    setNotes('');
    setStatus('ACTIVE');
  }

  useEffect(() => {
    if (!isCreateRoute) {
      return;
    }

    resetForm();
    setSuccess(null);
    setError(null);
    setIsEditorOpen(true);
  }, [isCreateRoute]);

  function beginEdit(client: PetClient) {
    const resolvedDocumentType = inferPetClientDocumentType(client.documentType, client.document);
    const primaryResponsible = resolvePetClientPrimaryResponsible(client);
    setEditingId(client.id);
    setName(primaryResponsible.name ?? client.name ?? client.fullName ?? '');
    setEmail(primaryResponsible.email ?? '');
    setPhone(primaryResponsible.phone ? formatPhoneDisplay(primaryResponsible.phone) : '');
    setDocumentType(resolvedDocumentType);
    setDocument(formatPetClientDocumentInput(resolvedDocumentType, client.document ?? ''));
    setAddress(client.address ?? '');
    setNotes(client.notes ?? '');
    setStatus(client.status);
    setSuccess(null);
    setError(null);
    setIsEditorOpen(true);
  }

  function handleDocumentTypeChange(value: string) {
    const nextDocumentType = normalizePetClientDocumentType(value);
    setDocumentType(nextDocumentType);
    setDocument((currentDocument) => formatPetClientDocumentInput(nextDocumentType, currentDocument));
  }

  function closeEditor() {
    resetForm();

    if (isCreateRoute) {
      router.push('/pet/clients');
      return;
    }

    setIsEditorOpen(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const normalizedDocumentType = normalizePetClientDocumentType(documentType);
    const normalizedDocument = normalizePetClientDocumentNumber(normalizedDocumentType, document);

    if (!normalizedDocumentType) {
      setSubmitting(false);
      setError('Selecione o tipo de documento.');
      return;
    }

    if (!normalizedDocument) {
      setSubmitting(false);
      setError('Informe o numero do documento.');
      return;
    }

    if (!isValidPetClientDocument(normalizedDocumentType, normalizedDocument)) {
      setSubmitting(false);
      setError(
        normalizedDocumentType === 'CPF'
          ? 'Informe um CPF valido.'
          : 'Informe um RG valido.'
      );
      return;
    }

    try {
      const normalizedPhone = stripPhoneMask(phone) || undefined;

      if (editingId) {
        await petService.updateClient(editingId, {
          name,
          email: email || undefined,
          phone: normalizedPhone,
          primaryResponsibleName: name,
          primaryResponsibleEmail: email || undefined,
          primaryResponsiblePhone: normalizedPhone,
          documentType: normalizedDocumentType,
          document: normalizedDocument,
          address: address || undefined,
          notes: notes || undefined,
          status
        });
        setSuccess('Cliente atualizado.');
        setIsEditorOpen(false);
      } else {
        await petService.createClient({
          name,
          email: email || undefined,
          phone: normalizedPhone,
          primaryResponsibleName: name,
          primaryResponsibleEmail: email || undefined,
          primaryResponsiblePhone: normalizedPhone,
          documentType: normalizedDocumentType,
          document: normalizedDocument,
          address: address || undefined,
          notes: notes || undefined,
          status
        });

        if (isCreateRoute) {
          router.push('/pet/clients');
          return;
        }

        setSuccess('Cliente adicionado.');
        setIsEditorOpen(false);
      }

      resetForm();
      await load(pageData.page, search, statusFilter);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Nao foi possivel salvar o cliente.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteCandidate) {
      return;
    }

    try {
      await petService.deleteClient(deleteCandidate.id);
      setDeleteCandidate(null);
      setSuccess('Cliente removido.');
      await load(pageData.page, search, statusFilter);
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Nao foi possivel remover o cliente.';
      setError(message);
    }
  }

  const rows = resolvePageItems(pageData);
  const totalItems = resolveTotalItems(pageData);
  const activeFilterCount = [search, statusFilter].filter(Boolean).length;
  const activeClients = rows.filter((client) => client.status === 'ACTIVE').length;
  const clientsWithEmail = rows.filter((client) => Boolean(resolvePetClientPrimaryResponsible(client).email)).length;
  const clientsWithPhone = rows.filter((client) => Boolean(resolvePetClientPrimaryResponsible(client).phone)).length;

  const columns: DataTableColumn<PetClient>[] = [
    {
      key: 'profile',
      header: 'Cliente',
      render: (client) => {
        const resolvedDocumentType = inferPetClientDocumentType(client.documentType, client.document);
        const formattedDocument = formatPetClientDocumentDisplay(client.documentType, client.document);

        return (
          <div>
            <p className="font-medium text-slate-900">{client.name ?? client.fullName ?? '-'}</p>
            <p className={`mt-1 ${sharedCompactTextClass}`}>
              Documento: {client.document
                ? [resolvedDocumentType, formattedDocument].filter(Boolean).join(' ')
                : 'Nao informado'}
            </p>
          </div>
        );
      }
    },
    {
      key: 'contact',
      header: 'Responsavel principal',
      render: (client) => {
        const primaryResponsible = resolvePetClientPrimaryResponsible(client);

        return (
          <div>
            <p className="font-medium text-slate-900">{primaryResponsible.name ?? 'Sem responsavel principal'}</p>
            <p className={`mt-1 ${sharedCompactTextClass}`}>
              {primaryResponsible.email ?? 'Sem e-mail'}
            </p>
            <p className={sharedCompactTextClass}>
              {primaryResponsible.phone ? formatPhoneDisplay(primaryResponsible.phone) : 'Sem telefone'}
            </p>
          </div>
        );
      }
    },
    {
      key: 'address',
      header: 'Endereco e atualizacao',
      render: (client) => (
        <div>
          <p className="font-medium text-slate-900">{client.address ?? 'Sem endereco'}</p>
          <p className={`mt-1 ${sharedCompactTextClass}`}>
            {client.notes ? `Observacoes: ${client.notes}` : `Atualizado em ${formatDateTime(client.updatedAt)}`}
          </p>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (client) => <StatusBadge status={client.status} />
    },
    {
      key: 'actions',
      header: 'Acoes',
      render: (client) => (
        <div className={sharedInlineActionsClass}>
          <PermissionGuard permission="pet.client.update">
            <button type="button" onClick={() => beginEdit(client)} className="ui-inline-button">
              Editar
            </button>
          </PermissionGuard>

          <PermissionGuard permission="pet.client.delete">
            <button type="button" onClick={() => setDeleteCandidate(client)} className="ui-inline-danger-button">
              Remover
            </button>
          </PermissionGuard>
        </div>
      )
    }
  ];

  return (
    <PermissionGuard
      permission="pet.client.read"
      fallback={<div className="ui-notice-warning">Voce nao tem permissao para visualizar clientes.</div>}
    > 
      <div className={sharedPageStackClass}>
        <PageTitle
          eyebrow="PetFlow workspace"
          title={isCreateRoute ? 'Novo cliente' : 'Clientes'}
          description={
            isCreateRoute
              ? 'Cadastre o cliente e o seu responsavel principal antes de ligar pets, atendimentos, planos e cobranca.'
              : 'Mantenha a base de clientes e dos responsaveis principais pronta antes de avancar para pets, atendimentos e cobranca.'
          }
          actions={isCreateRoute ? (
            <Link href="/pet/clients" className="ui-secondary-button">
              Voltar para clientes
            </Link>
          ) : (
            <div className="flex flex-wrap justify-end gap-2">
              <PermissionGuard permission="crm.contact.read">
                <Link href="/pet/clients/contacts" className="ui-secondary-button">
                  Contatos de apoio
                </Link>
              </PermissionGuard>
              <PermissionGuard permission="pet.client.create">
                <Link href="/pet/clients/new" className="ui-primary-button">
                  Novo cliente
                </Link>
              </PermissionGuard>
            </div>
          )}
        />

        {!isCreateRoute ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Total de clientes', value: totalItems, icon: Users },
              { label: 'Cadastros ativos', value: activeClients, icon: Users },
              { label: 'Responsaveis com e-mail', value: clientsWithEmail, icon: Mail },
              { label: 'Responsaveis com telefone', value: clientsWithPhone, icon: Phone }
            ].map((item) => (
              <div key={item.label} className={sharedSummaryCardClass}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className={sharedSummaryCardLabelClass}>{item.label}</p>
                    <p className="mt-3 text-3xl font-bold tracking-[-0.03em] text-slate-900">{item.value}</p>
                  </div>
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--accent)]/10 text-[color:var(--accent)]">
                    <item.icon className="h-5 w-5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {!isCreateRoute ? (
          <PageSection tone="muted" title="Filtros" description="Busque por cliente, responsavel principal ou status do cadastro.">
            <div className={sharedFilterToolbarClass}>
              <div className="grid gap-3 xl:grid-cols-[minmax(0,1.45fr)_220px] xl:items-end">
                <SearchBar value={searchInput} onChange={setSearchInput} placeholder="Cliente, responsavel, e-mail, telefone, endereco" />
                <FormSelect label="Status" value={statusFilter} options={statusOptions} onChange={setStatusFilter} />
              </div>
              <div className={sharedFormActionsClass}>
                <button type="button" onClick={() => setSearch(searchInput)} className="ui-primary-button">
                  Buscar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    setSearch('');
                    setStatusFilter('');
                  }}
                  className="ui-inline-button"
                >
                  Limpar
                </button>
                <p className="text-sm text-slate-700">
                  {activeFilterCount > 0
                    ? `${activeFilterCount} filtro(s) ativos na visao de clientes.`
                    : 'Sem filtros ativos na base de clientes.'}
                </p>
              </div>
            </div>
          </PageSection>
        ) : null}

        {error ? <div className="ui-notice-error">{error}</div> : null}
        {success ? <div className="ui-notice-success">{success}</div> : null}

        {isEditorOpen ? (
          <PermissionGuard permission={editingId ? 'pet.client.update' : 'pet.client.create'}>
            <PageSection
              title={editingId ? 'Editar cliente' : 'Novo cliente'}
              description="Capture os dados do cliente e do responsavel principal. Contatos adicionais, financeiros ou de contingencia podem ficar em contatos de apoio."
            >
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-4 xl:grid-cols-2">
                  <FormInput
                    id="client-name"
                    name="name"
                    label="Nome do responsavel"
                    value={name}
                    onChange={setName}
                    autoComplete="name"
                    required
                  />
                  <FormSelect label="Status" value={status} options={formStatusOptions} onChange={setStatus} />
                  <FormInput
                    id="client-email"
                    name="clientEmail"
                    label="E-mail do responsavel"
                    value={email}
                    onChange={setEmail}
                    type="email"
                    autoComplete="section-client email"
                    inputMode="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    data-lpignore="true"
                    data-1p-ignore="true"
                  />
                  <FormInput
                    id="client-phone"
                    name="clientPhone"
                    label="Telefone do responsavel"
                    value={phone}
                    onChange={(v) => setPhone(maskPhoneInput(v))}
                    type="tel"
                    autoComplete="section-client tel"
                    inputMode="tel"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    data-lpignore="true"
                    data-1p-ignore="true"
                  />
                  <FormSelect
                    label="Tipo de documento"
                    value={documentType}
                    options={documentTypeOptions}
                    onChange={handleDocumentTypeChange}
                  />
                  <FormInput
                    id="client-document"
                    name="document"
                    label="Documento"
                    value={document}
                    onChange={(value) => setDocument(formatPetClientDocumentInput(documentType, value))}
                    placeholder={
                      documentType === 'CPF'
                        ? '000.000.000-00'
                        : documentType === 'RG'
                          ? 'MG 12.345.678'
                          : 'Selecione o tipo antes de informar o numero'
                    }
                    description={
                      documentType === 'CPF'
                        ? 'Use um CPF valido. O campo aplica mascara automaticamente.'
                        : documentType === 'RG'
                          ? 'RG aceita formato mais flexivel.'
                          : 'Selecione CPF ou RG antes de informar o documento.'
                    }
                    autoComplete="off"
                    data-lpignore="true"
                    data-1p-ignore="true"
                  />
                  <div className="hidden xl:block" />
                  <FormInput
                    id="client-address"
                    name="address"
                    label="Endereco"
                    value={address}
                    onChange={setAddress}
                    autoComplete="street-address"
                    wrapperClassName="xl:col-span-2"
                  />
                  <FormInput
                    id="client-notes"
                    name="notes"
                    label="Observacoes"
                    value={notes}
                    onChange={setNotes}
                    placeholder="Preferencias de contato, autorizacoes de retirada ou combinados do cliente"
                    wrapperClassName="xl:col-span-2"
                  />
                </div>

                <div className={sharedFormActionsClass}>
                  <button type="submit" disabled={submitting} className="ui-primary-button">
                    {submitting ? 'Salvando...' : editingId ? 'Atualizar cliente' : 'Adicionar cliente'}
                  </button>
                  <button type="button" onClick={closeEditor} className="ui-secondary-button">
                    Cancelar
                  </button>
                </div>
              </form>
            </PageSection>
          </PermissionGuard>
        ) : null}

        {!isCreateRoute ? (
          <PageSection
            title="Base de clientes"
            description="Lista principal para pets, visitas e cobranca."
            actions={<p className="text-sm text-slate-700">Total de {totalItems} cliente(s)</p>}
          >
            <div className="space-y-5">
              <DataTable
                columns={columns}
                rows={rows}
                getRowKey={(row) => row.id}
                loading={loading}
                loadingTitle="Carregando clientes"
                loadingDescription="Preparando a base de clientes deste workspace PetFlow."
                emptyState={{
                  title: 'Nenhum cliente ainda',
                  description: 'Crie o primeiro cliente para liberar pets, atendimentos e o restante do fluxo PetFlow.',
                  action: (
                    <PermissionGuard permission="pet.client.create">
                      <Link href="/pet/clients/new" className="ui-primary-button">
                        Criar primeiro cliente
                      </Link>
                    </PermissionGuard>
                  )
                }}
              />

              <Pagination
                page={pageData.page}
                totalPages={pageData.totalPages}
                totalElements={totalItems}
                onPageChange={(nextPage) => load(nextPage, search, statusFilter)}
              />
            </div>
          </PageSection>
        ) : null}

        <ConfirmDialog
          open={Boolean(deleteCandidate)}
          title="Remover cliente?"
          description={deleteCandidate ? `"${deleteCandidate.name ?? deleteCandidate.fullName ?? 'Este cliente'}" sera removido deste workspace.` : undefined}
          confirmLabel="Remover"
          onCancel={() => setDeleteCandidate(null)}
          onConfirm={handleConfirmDelete}
        />
      </div>
    </PermissionGuard>
  );
}
