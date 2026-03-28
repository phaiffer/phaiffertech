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
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="mt-1 text-sm text-slate-600">{description}</p>
          </div>
          {action ? <div>{action}</div> : null}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="overflow-x-auto rounded-[calc(var(--radius-2xl)-0.1rem)] border border-border bg-surface shadow-sm">
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 ${column.className ?? ''}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border text-sm text-foreground">
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
                className="align-top transition-colors duration-200 hover:bg-slate-50"
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
