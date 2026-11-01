'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppI18n, useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { formatNumberForLocale } from '@/shared/i18n/formatters';

type PaginationProps = {
  page: number;
  totalPages: number;
  totalElements: number;
  /** When provided, shows the record range ("1-14 de 248") instead of "Página x de y". */
  pageSize?: number;
  onPageChange: (page: number) => void;
};

// Comanda v2 pagination: plain text range in mono + two outline buttons.
export function Pagination({ page, totalPages, totalElements, pageSize, onPageChange }: PaginationProps) {
  const copy = useAppMessages().screens.shell;
  const { locale } = useAppI18n();
  const canPrevious = page > 0;
  const canNext = page + 1 < totalPages;
  const format = (value: number) => formatNumberForLocale(locale, value);

  const label = pageSize && totalElements > 0
    ? copy.paginationRange
        .replace('{from}', format(page * pageSize + 1))
        .replace('{to}', format(Math.min((page + 1) * pageSize, totalElements)))
        .replace('{total}', format(totalElements))
    : copy.paginationPage
        .replace('{page}', String(totalPages === 0 ? 0 : page + 1))
        .replace('{total}', String(totalPages));

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-1">
      <p className="ui-mono text-[13px] text-slate-600">
        {pageSize ? label : `${copy.paginationTotal} ${format(totalElements)}`}
      </p>
      <div className="flex items-center gap-2">
        {pageSize ? null : <span className="ui-mono text-[13px] text-slate-600">{label}</span>}
        <button
          type="button"
          disabled={!canPrevious}
          onClick={() => onPageChange(page - 1)}
          className="ui-secondary-button"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          {copy.paginationPrevious}
        </button>
        <button
          type="button"
          disabled={!canNext}
          onClick={() => onPageChange(page + 1)}
          className="ui-secondary-button"
        >
          {copy.paginationNext}
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
