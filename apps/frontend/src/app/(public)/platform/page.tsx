import type { Metadata } from 'next';
import { WebsitePlatformPage } from '@/modules/website/website-platform-page';

export const metadata: Metadata = {
  title: 'Platform',
  description:
    'Explore the shared platform architecture behind CRM, PetFlow and IoT System at PhaifferTech.'
};

export default function PlatformPage() {
  return <WebsitePlatformPage />;
}
