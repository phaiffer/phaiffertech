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
    <div className="ui-notice-warning">
      <p className="font-medium">Some PetFlow references are not yet available.</p>
      <p className="mt-1 text-current/90">
        The list remains usable, but filters and forms depend on clients, pets, services, and professionals being loaded.
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-current/90">
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
    return `This reference requires the ${requiredPermission} permission.`;
  }

  return error instanceof ApiClientError ? error.message : 'Unable to load this reference right now.';
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

  return unavailable ? `${fallbackLabel} unavailable (${id})` : id;
}
