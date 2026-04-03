'use client';

import { use } from 'react';
import { PetCommercialLeadFormPage } from '@/modules/pet/pet-commercial-lead-form-page';

type PetCommercialLeadRouteProps = {
  params: Promise<{ id: string }>;
};

export default function PetCommercialLeadRoute({ params }: PetCommercialLeadRouteProps) {
  const { id } = use(params);

  return <PetCommercialLeadFormPage leadId={id} />;
}
