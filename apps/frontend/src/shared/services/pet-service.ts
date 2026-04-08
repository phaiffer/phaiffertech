import { apiClient } from '@/shared/lib/http';
import { PageResponse } from '@/shared/types/common';
import {
  PetAppointment,
  PetClinicalTimeline,
  PetClient,
  PetClientDocumentType,
  ClientPlan,
  PetDashboardSummary,
  PetInsightsSummary,
  PetInvoice,
  PetInvoicePayment,
  PetInventoryMovement,
  PetMedicalRecord,
  PetPrescription,
  PetProduct,
  PetProfessional,
  PetProfile,
  PetServiceCatalog,
  PetServiceCategory,
  PetVaccination
} from '@/shared/types/pet';

export type CreatePetClientInput = {
  name: string;
  email?: string;
  phone?: string;
  primaryResponsibleName?: string;
  primaryResponsibleEmail?: string;
  primaryResponsiblePhone?: string;
  documentType: PetClientDocumentType;
  document: string;
  address?: string;
  status?: string;
};

export type UpdatePetClientInput = {
  name: string;
  email?: string;
  phone?: string;
  primaryResponsibleName?: string;
  primaryResponsibleEmail?: string;
  primaryResponsiblePhone?: string;
  documentType: PetClientDocumentType;
  document: string;
  address?: string;
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
  color?: string;
  notes?: string;
};

export type UpdatePetProfileInput = CreatePetProfileInput;

export type CreatePetServiceCatalogInput = {
  name: string;
  description?: string;
  category: PetServiceCategory;
  active: boolean;
  basePrice: number;
  durationMinutes: number;
  commissionEligible: boolean;
  allowInPlans: boolean;
  allowStandaloneBooking: boolean;
};

export type UpdatePetServiceCatalogInput = CreatePetServiceCatalogInput;

export type CreatePetProfessionalInput = {
  name: string;
  specialty?: string;
  licenseNumber?: string;
  phone?: string;
  email?: string;
  commissionRate?: number;
};

export type UpdatePetProfessionalInput = CreatePetProfessionalInput;

export type CreatePetAppointmentInput = {
  clientId: string;
  petId: string;
  serviceId: string;
  serviceIds?: string[];
  professionalId: string;
  serviceLineAssignments?: PetAppointmentServiceLineAssignmentInput[];
  scheduledAt: string;
  status?: string;
  notes?: string;
  // Optional: override the auto-populated service catalog price.
  servicePrice?: number;
  // Optional: associate with a client plan for session tracking.
  clientPlanId?: string;
  // Optional extras beyond the base service (e.g. pet taxi, grooming add-ons).
  extrasAmount?: number;
  extrasDescription?: string;
};

export type UpdatePetAppointmentInput = {
  clientId: string;
  petId: string;
  serviceId: string;
  serviceIds?: string[];
  professionalId: string;
  serviceLineAssignments?: PetAppointmentServiceLineAssignmentInput[];
  scheduledAt: string;
  status: string;
  notes?: string;
  // Optional: override the auto-populated service catalog price.
  servicePrice?: number;
  // Optional: associate with a client plan for session tracking.
  clientPlanId?: string;
  // Optional extras beyond the base service (e.g. pet taxi, grooming add-ons).
  extrasAmount?: number;
  extrasDescription?: string;
};

export type CreatePetMedicalRecordInput = {
  petId: string;
  professionalId: string;
  appointmentId?: string;
  description: string;
  diagnosis?: string;
  treatment?: string;
};

export type UpdatePetMedicalRecordInput = CreatePetMedicalRecordInput;

export type CreatePetVaccinationInput = {
  petId: string;
  appointmentId?: string;
  vaccineName: string;
  appliedAt: string;
  nextDueAt?: string;
  notes?: string;
};

export type UpdatePetVaccinationInput = CreatePetVaccinationInput;

export type CreatePetPrescriptionInput = {
  petId: string;
  professionalId: string;
  appointmentId?: string;
  medication: string;
  dosage?: string;
  instructions?: string;
};

export type UpdatePetPrescriptionInput = CreatePetPrescriptionInput;

export type CreatePetProductInput = {
  name: string;
  sku: string;
  price: number;
  stockQuantity: number;
  category?: string;
  unitOfMeasure?: string;
  minimumQuantity?: number;
  reorderPoint?: number;
};

export type UpdatePetProductInput = CreatePetProductInput;

