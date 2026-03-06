import { apiClient } from '@/shared/lib/http';
import { PageResponse } from '@/shared/types/common';
import { PetClient } from '@/shared/types/pet';

export type CreatePetClientInput = {
  fullName: string;
  email?: string;
  phone?: string;
};

export const petService = {
  listClients: (page = 0, size = 20) =>
    apiClient.get<PageResponse<PetClient>>(`/pet/clients?page=${page}&size=${size}`),
  createClient: (input: CreatePetClientInput) => apiClient.post<PetClient>('/pet/clients', input)
};
