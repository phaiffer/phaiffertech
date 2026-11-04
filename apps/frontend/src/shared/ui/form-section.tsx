import type { ReactNode } from 'react';

type FormSectionProps = {
  title: string;
  children: ReactNode;
  className?: string;
};

// Comanda v2: groups related form fields under a fieldset/legend with a two-column grid.
export function FormSection({ title, children, className }: FormSectionProps) {
  return (
    <fieldset className={`border-t border-[color:var(--line)] pt-4 ${className ?? ''}`.trim()}>
      <legend className="pr-2 text-sm font-semibold text-[var(--ink)]">{title}</legend>
      <div className="mt-2 grid gap-4 md:grid-cols-2">{children}</div>
    </fieldset>
  );
}
