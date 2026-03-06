export type CrmContact = {
  id: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  status: string;
  ownerUserId?: string;
  createdAt: string;
  updatedAt: string;
};

export type CrmLead = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  source?: string;
  status: string;
  assignedUserId?: string;
  createdAt: string;
  updatedAt: string;
};
