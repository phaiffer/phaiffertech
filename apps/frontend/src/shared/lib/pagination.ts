import { PageResponse } from '@/shared/types/common';

export function resolvePageItems<T>(page: PageResponse<T>): T[] {
  return page.items ?? page.content ?? [];
}

export function resolveTotalItems<T>(page: PageResponse<T>): number {
  if (typeof page.totalItems === 'number') {
    return page.totalItems;
  }

  if (typeof page.totalElements === 'number') {
    return page.totalElements;
  }

  return resolvePageItems(page).length;
}
