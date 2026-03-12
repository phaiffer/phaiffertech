import { sharedCompactTextClass, sharedDashedSurfaceClass, sharedSectionHeadingClass } from '@/shared/components/public-visual-system';
import { workspaceDashedSurfaceStyle } from '@/shared/modules/module-workspace-visual';

type EmptyStateCardProps = {
  title: string;
  description: string;
};

export function EmptyStateCard({ title, description }: EmptyStateCardProps) {
  return (
    <div className={`${sharedDashedSurfaceClass} px-5 py-6`} style={workspaceDashedSurfaceStyle}>
      <p className={sharedSectionHeadingClass}>{title}</p>
      <p className={`mt-1 ${sharedCompactTextClass}`}>{description}</p>
    </div>
  );
}
