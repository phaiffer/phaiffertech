'use client';

import Link from 'next/link';
import { ReactNode, useId } from 'react';

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

const toneStyles = {
  neutral: 'border-slate-700/70 bg-slate-900/70 text-slate-200',
  cyan: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200',
  green: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
  amber: 'border-amber-500/40 bg-amber-500/10 text-amber-200',
  red: 'border-rose-500/40 bg-rose-500/10 text-rose-200'
} as const;

type Tone = keyof typeof toneStyles;

function IconFrame({ children, tone = 'neutral' }: { children: ReactNode; tone?: Tone }) {
  return (
    <span
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center rounded-2xl border',
        toneStyles[tone]
      )}
    >
      {children}
    </span>
  );
}

export function DeviceIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="7" y="3" width="10" height="18" rx="2" />
      <path d="M9 7h6M9 11h6M9 15h6" />
      <path d="M12 21v-3" />
    </svg>
  );
}

export function AlarmIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="m10 4-6 10h16L14 4z" />
      <path d="M12 9v3m0 4h.01" />
    </svg>
  );
}

export function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 12h4v8H4zm6-6h4v14h-4zm6 3h4v11h-4z" />
    </svg>
  );
}

export function WaveIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M2 12c2.5 0 2.5-6 5-6s2.5 12 5 12 2.5-12 5-12 2.5 6 5 6" />
    </svg>
  );
}

export function AnalysisIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 17 10 11l3 3 7-7" />
      <path d="M15 7h5v5" />
    </svg>
  );
}

export function PlugIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 3v7m6-7v7M8 10h8v3a4 4 0 0 1-4 4v4" />
    </svg>
  );
}

export function FactoryIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 21V8l6 4V8l6 4V3l6 4v14z" />
      <path d="M7 21v-5h4v5" />
    </svg>
  );
}

export function BoltIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M13 2 5 14h6l-1 8 8-12h-6z" />
    </svg>
  );
}

export function Chip({
  label,
  value,
  tone = 'neutral',
  icon
}: {
  label: string;
  value?: string | number;
  tone?: Tone;
  icon?: ReactNode;
}) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em]',
        toneStyles[tone]
      )}
    >
      {icon ? <span className="opacity-90">{icon}</span> : <span className="h-2 w-2 rounded-full bg-current" />}
      <span>{label}</span>
      {value !== undefined ? <span className="text-white">{value}</span> : null}
    </div>
  );
}

export function IotPageHeader({
  eyebrow,
  title,
  description,
  chips,
  action,
  aside
}: {
  eyebrow?: string;
  title: string;
  description: string;
  chips?: ReactNode;
  action?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="rounded-[32px] border border-cyan-500/15 bg-[linear-gradient(115deg,rgba(5,17,37,0.96),rgba(7,26,53,0.82),rgba(4,12,29,0.96))] p-7 shadow-[0_24px_80px_rgba(3,8,22,0.55)]">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300/85">
            {eyebrow}
          </p>
        ) : null}
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-semibold tracking-tight text-white lg:text-[42px]">{title}</h1>
            <p className="mt-3 text-base leading-7 text-slate-300">{description}</p>
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
        {chips ? <div className="mt-6 flex flex-wrap gap-3">{chips}</div> : null}
      </div>
      {aside ? <div className="h-full">{aside}</div> : null}
    </section>
  );
}

