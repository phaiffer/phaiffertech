import { afterEach, describe, expect, it } from 'vitest';
import { resolveApiErrorMessage } from '@/shared/lib/api-error-message';
import { ApiClientError } from '@/shared/lib/http';

const backendError = new ApiClientError('Only completed appointments can be invoiced.', 409);

describe('resolveApiErrorMessage', () => {
  afterEach(() => {
    document.documentElement.lang = '';
  });

  it('shows the screen fallback instead of the English backend text in Portuguese', () => {
    document.documentElement.lang = 'pt-BR';

    expect(resolveApiErrorMessage(backendError, 'Não foi possível gerar a cobrança.'))
      .toBe('Não foi possível gerar a cobrança.');
  });

  it('keeps the specific backend message in English', () => {
    document.documentElement.lang = 'en-US';

    expect(resolveApiErrorMessage(backendError, 'Unable to generate the invoice.'))
      .toBe('Only completed appointments can be invoiced.');
  });

  it('uses the fallback for errors that did not come from the API', () => {
    document.documentElement.lang = 'en-US';

    expect(resolveApiErrorMessage(new Error('Network down'), 'Unable to load clients.'))
      .toBe('Unable to load clients.');
  });

  it('uses the fallback when the API error has no message', () => {
    document.documentElement.lang = 'en-US';

    expect(resolveApiErrorMessage(new ApiClientError('', 500), 'Unable to save.')).toBe('Unable to save.');
  });
});
