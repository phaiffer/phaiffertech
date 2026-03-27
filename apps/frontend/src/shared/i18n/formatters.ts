import type { AppLocale } from '@/shared/i18n/app-i18n-provider';

export function formatCurrencyForLocale(locale: AppLocale, value: number, currency = 'BRL') {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export function formatNumberForLocale(locale: AppLocale, value: number, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(locale, options).format(value);
}

export function formatDateForLocale(
  locale: AppLocale,
  value?: string | Date | null,
  fallback = '',
  options?: Intl.DateTimeFormatOptions
) {
  if (!value) {
    return fallback;
  }

  return new Intl.DateTimeFormat(locale, options).format(new Date(value));
}

export function formatDateTimeForLocale(
  locale: AppLocale,
  value?: string | Date | null,
  fallback = '',
  options?: Intl.DateTimeFormatOptions
) {
  if (!value) {
    return fallback;
  }

  return new Intl.DateTimeFormat(locale, options).format(new Date(value));
}

export function formatTimeForLocale(
  locale: AppLocale,
  value?: string | Date | null,
  fallback = '',
  options?: Intl.DateTimeFormatOptions
) {
  if (!value) {
    return fallback;
  }

  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    ...options
  }).format(new Date(value));
}