export type CreatePetInventoryMovementInput = {
  productId: string;
  movementType: string;
  quantity: number;
  notes?: string;
};

export type UpdatePetInventoryMovementInput = CreatePetInventoryMovementInput;

export type CreatePetInvoiceInput = {
  clientId: string;
  totalAmount: number;
  status?: string;
  issuedAt?: string;
  dueAt?: string;
  description?: string;
  appointmentId?: string;
  serviceId?: string;
};

export type UpdatePetInvoiceInput = {
  clientId: string;
  totalAmount: number;
  status: string;
  issuedAt?: string;
  dueAt?: string;
  description?: string;
  appointmentId?: string;
  serviceId?: string;
};

export type CreatePetInvoicePaymentInput = {
  amount: number;
  method?: string;
  receivedAt?: string;
  referenceCode?: string;
  notes?: string;
};

export type PetAppointmentServiceLineAssignmentInput = {
  serviceId: string;
  professionalId?: string | null;
};

type PetClientFilters = {
  status?: string;
};

type PetProfileFilters = {
  clientId?: string;
};

type PetAppointmentFilters = {
  status?: string;
  professionalId?: string;
  clientId?: string;
  petId?: string;
  serviceId?: string;
  scheduledFrom?: string;
  scheduledTo?: string;
};

type PetServiceCatalogFilters = {
  category?: PetServiceCategory;
  active?: boolean;
};

type PetMedicalRecordFilters = {
  petId?: string;
  professionalId?: string;
  appointmentId?: string;
};

type PetVaccinationFilters = {
  petId?: string;
  appointmentId?: string;
};

type PetPrescriptionFilters = {
  petId?: string;
  professionalId?: string;
  appointmentId?: string;
};

type PetClinicalTimelineFilters = {
  petId?: string;
  appointmentId?: string;
  limit?: number;
};

type PetInventoryFilters = {
  productId?: string;
  movementType?: string;
};

type PetInvoiceFilters = {
  clientId?: string;
  status?: string;
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

function simpleQueryString(filters: Record<string, string | number | undefined> = {}) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (typeof value === 'number') {
      params.set(key, String(value));
      return;
    }

    if (value && value.trim()) {
      params.set(key, value.trim());
    }
  });

  return params.toString();
}

function normalizePetClientPayload(input: CreatePetClientInput | UpdatePetClientInput) {
  const primaryResponsibleName = input.primaryResponsibleName?.trim() || input.name.trim();
  const primaryResponsibleEmail = input.primaryResponsibleEmail?.trim() || input.email?.trim() || undefined;
  const primaryResponsiblePhone = input.primaryResponsiblePhone?.trim() || input.phone?.trim() || undefined;

  return {
    name: primaryResponsibleName,
    fullName: primaryResponsibleName,
    email: primaryResponsibleEmail,
    phone: primaryResponsiblePhone,
    documentType: input.documentType,
    document: input.document,
    address: input.address,
    status: input.status
  };
}