export function IotHeroAside({
  title,
  items
}: {
  title: string;
  items: Array<{ label: string; value: string; tone?: Tone }>;
}) {
  return (
    <div className="flex h-full flex-col rounded-[32px] border border-cyan-500/15 bg-[#071223]/90 p-6 shadow-[0_24px_80px_rgba(3,8,22,0.55)]">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{title}</p>
      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <div
            key={`${item.label}-${item.value}`}
            className="rounded-2xl border border-slate-800/90 bg-slate-950/40 px-4 py-3"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {item.label}
            </p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-white">{item.value}</p>
              <span
                className={cn(
                  'inline-flex h-2.5 w-2.5 rounded-full',
                  item.tone === 'red'
                    ? 'bg-rose-400'
                    : item.tone === 'amber'
                      ? 'bg-amber-400'
                      : item.tone === 'green'
                        ? 'bg-emerald-400'
                        : 'bg-cyan-400'
                )}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function IotMetricCard({
  label,
  value,
  footnote,
  tone = 'neutral',
  icon
}: {
  label: string;
  value: string | number;
  footnote?: string;
  tone?: Tone;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-cyan-500/15 bg-[#081325]/88 p-5 shadow-[0_18px_50px_rgba(2,8,20,0.35)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
          <p className="mt-4 text-4xl font-semibold tracking-tight text-white">{value}</p>
        </div>
        {icon ? <IconFrame tone={tone}>{icon}</IconFrame> : null}
      </div>
      {footnote ? <p className="mt-4 text-sm text-slate-400">{footnote}</p> : null}
    </div>
  );
}

export function IotPanel({
  title,
  description,
  action,
  children,
  className
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'rounded-[32px] border border-cyan-500/15 bg-[#071223]/90 p-6 shadow-[0_18px_50px_rgba(2,8,20,0.35)]',
        className
      )}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">{title}</h2>
          {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function IotStatusPill({
  label,
  tone = 'neutral'
}: {
  label: string;
  tone?: Tone;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]',
        toneStyles[tone]
      )}
    >
      <span className="h-2 w-2 rounded-full bg-current" />
      {label}
    </span>
  );
}

export function IotNotice({
  title,
  description,
  tone = 'neutral',
  action
}: {
  title: string;
  description: string;
  tone?: Tone;
  action?: ReactNode;
}) {
  return (
    <div
      className={cn(
        'rounded-[28px] border px-5 py-4',
        tone === 'red'
          ? 'border-rose-500/35 bg-rose-500/10'
          : tone === 'amber'
            ? 'border-amber-500/35 bg-amber-500/10'
            : tone === 'green'
              ? 'border-emerald-500/35 bg-emerald-500/10'
              : 'border-cyan-500/25 bg-cyan-500/8'
      )}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-base font-semibold text-white">{title}</p>
          <p className="mt-1 text-sm text-slate-300">{description}</p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}

export function IotEmptyState({
  title,
  description,
  tone = 'neutral',
  compact = false
}: {
  title: string;
  description: string;
  tone?: Tone;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-[28px] border',
        compact ? 'px-4 py-5' : 'px-5 py-6',
        tone === 'red'
          ? 'border-rose-500/30 bg-rose-500/8'
          : tone === 'amber'
            ? 'border-amber-500/30 bg-amber-500/8'
            : tone === 'green'
              ? 'border-emerald-500/30 bg-emerald-500/8'
              : 'border-cyan-500/20 bg-cyan-500/8'
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'mt-1 inline-flex h-2.5 w-2.5 rounded-full',
            tone === 'red'
              ? 'bg-rose-400'
              : tone === 'amber'
                ? 'bg-amber-400'
                : tone === 'green'
                  ? 'bg-emerald-400'
                  : 'bg-cyan-400'
          )}
        />
        <div>
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
        </div>
      </div>
    </div>
  );
}

export function IotTableStateRow({
  colSpan,
  title,
  description,
  tone = 'neutral'
}: {
  colSpan: number;
  title: string;
  description: string;
  tone?: Tone;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-5">
        <IotEmptyState title={title} description={description} tone={tone} compact />
      </td>
    </tr>
  );
}

export function IotActionButton({
  href,
  children
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/15 px-5 py-3 text-sm font-semibold text-cyan-100 transition hover:border-cyan-300/50 hover:bg-cyan-400/20"
    >
      {children}
    </Link>
  );
}

