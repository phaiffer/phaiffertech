'use client';

import { LeadFormPage } from '@/modules/crm/lead-form-page';
import { PetModuleSubnav } from '@/modules/pet/pet-module-subnav';

type PetCommercialLeadFormPageProps = {
  leadId?: string;
};

export function PetCommercialLeadFormPage({ leadId }: PetCommercialLeadFormPageProps) {
  return (
    <div className="space-y-5">
      <PetModuleSubnav />
      <LeadFormPage leadId={leadId} surface="pet" />
    </div>
  );
}
