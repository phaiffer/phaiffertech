import type { PetClient } from '@/shared/types/pet';

export type PetClientPrimaryResponsible = {
  name: string;
  email?: string;
  phone?: string;
};

export function resolvePetClientPrimaryResponsible(
  client: Pick<
    PetClient,
    'name'
    | 'fullName'
    | 'email'
    | 'phone'
    | 'primaryResponsibleName'
    | 'primaryResponsibleEmail'
    | 'primaryResponsiblePhone'
  >
): PetClientPrimaryResponsible {
  return {
    name: client.primaryResponsibleName ?? client.fullName ?? client.name,
    email: client.primaryResponsibleEmail ?? client.email,
    phone: client.primaryResponsiblePhone ?? client.phone
  };
}
