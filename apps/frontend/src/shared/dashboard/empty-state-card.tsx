import Link from 'next/link';
import { sharedCompactTextClass, sharedDashedSurfaceClass, sharedSectionHeadingClass } from '@/shared/components/public-visual-system';
import { workspaceDashedSurfaceStyle } from '@/shared/modules/module-workspace-visual';

type EmptyStateCardProps = {
  title: string;
  description: string;
  actionLabel?: string;
  href?: string;
};

export function EmptyStateCard({ title, description, actionLabel, href }: EmptyStateCardProps) {
  return (
    <div className={`${sharedDashedSurfaceClass} px-5 py-6`} style={workspaceDashedSurfaceStyle}>
      <p className={sharedSectionHeadingClass}>{title}</p>
      <p className={`mt-1 ${sharedCompactTextClass}`}>{description}</p>
      {actionLabel && href ? (
        <Link
          href={href}
          className="mt-4 inline-flex text-sm font-semibold text-[color:var(--tenant-accent)]"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
