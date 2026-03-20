import { ReactNode } from 'react';
import {
  sharedCompactTextClass,
  sharedSectionHeadingClass
} from '@/shared/components/public-visual-system';

export function Card({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <section className="ui-surface-panel rounded-2xl p-5 transition-colors duration-200 hover:border-accent">
      <header className="mb-3">
        <h2 className={sharedSectionHeadingClass}>{title}</h2>
        {subtitle ? <p className={sharedCompactTextClass}>{subtitle}</p> : null}
      </header>
      {children}
    </section>
  );
}

