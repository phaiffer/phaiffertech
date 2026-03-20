import { ReactNode } from 'react';

export type DataTableColumn<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
};

type DataTableEmptyState = {
  title: string;
  description: string;
  action?: ReactNode;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  loading?: boolean;
  emptyMessage?: string;
  loadingTitle?: string;
  loadingDescription?: string;
  emptyState?: DataTableEmptyState;
};

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  loading = false,
  emptyMessage = 'Nenhum registro encontrado.',
  loadingTitle = 'Carregando registros',
  loadingDescription = 'Aguarde enquanto os dados mais recentes sao preparados para esta tabela.',
  emptyState
}: DataTableProps<T>) {
  const renderStateRow = (
    title: string,
    description: string,
    action?: ReactNode
  ) => (
    <tr>
      <td
        colSpan={columns.length}
        className="px-5 py-10"
      >
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 text-center">
          <div>
            <p className="text-sm font-semibold text-[color:var(--app-shell-heading)]">{title}</p>
            <p className="mt-1 text-sm text-[color:var(--app-shell-muted)]">{description}</p>
          </div>
          {action ? <div>{action}</div> : null}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="overflow-x-auto rounded-[var(--radius-2xl)] border border-[color:var(--app-shell-border)] bg-[color:var(--surface-1)] shadow-xs">
      <table className="min-w-full divide-y divide-[color:var(--app-shell-border)]">
        <thead className="bg-[color:var(--surface-2)]">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--app-shell-muted)] ${column.className ?? ''}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[color:var(--app-shell-border)] text-[length:var(--font-size-sm)] text-[color:var(--app-shell-text)]">
          {loading ? (
            renderStateRow(loadingTitle, loadingDescription)
          ) : rows.length === 0 ? (
            renderStateRow(
              emptyState?.title ?? 'Nenhum resultado nesta tabela',
              emptyState?.description ?? emptyMessage,
              emptyState?.action
            )
          ) : (
            rows.map((row) => (
              <tr
                key={getRowKey(row)}
                className="align-top transition-colors duration-200 hover:bg-[color:var(--accent-muted)]"
              >
                {columns.map((column) => (
                  <td
                    key={`${getRowKey(row)}-${column.key}`}
                    className={`px-5 py-3.5 ${column.className ?? ''}`}
                  >
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
