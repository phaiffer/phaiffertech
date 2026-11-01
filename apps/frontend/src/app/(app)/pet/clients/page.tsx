import { Suspense } from 'react';
import { PetClientsPage } from '@/modules/pet/clients-page';

// Suspense is required because the page reads ?search= with useSearchParams.
export default function PetClientsRoute() {
  return (
    <Suspense>
      <PetClientsPage />
    </Suspense>
  );
}
