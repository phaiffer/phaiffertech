'use client';

import { ApiClientError } from '@/shared/lib/http';

export type PetLookupIssue = {
  key: string;
  label: string;
  message: string;
};

type PetLookupFeedbackProps = {
  issues: PetLookupIssue[];
};

export function PetLookupFeedback({ issues }: PetLookupFeedbackProps) {
  if (!issues.length) {
    return null;
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <p className="font-medium">Algumas referências do módulo Pet não estão disponíveis.</p>
      <p className="mt-1 text-amber-700">
        A listagem continua funcional, mas filtros, rótulos e formulários podem ficar limitados até a referência ser
        carregada.
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-amber-700">
        {issues.map((issue) => (
          <li key={issue.key}>
            <span className="font-medium">{issue.label}:</span> {issue.message}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function resolvePetLookupIssue(error: unknown, requiredPermission?: string) {
  if (requiredPermission) {
    return `A referência exige a permissão ${requiredPermission}.`;
  }

  return error instanceof ApiClientError ? error.message : 'Não foi possível carregar esta referência agora.';
}

export function resolvePetLookupLabel<T extends { id: string }>(
  items: T[],
  id: string,
  getLabel: (item: T) => string | undefined,
  fallbackLabel: string,
  unavailable: boolean
) {
  const item = items.find((entry) => entry.id === id);
  const label = item ? getLabel(item) : undefined;

  if (label && label.trim()) {
    return label;
  }

  return unavailable ? `${fallbackLabel} indisponível (${id})` : id;
}
