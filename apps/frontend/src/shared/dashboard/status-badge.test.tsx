import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { StatusBadge } from '@/shared/dashboard/status-badge';
import { AppI18nProvider } from '@/shared/i18n/app-i18n-provider';

describe('StatusBadge capability labels', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('renders capability states in English when en-US is active', () => {
    window.localStorage.setItem('phaiffertech-locale', 'en-US');

    render(
      <AppI18nProvider>
        <StatusBadge status="no permission" />
        <StatusBadge status="feature disabled" />
        <StatusBadge status="setup required" />
        <StatusBadge status="no data" />
        <StatusBadge status="unavailable" />
      </AppI18nProvider>
    );

    for (const label of ['No Permission', 'Feature Disabled', 'Setup Required', 'No Data', 'Unavailable']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('preserves Portuguese capability labels when pt-BR is active', () => {
    window.localStorage.setItem('phaiffertech-locale', 'pt-BR');

    render(
      <AppI18nProvider>
        <StatusBadge status="no permission" />
        <StatusBadge status="feature disabled" />
        <StatusBadge status="setup required" />
        <StatusBadge status="no data" />
        <StatusBadge status="unavailable" />
      </AppI18nProvider>
    );

    for (const label of ['Sem permissao', 'Recurso desativado', 'Configuracao necessaria', 'Sem dados', 'Indisponivel']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });
});
