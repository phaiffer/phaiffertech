import type { AppLocale } from '@/shared/i18n/app-i18n-provider';
import { enUSMessages } from '@/shared/i18n/messages/en-us';
import { ptBRMessages } from '@/shared/i18n/messages/pt-br';

export function getAppMessages(locale: AppLocale) {
  return locale === 'en-US' ? enUSMessages : ptBRMessages;
}
