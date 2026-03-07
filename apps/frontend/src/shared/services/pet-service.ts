import { apiClient } from '@/shared/lib/http';
import { PageResponse } from '@/shared/types/common';
import { PetAppointment, PetClient, PetProfile } from '@/shared/types/pet';

export type CreatePetClientInput = {
  name: string;
  email?: string;
  phone?: string;
  document?: string;
  status?: string;
};

export type UpdatePetClientInput = {
  name: string;
  email?: string;
  phone?: string;
  document?: string;
  status: string;
};

export type CreatePetProfileInput = {
  clientId: string;
  name: string;
  species: string;
  breed?: string;
  birthDate?: string;
  gender?: string;
  weight?: number;
  notes?: string;
};

export type UpdatePetProfileInput = CreatePetProfileInput;

export type CreatePetAppointmentInput = {
  clientId: string;
  petId: string;
  scheduledAt: string;
  serviceName: string;
  status?: string;
  notes?: string;
  assignedUserId?: string;
};

export type UpdatePetAppointmentInput = {
  clientId: string;
  petId: string;
  scheduledAt: string;
  serviceName: string;
  status: string;
  notes?: string;
  assignedUserId?: string;
};

type PetClientFilters = {
  status?: string;
};

type PetProfileFilters = {
  clientId?: string;
};

type PetAppointmentFilters = {
  status?: string;
  assignedUserId?: string;
  clientId?: string;
  petId?: string;
  scheduledFrom?: string;
  scheduledTo?: string;
};

function queryString(
  page = 0,
  size = 20,
  search = '',
  filters: Record<string, string | undefined> = {}
) {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('size', String(size));

  if (search.trim()) {
    params.set('search', search.trim());
  }

  Object.entries(filters).forEach(([key, value]) => {
    if (value && value.trim()) {
      params.set(key, value.trim());
    }
  });

  return params.toString();
}

export const petService = {
  listClients: (page = 0, size = 20, search = '', filters: PetClientFilters = {}) =>
    apiClient.get<PageResponse<PetClient>>(
      `/pet/clients?${queryString(page, size, search, { status: filters.status })}`
    ),

  getClient: (id: string) => apiClient.get<PetClient>(`/pet/clients/${id}`),

  createClient: (input: CreatePetClientInput) => apiClient.post<PetClient>('/pet/clients', input),

  updateClient: (id: string, input: UpdatePetClientInput) =>
    apiClient.put<PetClient>(`/pet/clients/${id}`, input),

  deleteClient: (id: string) => apiClient.delete<void>(`/pet/clients/${id}`),

  restoreClient: (id: string) => apiClient.patch<PetClient>(`/pet/clients/${id}/restore`),

  listProfiles: (page = 0, size = 20, search = '', filters: PetProfileFilters = {}) =>
    apiClient.get<PageResponse<PetProfile>>(
      `/pet/pets?${queryString(page, size, search, { clientId: filters.clientId })}`
    ),

  getProfile: (id: string) => apiClient.get<PetProfile>(`/pet/pets/${id}`),

  createProfile: (input: CreatePetProfileInput) => apiClient.post<PetProfile>('/pet/pets', input),

  updateProfile: (id: string, input: UpdatePetProfileInput) =>
    apiClient.put<PetProfile>(`/pet/pets/${id}`, input),

  deleteProfile: (id: string) => apiClient.delete<void>(`/pet/pets/${id}`),

  restoreProfile: (id: string) => apiClient.patch<PetProfile>(`/pet/pets/${id}/restore`),

  listAppointments: (page = 0, size = 20, search = '', filters: PetAppointmentFilters = {}) =>
    apiClient.get<PageResponse<PetAppointment>>(
      `/pet/appointments?${queryString(page, size, search, {
        status: filters.status,
        assignedUserId: filters.assignedUserId,
        clientId: filters.clientId,
        petId: filters.petId,
        scheduledFrom: filters.scheduledFrom,
        scheduledTo: filters.scheduledTo
      })}`
    ),

  getAppointment: (id: string) => apiClient.get<PetAppointment>(`/pet/appointments/${id}`),

  createAppointment: (input: CreatePetAppointmentInput) =>
    apiClient.post<PetAppointment>('/pet/appointments', input),

  updateAppointment: (id: string, input: UpdatePetAppointmentInput) =>
    apiClient.put<PetAppointment>(`/pet/appointments/${id}`, input),

  deleteAppointment: (id: string) => apiClient.delete<void>(`/pet/appointments/${id}`),

  restoreAppointment: (id: string) => apiClient.patch<PetAppointment>(`/pet/appointments/${id}/restore`)
};
