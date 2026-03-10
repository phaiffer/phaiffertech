import type { Metadata } from 'next';
import { PublicSiteShell } from '@/shared/components/public-site-shell';
import { PublicSiteProvider } from '@/shared/public/public-site-provider';

export const metadata: Metadata = {
  title: {
    default: 'PhaifferTech',
    template: '%s | PhaifferTech'
  },
  description:
    'Engineering platforms, modular SaaS products, data systems and applied research by PhaifferTech.'
};

export default function PublicLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <PublicSiteProvider>
      <PublicSiteShell>{children}</PublicSiteShell>
    </PublicSiteProvider>
  );
}
