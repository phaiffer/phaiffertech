type PaginationProps = {
  page: number;
  totalPages: number;
  totalElements: number;
  onPageChange: (page: number) => void;
};

export function Pagination({ page, totalPages, totalElements, onPageChange }: PaginationProps) {
  const canPrevious = page > 0;
  const canNext = page + 1 < totalPages;

  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-xl)] border border-[color:var(--app-shell-border)] bg-[color:var(--surface-1)] px-[var(--space-4)] py-[var(--space-3)] shadow-xs sm:flex-row sm:items-center sm:justify-between">
      <p className="text-[length:var(--font-size-sm)] text-[color:var(--app-shell-muted)]">Total: {totalElements}</p>
      <div className="flex flex-wrap items-center gap-[var(--space-2)]">
        <button
          type="button"
          disabled={!canPrevious}
          onClick={() => onPageChange(page - 1)}
          className="ui-secondary-button min-w-[7.5rem]"
        >
          Anterior
        </button>
        <span className="text-[length:var(--font-size-sm)] text-[color:var(--app-shell-muted)]">
          Página {totalPages === 0 ? 0 : page + 1} de {totalPages}
        </span>
        <button
          type="button"
          disabled={!canNext}
          onClick={() => onPageChange(page + 1)}
          className="ui-secondary-button min-w-[7.5rem]"
        >
          Próxima
        </button>
      </div>
    </div>
  );
}
