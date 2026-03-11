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
    <div className="flex items-center justify-between rounded-[var(--radius-lg)] border border-[color:var(--app-shell-border)] bg-[color:var(--surface-1)] px-[var(--space-4)] py-[var(--space-3)]">
      <p className="text-[length:var(--font-size-xs)] text-[color:var(--app-shell-muted)]">Total: {totalElements}</p>
      <div className="flex items-center gap-[var(--space-2)]">
        <button
          type="button"
          disabled={!canPrevious}
          onClick={() => onPageChange(page - 1)}
          className="rounded-[var(--radius-md)] border border-[color:var(--app-shell-border)] bg-[color:var(--surface-1)] px-[var(--space-3)] py-[var(--space-1)] text-[length:var(--font-size-xs)] font-medium text-[color:var(--app-shell-text)] transition duration-200 hover:shadow-card disabled:cursor-not-allowed disabled:opacity-40"
        >
          Anterior
        </button>
        <span className="text-[length:var(--font-size-xs)] text-[color:var(--app-shell-muted)]">
          Página {totalPages === 0 ? 0 : page + 1} de {totalPages}
        </span>
        <button
          type="button"
          disabled={!canNext}
          onClick={() => onPageChange(page + 1)}
          className="rounded-[var(--radius-md)] border border-[color:var(--app-shell-border)] bg-[color:var(--surface-1)] px-[var(--space-3)] py-[var(--space-1)] text-[length:var(--font-size-xs)] font-medium text-[color:var(--app-shell-text)] transition duration-200 hover:shadow-card disabled:cursor-not-allowed disabled:opacity-40"
        >
          Próxima
        </button>
      </div>
    </div>
  );
}
