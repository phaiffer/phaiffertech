'use client';

import { CrmContactsPage } from '@/modules/crm/contacts-page';
import { PetModuleSubnav } from '@/modules/pet/pet-module-subnav';

export function PetClientSupportContactsPage() {
  return (
    <div className="space-y-5">
      <PetModuleSubnav />
      <CrmContactsPage surface="pet" />
    </div>
  );
}
