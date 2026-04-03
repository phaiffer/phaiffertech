// PetFlow uses its own permission adapter while the backend still exposes
// legacy CRM permission keys during the commercial consolidation.
export const petCommercialPermissions = {
  leads: {
    read: 'crm.lead.read',
    create: 'crm.lead.create',
    update: 'crm.lead.update',
    delete: 'crm.lead.delete'
  },
  deals: {
    read: 'crm.deal.read',
    create: 'crm.deal.create',
    update: 'crm.deal.update',
    delete: 'crm.deal.delete'
  },
  pipeline: {
    read: 'crm.pipeline.read',
    create: 'crm.pipeline.create',
    update: 'crm.pipeline.update',
    delete: 'crm.pipeline.delete'
  }
} as const;

export const petCommercialNavigationPermissions = [
  petCommercialPermissions.leads.read,
  petCommercialPermissions.deals.read,
  petCommercialPermissions.pipeline.read
] as const;

export const petCommercialTabPermissions = {
  leads: petCommercialPermissions.leads.read,
  deals: petCommercialPermissions.deals.read,
  pipeline: petCommercialPermissions.pipeline.read
} as const;

export type PetCommercialTabKey = keyof typeof petCommercialTabPermissions;
