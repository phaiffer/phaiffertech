'use client';

import { use } from 'react';
import { PetClientSupportContactFormPage } from '@/modules/pet/client-support-contact-form-page';

type PetClientSupportContactRouteProps = {
  params: Promise<{ id: string }>;
};

export default function PetClientSupportContactRoute({ params }: PetClientSupportContactRouteProps) {
  const { id } = use(params);

  return <PetClientSupportContactFormPage contactId={id} />;
}
