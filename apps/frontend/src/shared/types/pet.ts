export type PetClient = {
  id: string;
  name: string;
  fullName?: string;
  email?: string;
  phone?: string;
  document?: string;
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
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type PetAppointment = {
  id: string;
  clientId: string;
  petId: string;
  scheduledAt: string;
  serviceName: string;
  status: string;
  notes?: string;
  assignedUserId?: string;
  createdAt: string;
  updatedAt: string;
};
