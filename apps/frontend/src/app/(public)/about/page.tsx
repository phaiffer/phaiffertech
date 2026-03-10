import type { Metadata } from 'next';
import { WebsiteAboutPage } from '@/modules/website/website-about-page';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Learn how PhaifferTech positions itself as a technology company focused on platform engineering, modular products and applied research.'
};

export default function AboutPage() {
  return <WebsiteAboutPage />;
}