export function IotPrimaryButton({
  type = 'button',
  onClick,
  disabled,
  children
}: {
  type?: 'button' | 'submit';
  onClick?: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center rounded-2xl border border-cyan-300/40 bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

export function IotSecondaryButton({
  type = 'button',
  onClick,
  children
}: {
  type?: 'button' | 'submit';
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-950/40 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-900/80"
    >
      {children}
    </button>
  );
}

export function IotTabButton({
  label,
  active,
  onClick
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-2xl border px-4 py-2 text-sm font-semibold transition',
        active
          ? 'border-cyan-400/40 bg-cyan-400/18 text-white'
          : 'border-slate-700 bg-slate-950/35 text-slate-300 hover:border-slate-500'
      )}
    >
      {label}
    </button>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  helper?: string;
  type?: string;
};

export function IotTextField({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  helper,
  type = 'text'
}: FieldProps) {
  return (
    <label className="block text-sm">
      <span className="mb-2 block font-medium text-slate-200">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-2xl border border-slate-700 bg-slate-950/55 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
      />
      {helper ? <span className="mt-2 block text-xs text-slate-500">{helper}</span> : null}
    </label>
  );
}

export function IotTextareaField({
  label,
  value,
  onChange,
  placeholder,
  helper
}: FieldProps) {
  return (
    <label className="block text-sm">
      <span className="mb-2 block font-medium text-slate-200">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full rounded-2xl border border-slate-700 bg-slate-950/55 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
      />
      {helper ? <span className="mt-2 block text-xs text-slate-500">{helper}</span> : null}
    </label>
  );
}

export function IotSelectField({
  label,
  value,
  onChange,
  options,
  helper
}: FieldProps & { options: Array<{ value: string; label: string }> }) {
  return (
    <label className="block text-sm">
      <span className="mb-2 block font-medium text-slate-200">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-700 bg-slate-950/55 px-4 py-3 text-slate-100 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {helper ? <span className="mt-2 block text-xs text-slate-500">{helper}</span> : null}
    </label>
  );
}

export function IotDateTimeField(props: Omit<FieldProps, 'type'>) {
  return <IotTextField {...props} type="datetime-local" />;
}

export function IotSectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{children}</p>
  );
}

