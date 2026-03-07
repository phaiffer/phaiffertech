import { DashboardSection, DashboardSummaryCard } from '@/shared/types/dashboard';

export type PetClient = {
  id: string;
  name: string;
  fullName?: string;
  email?: string;
  phone?: string;
  document?: string;
  address?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type PetProfile = {
  id: string;
  clientId: string;
  name: string;
  species: string;
  breed?: string;
  birthDate?: string;
  gender?: string;
  weight?: number;
  color?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type PetAppointment = {
  id: string;
  clientId: string;
  petId: string;
  serviceId: string;
  professionalId: string;
  scheduledAt: string;
  serviceName: string;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type PetServiceCatalog = {
  id: string;
  name: string;
  description?: string;
  price: number;
  durationMinutes: number;
  createdAt: string;
  updatedAt: string;
};

export type PetProfessional = {
  id: string;
  name: string;
  specialty?: string;
  licenseNumber?: string;
  phone?: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
};

export type PetMedicalRecord = {
  id: string;
  petId: string;
  professionalId: string;
  description: string;
  diagnosis?: string;
  treatment?: string;
  createdAt: string;
  updatedAt: string;
};

export type PetVaccination = {
  id: string;
  petId: string;
  vaccineName: string;
  appliedAt: string;
  nextDueAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type PetPrescription = {
  id: string;
  petId: string;
  professionalId: string;
  medication: string;
  dosage?: string;
  instructions?: string;
  createdAt: string;
  updatedAt: string;
};

export type PetProduct = {
  id: string;
  name: string;
  sku: string;
  price: number;
  stockQuantity: number;
  createdAt: string;
  updatedAt: string;
};

export type PetInventoryMovement = {
  id: string;
  productId: string;
  movementType: string;
  quantity: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type PetInvoice = {
  id: string;
  clientId: string;
  totalAmount: number;
  status: string;
  issuedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type PetDashboardSummary = {
  totalClients: number;
  totalPets: number;
  appointmentsToday: number;
  upcomingAppointments: number;
  totalServices: number;
  lowStockProducts: number;
  pendingInvoices: number;
  summaryCards: DashboardSummaryCard[];
  sections: DashboardSection[];
};
