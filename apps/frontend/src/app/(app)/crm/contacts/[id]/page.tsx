import { ContactFormPage } from '@/modules/crm/contact-form-page';

type CrmContactEditRouteProps = {
  params: { id: string };
};

export default function CrmContactEditRoute({ params }: CrmContactEditRouteProps) {
  return <ContactFormPage contactId={params.id} />;
}
