import { ReactNode } from 'react';
import {
  sharedCompactTextClass,
  sharedInteractiveSurfaceClass,
  sharedSectionHeadingClass
} from '@/shared/components/public-visual-system';

export function Card({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <section className={`${sharedInteractiveSurfaceClass} p-[var(--space-4)]`}>
      <header className="mb-3">
        <h2 className={sharedSectionHeadingClass}>{title}</h2>
        {subtitle ? <p className={sharedCompactTextClass}>{subtitle}</p> : null}
      </header>
      {children}
    </section>
  );
}
