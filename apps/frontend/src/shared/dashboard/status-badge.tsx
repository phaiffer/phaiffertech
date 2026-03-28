type StatusBadgeProps = {
  status?: string | null;
};

const toneMap: Record<string, string> = {
  ok: 'border-success/30 bg-success-muted text-success',
  active: 'border-success/30 bg-success-muted text-success',
  ativo: 'border-success/30 bg-success-muted text-success',
  completed: 'border-success/30 bg-success-muted text-success',
  paid: 'border-success/30 bg-success-muted text-success',
  won: 'border-success/30 bg-success-muted text-success',
  resolved: 'border-success/30 bg-success-muted text-success',
  resolvido: 'border-success/30 bg-success-muted text-success',
  online: 'border-success/30 bg-success-muted text-success',
  info: 'border-info/30 bg-info-muted text-info',
  confirmed: 'border-info/30 bg-info-muted text-info',
  confirmado: 'border-info/30 bg-info-muted text-info',
  'platform owner': 'border-info/30 bg-info-muted text-info',
  'platform admin': 'border-info/30 bg-info-muted text-info',
  neutral: 'border-border bg-surface-inset text-muted',
  restricted: 'border-border bg-surface-inset text-muted',
  locked: 'border-border bg-surface-inset text-muted',
  unavailable: 'border-border bg-surface-inset text-muted',
  'no permission': 'border-border bg-surface-inset text-muted',
  'feature disabled': 'border-border bg-surface-inset text-muted',
  inactive: 'border-border bg-surface-inset text-muted',
  draft: 'border-border bg-surface-inset text-muted',
  inativo: 'border-border bg-surface-inset text-muted',
  'customer tenant': 'border-border bg-surface-inset text-muted',
  viewer: 'border-border bg-surface-inset text-muted',
  operator: 'border-border bg-surface-inset text-muted',
  manager: 'border-border bg-surface-inset text-muted',
  'tenant owner': 'border-border bg-surface-inset text-muted',
  'tenant admin': 'border-border bg-surface-inset text-muted',
  'customer portal user': 'border-border bg-surface-inset text-muted',
  open: 'border-info/30 bg-info-muted text-info',
  'no data': 'border-info/30 bg-info-muted text-info',
  issued: 'border-info/30 bg-info-muted text-info',
  warn: 'border-warning/30 bg-warning-muted text-warning',
  pending: 'border-warning/30 bg-warning-muted text-warning',
  pendente: 'border-warning/30 bg-warning-muted text-warning',
  scheduled: 'border-warning/30 bg-warning-muted text-warning',
  agendada: 'border-warning/30 bg-warning-muted text-warning',
  'setup required': 'border-warning/30 bg-warning-muted text-warning',
  overdue: 'border-warning/30 bg-warning-muted text-warning',
  maintenance: 'border-warning/30 bg-warning-muted text-warning',
  'em manutenção': 'border-warning/30 bg-warning-muted text-warning',
  acknowledged: 'border-warning/30 bg-warning-muted text-warning',
  reconhecido: 'border-warning/30 bg-warning-muted text-warning',
  'in progress': 'border-warning/30 bg-warning-muted text-warning',
  'em progresso': 'border-warning/30 bg-warning-muted text-warning',
  baixa: 'border-success/30 bg-success-muted text-success',
  média: 'border-warning/30 bg-warning-muted text-warning',
  media: 'border-warning/30 bg-warning-muted text-warning',
  alta: 'border-destructive/30 bg-destructive-muted text-destructive',
  alert: 'border-destructive/30 bg-destructive-muted text-destructive',
  'em alerta': 'border-destructive/30 bg-destructive-muted text-destructive',
  offline: 'border-destructive/30 bg-destructive-muted text-destructive',
  critical: 'border-destructive/30 bg-destructive-muted text-destructive',
  crítica: 'border-destructive/30 bg-destructive-muted text-destructive',
  critica: 'border-destructive/30 bg-destructive-muted text-destructive',
  lost: 'border-destructive/30 bg-destructive-muted text-destructive',
  error: 'border-destructive/30 bg-destructive-muted text-destructive',
  canceled: 'border-destructive/30 bg-destructive-muted text-destructive',
  cancelled: 'border-destructive/30 bg-destructive-muted text-destructive',
  'no show': 'border-destructive/30 bg-destructive-muted text-destructive',
};

function prettify(status: string) {
  return status
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase()
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
      className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-2xs font-medium ${classes}`}
    >
      {prettify(status)}
    </span>
  );
}
