'use client';

import { useAppMessages } from '@/shared/i18n/app-i18n-provider';

type PaginationProps = {
  page: number;
  totalPages: number;
  totalElements: number;
  onPageChange: (page: number) => void;
};

export function Pagination({ page, totalPages, totalElements, onPageChange }: PaginationProps) {
  const copy = useAppMessages().screens.shell;
  const canPrevious = page > 0;
  const canNext = page + 1 < totalPages;

  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-2xl)] border border-[color:var(--app-shell-border)] bg-[color:var(--surface-1)] px-[var(--space-4)] py-[var(--space-3)] shadow-xs sm:flex-row sm:items-center sm:justify-between">
      <p className="text-[length:var(--font-size-sm)] text-[color:var(--app-shell-muted)]">{copy.paginationTotal} {totalElements}</p>
      <div className="flex flex-wrap items-center gap-[var(--space-2)]">
        <button
          type="button"
          disabled={!canPrevious}
          onClick={() => onPageChange(page - 1)}
          className="ui-secondary-button min-w-[6.5rem]"
        >
          {copy.paginationPrevious}
        </button>
        <span className="text-[length:var(--font-size-sm)] text-[color:var(--app-shell-muted)]">
          {copy.paginationPage
            .replace('{page}', String(totalPages === 0 ? 0 : page + 1))
            .replace('{total}', String(totalPages))}
        </span>
        <button
          type="button"
          disabled={!canNext}
          onClick={() => onPageChange(page + 1)}
          className="ui-secondary-button min-w-[6.5rem]"
        >
          {copy.paginationNext}
        </button>
      </div>
    </div>
  );
}
