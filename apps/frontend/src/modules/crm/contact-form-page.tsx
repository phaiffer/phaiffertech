'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { PermissionGuard } from '@/shared/auth/PermissionGuard';
import { sharedFormActionsClass, sharedPageStackClass } from '@/shared/components/public-visual-system';
import { useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { resolveApiErrorMessage } from '@/shared/lib/api-error-message';
import { petClientContactSupportService } from '@/shared/services/pet-client-contact-support-service';
import { FormInput } from '@/shared/ui/form-input';
import { FormSection } from '@/shared/ui/form-section';
import { FormSelect } from '@/shared/ui/form-select';
import { PageTitle } from '@/shared/ui/page-title';

const listPath = '/pet/clients/contacts';

type ContactFormPageProps = {
  contactId?: string;
};

export function ContactFormPage({ contactId }: ContactFormPageProps) {
  const router = useRouter();
  const copy = useAppMessages().screens.petSupportContacts;
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
  const [companyId, setCompanyId] = useState('');
  const [legacyCompany, setLegacyCompany] = useState('');
  const [hasLegacyCompany, setHasLegacyCompany] = useState(false);
  const [status, setStatus] = useState('ACTIVE');

  useEffect(() => {
    if (!contactId) {
      return;
    }

    let active = true;
    setLoading(true);
    petClientContactSupportService.getContact(contactId)
      .then((contact) => {
        if (!active) {
          return;
        }
        setFirstName(contact.firstName);
        setLastName(contact.lastName ?? '');
        setEmail(contact.email ?? '');
        setPhone(contact.phone ?? '');
        setCompanyId(contact.companyId ?? '');
        setLegacyCompany(contact.company ?? '');
        setHasLegacyCompany(Boolean(contact.companyId || contact.company));
        setStatus(contact.status ?? 'ACTIVE');
      })
      .catch((err) => {
        if (active) {
          setError(resolveApiErrorMessage(err, copy.contactLoadError));
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
  }, [contactId, copy.contactLoadError]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const linkedCompanyId = companyId.trim() || undefined;
      const manualCompany = linkedCompanyId ? undefined : legacyCompany.trim() || undefined;
      const payload = {
        firstName,
        lastName: lastName || undefined,
        email: email || undefined,
        phone: phone || undefined,
        ...(linkedCompanyId ? { companyId: linkedCompanyId } : {}),
        ...(manualCompany ? { company: manualCompany } : {}),
        status
      };

      if (contactId) {
        await petClientContactSupportService.updateContact(contactId, payload);
        setSuccess(copy.updated);
      } else {
        await petClientContactSupportService.createContact(payload);
        setSuccess(copy.created);
      }

      setTimeout(() => router.push(listPath), 600);
    } catch (err) {
      setError(resolveApiErrorMessage(err, copy.saveError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PermissionGuard
      permission={requiredPermission}
      fallback={<div className="ui-notice-warning">{copy.formNoPermission}</div>}
    >
      <div className={sharedPageStackClass}>
        <PageTitle
          title={isEdit ? copy.editContact : copy.newContact}
          description={copy.formDescription}
          actions={<Link href={listPath} className="ui-secondary-button">{copy.backToList}</Link>}
        />

        {loading ? (
          <div className="ui-notice-neutral">{copy.contactLoading}</div>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
            <FormSection title={copy.sectionIdentification}>
              <FormInput label={copy.fieldFirstName} value={firstName} onChange={setFirstName} required />
              <FormInput label={copy.fieldLastName} value={lastName} onChange={setLastName} />
              <FormInput label={copy.fieldEmail} value={email} onChange={setEmail} type="email" />
              <FormInput label={copy.fieldPhone} value={phone} onChange={setPhone} />
              <FormSelect
                label={copy.filterStatus}
                value={status}
                options={[
                  { value: 'ACTIVE', label: copy.statusActive },
                  { value: 'INACTIVE', label: copy.statusInactive }
                ]}
                onChange={setStatus}
              />
            </FormSection>

            {hasLegacyCompany ? (
              <FormSection title={copy.sectionLegacy}>
                <FormInput
                  label={copy.fieldLegacyCompany}
                  value={legacyCompany}
                  onChange={setLegacyCompany}
                  disabled={Boolean(companyId)}
                />
                <p className="text-xs text-[var(--ink-2)] md:col-span-2">
                  {companyId ? copy.legacyLinkedHint : copy.legacyManualHint}
                </p>
              </FormSection>
            ) : null}

            <div className={sharedFormActionsClass}>
              <button type="submit" disabled={submitting} className="ui-primary-button">
                {submitting ? copy.saving : isEdit ? copy.updateContact : copy.createContact}
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
