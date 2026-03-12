import { ReactNode } from 'react';
import {
  sharedCompactTextClass,
  sharedSectionHeadingClass
} from '@/shared/components/public-visual-system';

export function Card({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <section className="glass-surface rounded-2xl border border-white/10 p-[var(--space-4)] shadow-sm transition-all duration-300 hover:border-accent hover:shadow-[0_0_15px_#00b4d8]">
      <header className="mb-3">
        <h2 className={sharedSectionHeadingClass}>{title}</h2>
        {subtitle ? <p className={sharedCompactTextClass}>{subtitle}</p> : null}
      </header>
      {children}
    </section>
  );
}
