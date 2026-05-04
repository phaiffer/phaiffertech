import { DashboardCountMetric, DashboardSection, DashboardSummaryCard } from '@/shared/types/dashboard';

export type PetClientDocumentType = 'CPF' | 'RG';

export type PetClient = {
  id: string;
  name: string;
  fullName?: string;
  email?: string;
  phone?: string;
  primaryResponsibleName?: string;
  primaryResponsibleEmail?: string;
  primaryResponsiblePhone?: string;
  documentType?: PetClientDocumentType;
  document?: string;
  address?: string;
  notes?: string;
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
  size?: string;
  coatType?: string;
  behavior?: string;
  color?: string;
  restrictions?: string;
  groomingNotes?: string;
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
  appointmentServices?: PetAppointmentServiceLine[];
  serviceCount?: number;
  totalServiceDurationMinutes?: number | null;
  totalServiceBasePrice?: number;
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
  // Price snapshot from the service catalog at booking time.
  servicePrice?: number;
  // Reserved for future commission calculation. Null until commission model exists.
  commissionAmount?: number;
  // Plan integration fields — null/false when appointment is not plan-based.
  clientPlanId?: string;
  planSessionConsumed?: boolean;
  planRemainingSessions?: number | null;
  // Payment summary fields — computed at response time, not stored.
  extrasAmount?: number | null;
  extrasDescription?: string | null;
  // planCovered: true when the base service is covered by the associated plan session.
  planCovered?: boolean;
  // finalAmountDue: computed checkout total. planCovered -> extrasAmount only, else servicePrice + extrasAmount.
  finalAmountDue?: number;
};

export type PetServiceInventoryConsumptionRule = 'FIXED_PER_SERVICE';
export type PetAppointmentInventoryConsumptionStatus =
  | 'PLANNED'
  | 'ADJUSTED'
  | 'READY_TO_APPLY'
  | 'SKIPPED';

export type PetAppointmentInventoryVarianceStatus =
  | 'PREVIEW_ONLY'
  | 'PLANNED_ONLY'
  | 'ADJUSTED_NOT_APPLIED'
  | 'APPLIED_MATCHED'
  | 'APPLIED_DIFFERENT';

export type PetAppointmentServiceLineInventoryConsumption = {
  id?: string | null;
  inventoryItemId: string;
  inventoryItemName: string;
  inventoryItemSku?: string | null;
  inventoryCategory?: string | null;
  unitOfMeasure: string;
  expectedQuantity: number;
  actualQuantity?: number | null;
  consumptionStatus: PetAppointmentInventoryConsumptionStatus;
  consumptionRule: PetServiceInventoryConsumptionRule;
  snapshotBacked: boolean;
  stockApplied: boolean;
  appliedQuantity?: number | null;
  plannedActualVarianceQuantity?: number | null;
  plannedAppliedVarianceQuantity?: number | null;
  varianceStatus?: PetAppointmentInventoryVarianceStatus;
  appliedInventoryMovementId?: string | null;
  stockAppliedAt?: string | null;
};

export type PetAppointmentServiceLine = {
  id?: string | null;
  serviceId: string;
  serviceName: string;
  serviceCategory?: PetServiceCategory | null;
  durationMinutes?: number | null;
  basePrice?: number | null;
  professionalId?: string | null;
  professionalName?: string | null;
  commissionEligible?: boolean | null;
  commissionRate?: number | null;
  commissionAmount?: number | null;
  expectedInventoryConsumptions?: PetAppointmentServiceLineInventoryConsumption[];
  active: boolean;
  allowInPlans: boolean;
  allowStandaloneBooking: boolean;
  lineOrder: number;
  primary: boolean;
  missingFromCatalog: boolean;
};

export type PetServiceCategory = 'GROOMING' | 'CLINICAL';

export type PetServiceInventoryLink = {
  id: string;
  inventoryItemId: string;
  inventoryItemName: string;
  inventoryItemSku?: string | null;
  inventoryCategory?: string | null;
  unitOfMeasure: string;
  expectedQuantity: number;
  consumptionRule: PetServiceInventoryConsumptionRule;
  active: boolean;
};

