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
  clientName?: string;
  petId: string;
  petName?: string;
  serviceId: string;
  professionalId: string;
  professionalName?: string;
  scheduledAt: string;
  serviceName: string;
  status: string;
  notes?: string;
  medicalRecordCount?: number;
  vaccinationCount?: number;
  prescriptionCount?: number;
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
  petName?: string;
  professionalId: string;
  professionalName?: string;
  appointmentId?: string;
  appointmentServiceName?: string;
  appointmentScheduledAt?: string;
  description: string;
  diagnosis?: string;
  treatment?: string;
  createdAt: string;
  updatedAt: string;
};

export type PetVaccination = {
  id: string;
  petId: string;
  petName?: string;
  appointmentId?: string;
  appointmentServiceName?: string;
  appointmentScheduledAt?: string;
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
  petName?: string;
  professionalId: string;
  professionalName?: string;
  appointmentId?: string;
  appointmentServiceName?: string;
  appointmentScheduledAt?: string;
  medication: string;
  dosage?: string;
  instructions?: string;
  createdAt: string;
  updatedAt: string;
};

export type PetClinicalTimelineEvent = {
  eventType: string;
  eventId: string;
  occurredAt: string;
  petId: string;
  petName?: string;
  professionalId?: string;
  professionalName?: string;
  appointmentId?: string;
  appointmentServiceName?: string;
  appointmentScheduledAt?: string;
  title: string;
  summary?: string;
};

export type PetClinicalTimeline = {
  petId?: string;
  petName?: string;
  appointmentId?: string;
  appointmentServiceName?: string;
  appointmentScheduledAt?: string;
  appointmentStatus?: string;
  totalEvents: number;
  events: PetClinicalTimelineEvent[];
};

export type PetProduct = {
  id: string;
  name: string;
  sku: string;
  price: number;
  category: string;
  unitOfMeasure: string;
  currentQuantity: number;
  stockQuantity: number;
  minimumQuantity: number;
  reorderPoint: number;
  createdAt: string;
  updatedAt: string;
};

export type PetInventoryMovement = {
  id: string;
  productId: string;
  productName?: string;
  productSku?: string;
  movementType: string;
  quantity: number;
  sourceType: string;
  reason: string;
  notes?: string;
  quantityBefore: number;
  quantityAfter: number;
  createdAt: string;
  updatedAt: string;
};

export type PetInvoicePayment = {
  id: string;
  status: string;
  method: string;
  amount: number;
  receivedAt: string;
  referenceCode?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type PetInvoice = {
  id: string;
  financeInvoiceId: string;
  clientId: string;
  clientName?: string;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: string;
  description?: string;
  businessContextType?: string;
  businessContextId?: string;
  businessContextLabel?: string;
  issuedAt?: string | null;
  dueAt?: string | null;
  paidAt?: string | null;
  canceledAt?: string | null;
  createdAt: string;
  updatedAt: string;
  payments: PetInvoicePayment[];
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
