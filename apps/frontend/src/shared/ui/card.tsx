import { ReactNode } from 'react';

export function Card({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[color:var(--app-shell-border)] bg-[color:var(--surface-1)] p-[var(--space-4)] shadow-none transition-shadow duration-200 hover:shadow-card">
      <header className="mb-3">
        <h2 className="text-[length:var(--font-size-sm)] font-semibold text-[color:var(--app-shell-heading)]">{title}</h2>
        {subtitle ? <p className="text-[length:var(--font-size-xs)] text-[color:var(--app-shell-muted)]">{subtitle}</p> : null}
      </header>
      {children}
    </section>
  );
}
