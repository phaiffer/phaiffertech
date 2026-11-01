import { ReactNode } from 'react';

export type DataTableColumn<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  /** Applied to header and cells. Use `text-right ui-mono` for amounts, times and counts. */
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

// Comanda v2 dense table: 1px borders, row-colored header, 40px rows, wide tables
// scroll inside their own box.
export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  loading = false,
  emptyMessage = 'Nenhum registro encontrado.',
  loadingTitle = 'Carregando registros',
  loadingDescription = 'Aguarde enquanto os dados mais recentes são preparados para esta tabela.',
  emptyState
}: DataTableProps<T>) {
  const renderStateRow = (
    title: string,
    description: string,
    action?: ReactNode
  ) => (
    <tr>
      <td colSpan={columns.length} className="px-4 py-10">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 text-center">
          <div>
            <p className="text-sm font-semibold text-slate-900">{title}</p>
            <p className="mt-1 text-sm text-slate-600">{description}</p>
          </div>
          {action ? <div>{action}</div> : null}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
      <table className="min-w-full border-collapse text-sm">
        <thead className="bg-[var(--bg-row)]">
          <tr className="border-b border-slate-200">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`h-9 whitespace-nowrap px-3 text-left text-xs font-medium text-slate-600 ${column.className ?? ''}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-slate-900">
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
                className="border-b border-[color:var(--line-soft)] align-top transition-colors last:border-b-0 hover:bg-[var(--selected)]"
              >
                {columns.map((column) => (
                  <td
                    key={`${getRowKey(row)}-${column.key}`}
                    className={`h-10 px-3 py-2 ${column.className ?? ''}`}
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
