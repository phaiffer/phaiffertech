'use client';

import { useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { resolveApiErrorMessage } from '@/shared/lib/api-error-message';

export type PetLookupIssue = {
  key: string;
  label: string;
  message: string;
};

type PetLookupFeedbackProps = {
  issues: PetLookupIssue[];
};

export function PetLookupFeedback({ issues }: PetLookupFeedbackProps) {
  const copy = useAppMessages().screens.shell;
  if (!issues.length) {
    return null;
  }

  return (
    <div className="ui-notice-warning">
      <p className="font-medium">{copy.lookupUnavailableTitle}</p>
      <p className="mt-1 text-current/90">
        {copy.lookupUnavailableDescription}
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

  return resolveApiErrorMessage(error, 'Unable to load this reference right now.');
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
