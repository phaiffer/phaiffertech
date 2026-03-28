import { ReactNode } from 'react';
import {
  sharedCompactTextClass,
  sharedPanelSurfaceClass,
  sharedSectionHeadingClass
} from '@/shared/components/public-visual-system';

export function Card({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <section className={`${sharedPanelSurfaceClass} p-5 transition-colors duration-200 hover:border-accent/60`}>
      <header className="mb-3">
        <h2 className={sharedSectionHeadingClass}>{title}</h2>
        {subtitle ? <p className={sharedCompactTextClass}>{subtitle}</p> : null}
      </header>
      {children}
    </section>
  );
}