export function IotMiniTrend({
  title,
  series,
  accent = '#22d3ee'
}: {
  title: string;
  series: Array<{ label: string; value: number }>;
  accent?: string;
}) {
  const gradientId = useId().replace(/:/g, '');
  const safeSeries = series.length > 0 ? series : [{ label: '--:--', value: 0 }];
  const values = safeSeries.map((item) => item.value);
  const currentValue = values.at(-1) ?? 0;
  const previousValue = values.at(-2) ?? currentValue;
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values, 1);
  const spread = Math.max(maxValue - minValue, Math.abs(maxValue) * 0.12, 1);
  const floor = Math.max(0, minValue - spread * 0.18);
  const ceiling = maxValue + spread * 0.18;
  const domain = Math.max(ceiling - floor, 1);
  const delta = currentValue - previousValue;
  const leftPadding = 8;
  const rightPadding = 98;
  const topPadding = 12;
  const bottomPadding = 88;
  const chartHeight = bottomPadding - topPadding;
  const chartWidth = rightPadding - leftPadding;

  const formatValue = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
      maximumFractionDigits: Number.isInteger(value) ? 0 : 1
    }).format(value);

  const points = safeSeries.map((item, index) => {
    const x = leftPadding + (index / Math.max(safeSeries.length - 1, 1)) * chartWidth;
    const y = bottomPadding - ((item.value - floor) / domain) * chartHeight;
    return {
      x,
      y,
      label: item.label,
      value: item.value
    };
  });

  const polylinePoints = points.map((point) => `${point.x},${point.y}`).join(' ');
  const areaPoints = `${leftPadding},${bottomPadding} ${polylinePoints} ${rightPadding},${bottomPadding}`;
  const gridValues = Array.from({ length: 4 }, (_, index) => ceiling - (domain / 3) * index);
  const highlightedPoint = points.at(-1) ?? {
    x: rightPadding,
    y: bottomPadding,
    label: '--:--',
    value: currentValue
  };
  const amplitude = maxValue - minValue;
  const trendLabel =
    Math.abs(delta) < Math.max(spread * 0.05, 0.2)
      ? 'Estável'
      : delta > 0
        ? 'Acelerando'
        : 'Recuando';
  const anchorLabels = [
    safeSeries[0]?.label ?? '--:--',
    safeSeries[Math.floor((safeSeries.length - 1) / 2)]?.label ?? '--:--',
    safeSeries.at(-1)?.label ?? '--:--'
  ];

  return (
    <div className="rounded-[30px] border border-cyan-500/15 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_38%),linear-gradient(180deg,rgba(3,9,20,0.22),rgba(2,6,23,0.52))] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="mt-2 text-xs uppercase tracking-[0.22em] text-slate-500">
            Tendência contínua com leitura operacional simplificada
          </p>
        </div>
        <div className="rounded-[22px] border border-slate-800/90 bg-slate-950/55 px-4 py-3 text-right">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Pulso atual</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight" style={{ color: accent }}>
            {formatValue(currentValue)}
          </p>
          <p
            className={cn(
              'mt-2 text-xs font-semibold uppercase tracking-[0.18em]',
              delta >= 0 ? 'text-emerald-300' : 'text-rose-300'
            )}
          >
            {delta >= 0 ? '+' : '-'}
            {formatValue(Math.abs(delta))} vs. pulso anterior
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-[28px] border border-slate-800/90 bg-slate-950/45 p-4">
        <svg viewBox="0 0 100 100" className="h-72 w-full overflow-visible">
          <defs>
            <linearGradient id={`${gradientId}-area`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accent} stopOpacity="0.32" />
              <stop offset="100%" stopColor={accent} stopOpacity="0" />
            </linearGradient>
          </defs>

          {gridValues.map((gridValue, index) => {
            const y = topPadding + (index / Math.max(gridValues.length - 1, 1)) * chartHeight;
            return (
              <g key={`${gridValue}-${index}`}>
                <line
                  x1={leftPadding}
                  y1={y}
                  x2={rightPadding}
                  y2={y}
                  stroke="rgba(71,85,105,0.55)"
                  strokeDasharray="1.4 2.4"
                  strokeWidth="0.5"
                />
                <text
                  x="0"
                  y={y + 1.5}
                  fill="rgba(148,163,184,0.68)"
                  fontSize="4"
                  letterSpacing="0.12em"
                >
                  {formatValue(gridValue)}
                </text>
              </g>
            );
          })}

          <polygon points={areaPoints} fill={`url(#${gradientId}-area)`} />
          <polyline
            fill="none"
            stroke={accent}
            strokeOpacity="0.18"
            strokeWidth="4.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={polylinePoints}
          />
          <polyline
            fill="none"
            stroke={accent}
            strokeWidth="2.4"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={polylinePoints}
          />
          <circle cx={highlightedPoint.x} cy={highlightedPoint.y} r="2.2" fill={accent} />
          <circle cx={highlightedPoint.x} cy={highlightedPoint.y} r="4.3" fill={accent} fillOpacity="0.12" />
        </svg>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/55 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Atual</p>
            <p className="mt-2 text-lg font-semibold text-white">{formatValue(currentValue)}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/55 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Faixa</p>
            <p className="mt-2 text-lg font-semibold text-white">
              {formatValue(minValue)} - {formatValue(maxValue)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/55 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Amplitude</p>
            <p className="mt-2 text-lg font-semibold text-white">{formatValue(amplitude)}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/55 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Tendência</p>
            <p className="mt-2 text-lg font-semibold text-white">{trendLabel}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          {anchorLabels.map((label, index) => (
            <div
              key={`${label}-${index}`}
              className={cn(
                'rounded-2xl border border-slate-800 bg-slate-950/55 px-3 py-2',
                index === 1 ? 'text-center' : index === 2 ? 'text-right' : 'text-left'
              )}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function IotSurfaceLink({
  href,
  title,
  description
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[28px] border border-slate-800 bg-slate-950/35 p-5 transition hover:-translate-y-0.5 hover:border-cyan-400/35 hover:bg-slate-950/65"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300/80">IoT System</p>
      <h3 className="mt-3 text-xl font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
      <span className="mt-5 inline-flex text-sm font-semibold text-cyan-200 transition group-hover:translate-x-1">
        Abrir fluxo
      </span>
    </Link>
  );
}
