type StatusBadgeProps = {
  status?: string | null;
};

const toneMap: Record<string, string> = {
  ok: 'border-success/30 bg-success-muted text-success',
  active: 'border-success/30 bg-success-muted text-success',
  completed: 'border-success/30 bg-success-muted text-success',
  paid: 'border-success/30 bg-success-muted text-success',
  info: 'border-info/30 bg-info-muted text-info',
  neutral: 'border-border bg-surface-inset text-muted',
  restricted: 'border-border bg-surface-inset text-muted',
  locked: 'border-border bg-surface-inset text-muted',
  unavailable: 'border-border bg-surface-inset text-muted',
  'no permission': 'border-border bg-surface-inset text-muted',
  'feature disabled': 'border-border bg-surface-inset text-muted',
  open: 'border-info/30 bg-info-muted text-info',
  'no data': 'border-info/30 bg-info-muted text-info',
  warn: 'border-warning/30 bg-warning-muted text-warning',
  pending: 'border-warning/30 bg-warning-muted text-warning',
  scheduled: 'border-warning/30 bg-warning-muted text-warning',
  'setup required': 'border-warning/30 bg-warning-muted text-warning',
  overdue: 'border-warning/30 bg-warning-muted text-warning',
  alert: 'border-destructive/30 bg-destructive-muted text-destructive',
  offline: 'border-destructive/30 bg-destructive-muted text-destructive',
  critical: 'border-destructive/30 bg-destructive-muted text-destructive',
};

function prettify(status: string) {
  return status
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function StatusBadge({ status }: StatusBadgeProps) {
  if (!status) {
    return null;
  }

  const normalized = status.trim().toLowerCase();
  const classes = toneMap[normalized] ?? 'border-border bg-surface-inset text-muted';

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-1 text-2xs font-medium ${classes}`}
    >
      {prettify(status)}
    </span>
  );
}
