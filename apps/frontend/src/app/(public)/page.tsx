import type { Metadata } from 'next';
import { WebsiteHomePage } from '@/modules/website/website-home-page';

export const metadata: Metadata = {
  title: 'Engineering platforms, modular SaaS and applied research',
  description:
    'PhaifferTech presents its modular SaaS platform, products, engineering direction and applied research posture.'
};

export default function PublicHomePage() {
  return <WebsiteHomePage />;
}