export const petService = {
  listClients: (page = 0, size = 20, search = '', filters: PetClientFilters = {}) =>
    apiClient.get<PageResponse<PetClient>>(
      `/pet/clients?${queryString(page, size, search, { status: filters.status })}`
    ),

  getClient: (id: string) => apiClient.get<PetClient>(`/pet/clients/${id}`),

  createClient: (input: CreatePetClientInput) =>
    apiClient.post<PetClient>('/pet/clients', normalizePetClientPayload(input)),

  updateClient: (id: string, input: UpdatePetClientInput) =>
    apiClient.put<PetClient>(`/pet/clients/${id}`, normalizePetClientPayload(input)),

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

  listServices: (page = 0, size = 20, search = '', filters: PetServiceCatalogFilters = {}) =>
    apiClient.get<PageResponse<PetServiceCatalog>>(
      `/pet/services?${queryString(page, size, search, {
        category: filters.category,
        active: filters.active === undefined ? undefined : String(filters.active)
      })}`
    ),

  getService: (id: string) => apiClient.get<PetServiceCatalog>(`/pet/services/${id}`),

  createService: (input: CreatePetServiceCatalogInput) =>
    apiClient.post<PetServiceCatalog>('/pet/services', input),

  updateService: (id: string, input: UpdatePetServiceCatalogInput) =>
    apiClient.put<PetServiceCatalog>(`/pet/services/${id}`, input),

  deleteService: (id: string) => apiClient.delete<void>(`/pet/services/${id}`),

  restoreService: (id: string) => apiClient.patch<PetServiceCatalog>(`/pet/services/${id}/restore`),

  listProfessionals: (page = 0, size = 20, search = '') =>
    apiClient.get<PageResponse<PetProfessional>>(`/pet/professionals?${queryString(page, size, search)}`),

  getProfessional: (id: string) => apiClient.get<PetProfessional>(`/pet/professionals/${id}`),

  createProfessional: (input: CreatePetProfessionalInput) =>
    apiClient.post<PetProfessional>('/pet/professionals', input),

  updateProfessional: (id: string, input: UpdatePetProfessionalInput) =>
    apiClient.put<PetProfessional>(`/pet/professionals/${id}`, input),

  deleteProfessional: (id: string) => apiClient.delete<void>(`/pet/professionals/${id}`),

  restoreProfessional: (id: string) => apiClient.patch<PetProfessional>(`/pet/professionals/${id}/restore`),

  listAppointments: (page = 0, size = 20, search = '', filters: PetAppointmentFilters = {}) =>
    apiClient.get<PageResponse<PetAppointment>>(
      `/pet/appointments?${queryString(page, size, search, {
        status: filters.status,
        professionalId: filters.professionalId,
        clientId: filters.clientId,
        petId: filters.petId,
        serviceId: filters.serviceId,
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

  restoreAppointment: (id: string) => apiClient.patch<PetAppointment>(`/pet/appointments/${id}/restore`),

  listMedicalRecords: (page = 0, size = 20, search = '', filters: PetMedicalRecordFilters = {}) =>
    apiClient.get<PageResponse<PetMedicalRecord>>(
      `/pet/medical-records?${queryString(page, size, search, {
        petId: filters.petId,
        professionalId: filters.professionalId,
        appointmentId: filters.appointmentId
      })}`
    ),

  getMedicalRecord: (id: string) => apiClient.get<PetMedicalRecord>(`/pet/medical-records/${id}`),

  createMedicalRecord: (input: CreatePetMedicalRecordInput) =>
    apiClient.post<PetMedicalRecord>('/pet/medical-records', input),

  updateMedicalRecord: (id: string, input: UpdatePetMedicalRecordInput) =>
    apiClient.put<PetMedicalRecord>(`/pet/medical-records/${id}`, input),

  deleteMedicalRecord: (id: string) => apiClient.delete<void>(`/pet/medical-records/${id}`),

  restoreMedicalRecord: (id: string) => apiClient.patch<PetMedicalRecord>(`/pet/medical-records/${id}/restore`),

  listVaccinations: (page = 0, size = 20, search = '', filters: PetVaccinationFilters = {}) =>
    apiClient.get<PageResponse<PetVaccination>>(
      `/pet/vaccinations?${queryString(page, size, search, {
        petId: filters.petId,
        appointmentId: filters.appointmentId
      })}`
    ),

  getVaccination: (id: string) => apiClient.get<PetVaccination>(`/pet/vaccinations/${id}`),

  createVaccination: (input: CreatePetVaccinationInput) =>
    apiClient.post<PetVaccination>('/pet/vaccinations', input),

  updateVaccination: (id: string, input: UpdatePetVaccinationInput) =>
    apiClient.put<PetVaccination>(`/pet/vaccinations/${id}`, input),

  deleteVaccination: (id: string) => apiClient.delete<void>(`/pet/vaccinations/${id}`),

  restoreVaccination: (id: string) => apiClient.patch<PetVaccination>(`/pet/vaccinations/${id}/restore`),

  listPrescriptions: (page = 0, size = 20, search = '', filters: PetPrescriptionFilters = {}) =>
    apiClient.get<PageResponse<PetPrescription>>(
      `/pet/prescriptions?${queryString(page, size, search, {
        petId: filters.petId,
        professionalId: filters.professionalId,
        appointmentId: filters.appointmentId
      })}`
    ),

  getPrescription: (id: string) => apiClient.get<PetPrescription>(`/pet/prescriptions/${id}`),

  createPrescription: (input: CreatePetPrescriptionInput) =>
    apiClient.post<PetPrescription>('/pet/prescriptions', input),

  updatePrescription: (id: string, input: UpdatePetPrescriptionInput) =>
    apiClient.put<PetPrescription>(`/pet/prescriptions/${id}`, input),

  deletePrescription: (id: string) => apiClient.delete<void>(`/pet/prescriptions/${id}`),

  restorePrescription: (id: string) => apiClient.patch<PetPrescription>(`/pet/prescriptions/${id}/restore`),

  getClinicalTimeline: (filters: PetClinicalTimelineFilters) =>
    apiClient.get<PetClinicalTimeline>(
      `/pet/medical/timeline?${simpleQueryString({
        petId: filters.petId,
        appointmentId: filters.appointmentId,
        limit: filters.limit
      })}`
    ),

  listProducts: (page = 0, size = 20, search = '') =>
    apiClient.get<PageResponse<PetProduct>>(`/pet/products?${queryString(page, size, search)}`),

  getProduct: (id: string) => apiClient.get<PetProduct>(`/pet/products/${id}`),

  createProduct: (input: CreatePetProductInput) => apiClient.post<PetProduct>('/pet/products', input),

  updateProduct: (id: string, input: UpdatePetProductInput) =>
    apiClient.put<PetProduct>(`/pet/products/${id}`, input),

  deleteProduct: (id: string) => apiClient.delete<void>(`/pet/products/${id}`),

  restoreProduct: (id: string) => apiClient.patch<PetProduct>(`/pet/products/${id}/restore`),

  listInventoryMovements: (page = 0, size = 20, search = '', filters: PetInventoryFilters = {}) =>
    apiClient.get<PageResponse<PetInventoryMovement>>(
      `/pet/inventory?${queryString(page, size, search, {
        productId: filters.productId,
        movementType: filters.movementType
      })}`
    ),

  getInventoryMovement: (id: string) => apiClient.get<PetInventoryMovement>(`/pet/inventory/${id}`),

  createInventoryMovement: (input: CreatePetInventoryMovementInput) =>
    apiClient.post<PetInventoryMovement>('/pet/inventory', input),

  updateInventoryMovement: (id: string, input: UpdatePetInventoryMovementInput) =>
    apiClient.put<PetInventoryMovement>(`/pet/inventory/${id}`, input),

  deleteInventoryMovement: (id: string) => apiClient.delete<void>(`/pet/inventory/${id}`),

  restoreInventoryMovement: (id: string) =>
    apiClient.patch<PetInventoryMovement>(`/pet/inventory/${id}/restore`),

  listInvoices: (page = 0, size = 20, search = '', filters: PetInvoiceFilters = {}) =>
    apiClient.get<PageResponse<PetInvoice>>(
      `/pet/invoices?${queryString(page, size, search, {
        clientId: filters.clientId,
        status: filters.status
      })}`
    ),

  getInvoice: (id: string) => apiClient.get<PetInvoice>(`/pet/invoices/${id}`),

  createInvoice: (input: CreatePetInvoiceInput) => apiClient.post<PetInvoice>('/pet/invoices', input),

  updateInvoice: (id: string, input: UpdatePetInvoiceInput) =>
    apiClient.put<PetInvoice>(`/pet/invoices/${id}`, input),

  createInvoicePayment: (id: string, input: CreatePetInvoicePaymentInput) =>
    apiClient.post<PetInvoicePayment>(`/pet/invoices/${id}/payments`, input),

  deleteInvoice: (id: string) => apiClient.delete<void>(`/pet/invoices/${id}`),

  restoreInvoice: (id: string) => apiClient.patch<PetInvoice>(`/pet/invoices/${id}/restore`),

  getDashboardSummary: () => apiClient.get<PetDashboardSummary>('/pet/dashboard/summary'),

  getInsightsSummary: () => apiClient.get<PetInsightsSummary>('/pet/dashboard/insights'),

  // -- Client Plans --
  listClientPlans: (clientId?: string, page = 0, size = 20) =>
    apiClient.get<PageResponse<ClientPlan>>(
      `/pet/plans?${queryString(page, size, '', { clientId })}`
    ),

  getClientPlan: (id: string) => apiClient.get<ClientPlan>(`/pet/plans/${id}`),

  createClientPlan: (input: { clientId: string; planName: string; totalSessions: number; expiresAt?: string }) =>
    apiClient.post<ClientPlan>('/pet/plans', input),

  updateClientPlan: (id: string, input: { planName: string; totalSessions: number; expiresAt?: string }) =>
    apiClient.put<ClientPlan>(`/pet/plans/${id}`, input),

  deleteClientPlan: (id: string) => apiClient.delete<void>(`/pet/plans/${id}`)
};
