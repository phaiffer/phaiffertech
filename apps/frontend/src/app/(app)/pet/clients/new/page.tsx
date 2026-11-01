import { Suspense } from 'react';
import { PetClientsPage } from '@/modules/pet/clients-page';

// Suspense is required because the page reads ?search= with useSearchParams.
export default function PetClientsCreateRoute() {
  return (
    <Suspense>
      <PetClientsPage initialView="create" />
    </Suspense>
  );
}
