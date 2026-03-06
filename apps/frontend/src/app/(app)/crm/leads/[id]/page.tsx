import { LeadFormPage } from '@/modules/crm/lead-form-page';

type CrmLeadEditRouteProps = {
  params: { id: string };
};

export default function CrmLeadEditRoute({ params }: CrmLeadEditRouteProps) {
  return <LeadFormPage leadId={params.id} />;
}