export type PetServiceCatalog = {
  id: string;
  name: string;
  description?: string;
  category: PetServiceCategory;
  active: boolean;
  basePrice: number;
  durationMinutes: number;
  commissionEligible: boolean;
  allowInPlans: boolean;
  allowStandaloneBooking: boolean;
  inventoryLinks: PetServiceInventoryLink[];
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
  commissionRate?: number | null;
  createdAt: string;
  updatedAt: string;
};

export type PetCommissionLineStatus =
  | 'GENERATED'
  | 'EXCLUDED'
  | 'ELIGIBLE_WITHOUT_AMOUNT'
  | 'UNASSIGNED'
  | 'LEGACY_UNAVAILABLE';

export type PetCommissionDataSource =
  | 'STRUCTURED_LINE'
  | 'COMPATIBILITY_FALLBACK';

export type PetCommissionSummaryProfessional = {
  professionalId: string;
  professionalName: string;
  totalCommissionAmount: number;
  generatedLineCount: number;
  excludedLineCount: number;
  eligibleWithoutAmountLineCount: number;
  contributingAppointmentCount: number;
};

export type PetCommissionSummaryDetail = {
  appointmentId: string;
  appointmentServiceLineId?: string | null;
  scheduledAt: string;
  appointmentStatus: string;
  clientId: string;
  clientName: string;
  petId: string;
  petName: string;
  serviceId: string;
  serviceName: string;
  lineOrder: number;
  professionalId?: string | null;
  professionalName?: string | null;
  basePrice?: number | null;
  commissionEligible?: boolean | null;
  commissionRate?: number | null;
  commissionAmount?: number | null;
  lineStatus: PetCommissionLineStatus;
  dataSource: PetCommissionDataSource;
};

export type PetCommissionSummary = {
  scheduledFrom?: string | null;
  scheduledTo?: string | null;
  appointmentStatus: string;
  totalCommissionAmount: number;
  professionalCount: number;
  generatedLineCount: number;
  excludedLineCount: number;
  eligibleWithoutAmountLineCount: number;
  unassignedLineCount: number;
  legacyLineCount: number;
  contributingAppointmentCount: number;
  professionals: PetCommissionSummaryProfessional[];
  details: PetCommissionSummaryDetail[];
};

export type PetBillingMessageSettings = {
  pixKey?: string | null;
  billingDisplayName?: string | null;
  planRenewalMessageTemplate?: string | null;
  petReadyMessageTemplate?: string | null;
  pixConfigured: boolean;
};

export type PetPreparedCustomerMessage = {
  type: string;
  tenantId: string;
  clientId: string;
  clientName: string;
  clientEmail?: string | null;
  clientPhone?: string | null;
  petId?: string | null;
  petName?: string | null;
  planId?: string | null;
  planName?: string | null;
  remainingSessions?: number | null;
  appointmentId?: string | null;
  subject: string;
  message: string;
  pixKey?: string | null;
  billingDisplayName?: string | null;
  invoiceId?: string | null;
  invoiceStatus?: string | null;
  invoiceAmount?: number | null;
  invoiceOutstandingAmount?: number | null;
  pixConfigured: boolean;
  eligible: boolean;
  safetyNote: string;
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
  inventoryItemId: string;
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

export type PetInsightsSummary = {
  newClientsThisMonth: number;
  newClientsLastMonth: number;
  topServices: DashboardCountMetric[];
  speciesMix: DashboardCountMetric[];
  appointmentsByStatus: DashboardCountMetric[];
};

export type ClientPlan = {
  id: string;
  clientId: string;
  petId?: string | null;
  planTemplateId?: string | null;
  planName: string;
  totalSessions: number;
  usedSessions: number;
  remainingSessions: number;
  startedAt?: string | null;
  expiresAt?: string | null;
  finalPrice?: number | null;
  status?: string;
  renewalState?: 'HEALTHY' | 'PENULTIMATE_USE' | 'LAST_USE' | 'EXHAUSTED' | string;
  renewalRules?: string | null;
};

export type PlanTemplate = {
  id: string;
  commercialName: string;
  description?: string | null;
  price: number;
  validityDays: number;
  totalSessions: number;
  serviceIds: string[];
  renewalRules?: string | null;
  active: boolean;
};
