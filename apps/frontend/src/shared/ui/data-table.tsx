import { ReactNode } from 'react';

export type DataTableColumn<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  loading?: boolean;
  emptyMessage?: string;
};

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  loading = false,
  emptyMessage = 'Nenhum registro encontrado.'
}: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[color:var(--app-shell-border)] bg-[color:var(--surface-1)]">
      <table className="min-w-full divide-y divide-[color:var(--app-shell-border)]">
        <thead className="bg-[color:var(--surface-2)]">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-4 py-2 text-left text-[length:var(--font-size-xs)] font-semibold uppercase tracking-wide text-[color:var(--app-shell-muted)] ${column.className ?? ''}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[color:var(--app-shell-border)] text-[length:var(--font-size-sm)] text-[color:var(--app-shell-text)]">
          {loading ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-6 text-center text-[length:var(--font-size-sm)] text-[color:var(--app-shell-muted)]"
              >
                Carregando...
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-6 text-center text-[length:var(--font-size-sm)] text-[color:var(--app-shell-muted)]"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={getRowKey(row)}>
                {columns.map((column) => (
                  <td key={`${getRowKey(row)}-${column.key}`} className={`px-4 py-2 ${column.className ?? ''}`}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
