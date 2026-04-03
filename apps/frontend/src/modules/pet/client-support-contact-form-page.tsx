'use client';

import { ContactFormPage } from '@/modules/crm/contact-form-page';
import { PetModuleSubnav } from '@/modules/pet/pet-module-subnav';

type PetClientSupportContactFormPageProps = {
  contactId?: string;
};

export function PetClientSupportContactFormPage({ contactId }: PetClientSupportContactFormPageProps) {
  return (
    <div className="space-y-5">
      <PetModuleSubnav />
      <ContactFormPage contactId={contactId} surface="pet" />
    </div>
  );
}
