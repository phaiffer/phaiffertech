import { ReactNode } from 'react';

export function Table({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-[var(--radius-xl)] border border-[color:var(--app-shell-border)] bg-[color:var(--app-shell-panel)] shadow-xs">
      <table className="min-w-full divide-y divide-[color:var(--app-shell-border)]">
        <thead className="bg-[color:var(--app-shell-panel-muted)]">
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--app-shell-muted)]"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[color:var(--app-shell-border)] text-sm text-[color:var(--app-shell-text)] [&>tr]:align-top [&>tr]:transition-colors [&>tr]:duration-200 [&>tr]:hover:bg-[color:var(--accent-muted)]">
          {children}
        </tbody>
      </table>
    </div>
  );
}
