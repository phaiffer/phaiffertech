import type { CSSProperties, ReactNode } from 'react';
import {
  sharedCompactTextClass,
  sharedMutedSectionSurfaceClass,
  sharedSectionHeaderClass,
  sharedSectionHeadingClass,
  sharedSectionSurfaceClass
} from '@/shared/components/public-visual-system';

type PageSectionProps = {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  tone?: 'default' | 'muted';
  className?: string;
  contentClassName?: string;
  style?: CSSProperties;
};

function joinClasses(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(' ');
}

export function PageSection({
  title,
  description,
  actions,
  children,
  tone = 'default',
  className,
  contentClassName,
  style
}: PageSectionProps) {
  const surfaceClass = tone === 'muted' ? sharedMutedSectionSurfaceClass : sharedSectionSurfaceClass;

  return (
    <section className={joinClasses(surfaceClass, className)} style={style}>
      {title || description || actions ? (
        <div className={sharedSectionHeaderClass}>
          <div className="max-w-3xl">
            {title ? <h2 className={sharedSectionHeadingClass}>{title}</h2> : null}
            {description ? <p className={`mt-1.5 ${sharedCompactTextClass}`}>{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
        </div>
      ) : null}
      <div className={contentClassName}>{children}</div>
    </section>
  );
}
