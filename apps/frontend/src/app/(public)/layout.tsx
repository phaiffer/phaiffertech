import { PublicSiteShell } from '@/shared/components/public-site-shell';
import { PublicSiteProvider } from '@/shared/public/public-site-provider';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <PublicSiteProvider>
      <PublicSiteShell>{children}</PublicSiteShell>
    </PublicSiteProvider>
  );
}