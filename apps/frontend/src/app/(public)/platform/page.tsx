import type { Metadata } from 'next';
import { WebsitePlatformPage } from '@/modules/website/website-platform-page';

export const metadata: Metadata = {
  title: 'Platform',
  description:
    'Explore a fundacao compartilhada que sustenta o PetFlow e a evolucao futura da plataforma PhaifferTech.'
};

export default function PlatformPage() {
  return <WebsitePlatformPage />;
}
