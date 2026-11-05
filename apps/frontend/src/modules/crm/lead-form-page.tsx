'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { petCommercialPermissions } from '@/shared/auth/pet-commercial-permissions';
import { sharedFormActionsClass, sharedPageStackClass } from '@/shared/components/public-visual-system';
import { useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { resolveApiErrorMessage } from '@/shared/lib/api-error-message';
import { resolvePageItems } from '@/shared/lib/pagination';
import {
  petCommercialService,
  type CreatePetCommercialLeadInput,
  type UpdatePetCommercialLeadInput
} from '@/shared/services/pet-commercial-service';
import { PetCommercialAccount, PetCommercialSupportContact } from '@/shared/types/pet-commercial';
import { FormInput } from '@/shared/ui/form-input';
import { FormSection } from '@/shared/ui/form-section';
import { FormSelect } from '@/shared/ui/form-select';
import { FormTextarea } from '@/shared/ui/form-textarea';
import { PageTitle } from '@/shared/ui/page-title';

const listPath = '/pet/commercial?tab=leads';

type LeadFormPageProps = {
  leadId?: string;
};

export function LeadFormPage({ leadId }: LeadFormPageProps) {
  const router = useRouter();
  const copy = useAppMessages().screens.petCommercial;
  const isEdit = Boolean(leadId);
  const commercialService = petCommercialService;
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
        if (active) {
          setCompanies(resolvePageItems(companiesPage));
        }
      })
      .catch((err) => {
        if (active) {
          const message = resolveApiErrorMessage(err, copy.accountsLoadError);
          setError((current) => current ?? message);
        }
      })
      .finally(() => {
        if (active) {
          setLoadingCompanies(false);
        }
      });

    return () => {
      active = false;
    };
  }, [commercialService, copy.accountsLoadError]);

  useEffect(() => {
    let active = true;

    setLoadingContacts(true);
    commercialService.listContacts(0, 100, '', {
      companyId: companyId || undefined
    })
      .then((contactsPage) => {
        if (active) {
          setContacts(resolvePageItems(contactsPage));
        }
      })
      .catch((err) => {
        if (active) {
          const message = resolveApiErrorMessage(err, copy.contactsLoadError);
          setError((current) => current ?? message);
        }
      })
      .finally(() => {
        if (active) {
          setLoadingContacts(false);
        }
      });

    return () => {
      active = false;
    };
  }, [commercialService, companyId, copy.contactsLoadError]);

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
        if (active) {
          setError(resolveApiErrorMessage(err, copy.leadLoadError));
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [commercialService, copy.leadLoadError, isEdit, leadId]);

  // The API stores the status as free text, so a value outside this list must stay selectable.
  const statusOptions = useMemo(() => {
    const options = [
      { value: 'NEW', label: copy.statusNew },
      { value: 'QUALIFIED', label: copy.statusQualified },
      { value: 'NEGOTIATION', label: copy.statusNegotiation },
      { value: 'WON', label: copy.statusWon },
      { value: 'LOST', label: copy.statusLost }
    ];
    return options.some((option) => option.value === status) ? options : [...options, { value: status, label: status }];
  }, [copy, status]);
  const companyOptions = useMemo(() => [
    { value: '', label: copy.noLinkedAccount },
    ...companies.map((company) => ({ value: company.id, label: company.name }))
  ], [companies, copy.noLinkedAccount]);
  const contactOptions = useMemo(() => [
    { value: '', label: copy.noLinkedContact },
    ...contacts.map((contact) => ({
      value: contact.id,
      label: `${contact.firstName} ${contact.lastName ?? ''}`.trim()
    }))
  ], [contacts, copy.noLinkedContact]);

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
        const payload: UpdatePetCommercialLeadInput = { ...basePayload, status };
        await commercialService.updateLead(leadId, payload);
        setSuccess(copy.leadUpdated);
      } else {
        await commercialService.createLead(basePayload);
        setSuccess(copy.leadCreated);
      }

      setTimeout(() => router.push(listPath), 600);
    } catch (err) {
      setError(resolveApiErrorMessage(err, copy.leadSaveError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PermissionGuard
      permission={requiredPermission}
      fallback={<div className="ui-notice-warning">{copy.leadActionNoPermission}</div>}
    >
      <div className={sharedPageStackClass}>
        <PageTitle
          title={isEdit ? copy.editLead : copy.newLead}
          description={copy.leadFormDescription}
          actions={<Link href={listPath} className="ui-secondary-button">{copy.backToCommercial}</Link>}
        />

        {loading ? (
          <div className="ui-notice-neutral">{copy.leadLoading}</div>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
            <FormSection title={copy.sectionIdentification}>
              <FormInput label={copy.fieldLeadName} value={name} onChange={setName} required />
              <FormSelect label={copy.filterStatus} value={status} options={statusOptions} onChange={setStatus} />
              <FormInput label={copy.fieldEmail} value={email} onChange={setEmail} type="email" />
              <FormInput label={copy.fieldPhone} value={phone} onChange={setPhone} />
              <FormInput label={copy.fieldSource} value={source} onChange={setSource} />
            </FormSection>

            <FormSection title={copy.sectionRelationship}>
              <FormSelect
                label={copy.fieldAccount}
                value={companyId}
                options={companyOptions}
                onChange={handleCompanyChange}
                disabled={loadingCompanies}
              />
              <FormSelect
                label={copy.fieldContact}
                value={contactId}
                options={contactOptions}
                onChange={setContactId}
                disabled={loadingContacts}
              />
            </FormSection>

            <FormSection title={copy.sectionNotes}>
              <FormTextarea
                label={copy.fieldNotes}
                value={notes}
                onChange={setNotes}
                rows={5}
                wrapperClassName="md:col-span-2"
              />
            </FormSection>

            <div className={sharedFormActionsClass}>
              <button type="submit" disabled={submitting} className="ui-primary-button">
                {submitting ? copy.saving : isEdit ? copy.updateLead : copy.createLead}
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
