import { sharedCompactTextClass, sharedDashedSurfaceClass, sharedSectionHeadingClass } from '@/shared/components/public-visual-system';

type EmptyStateCardProps = {
  title: string;
  description: string;
};

export function EmptyStateCard({ title, description }: EmptyStateCardProps) {
  return (
    <div className={`${sharedDashedSurfaceClass} px-5 py-6`}>
      <p className={sharedSectionHeadingClass}>{title}</p>
      <p className={`mt-1 ${sharedCompactTextClass}`}>{description}</p>
    </div>
  );
}
