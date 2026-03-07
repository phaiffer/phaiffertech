type StatusBadgeProps = {
  status?: string | null;
};

const toneMap: Record<string, string> = {
  ok: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  paid: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  info: 'border-sky-200 bg-sky-50 text-sky-700',
  neutral: 'border-slate-200 bg-slate-100 text-slate-700',
  open: 'border-sky-200 bg-sky-50 text-sky-700',
  warn: 'border-amber-200 bg-amber-50 text-amber-700',
  pending: 'border-amber-200 bg-amber-50 text-amber-700',
  scheduled: 'border-amber-200 bg-amber-50 text-amber-700',
  overdue: 'border-amber-200 bg-amber-50 text-amber-700',
  alert: 'border-rose-200 bg-rose-50 text-rose-700',
  offline: 'border-rose-200 bg-rose-50 text-rose-700',
  critical: 'border-rose-200 bg-rose-50 text-rose-700'
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
  const classes = toneMap[normalized] ?? 'border-slate-200 bg-slate-100 text-slate-700';

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${classes}`}>
      {prettify(status)}
    </span>
  );
}
