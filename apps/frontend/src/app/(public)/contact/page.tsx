import type { Metadata } from 'next';
import { WebsiteContactPage } from '@/modules/website/website-contact-page';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Understand how to start a conversation with PhaifferTech around platform, product, architecture or applied research.'
};

export default function ContactPage() {
  return <WebsiteContactPage />;
}
