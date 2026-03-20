'use client';

import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { useId } from 'react';
import {
  sharedCompactButtonClass,
  sharedCompactTextClass,
  sharedEyebrowClass,
  sharedFieldGroupClass,
  sharedInputClass,
  sharedInputLabelClass,
  sharedMutedSurfaceClass,
  sharedPageHeaderBodyClass,
  sharedPageHeaderClass,
  sharedPageStackClass,
  sharedPageTitleClass,
  sharedPrimaryButtonClass,
  sharedSectionHeaderClass,
  sharedSectionHeadingClass,
  sharedSectionSurfaceClass,
  sharedSecondaryButtonClass,
  sharedSupportingTextClass,
  sharedTextareaClass
} from '@/shared/components/public-visual-system';
import { resolveVisualProfile, withAlpha } from '@/shared/lib/visual-profile';
import {
  workspaceMutedSurfaceStyle,
  workspacePanelSurfaceStyle
} from '@/shared/modules/module-workspace-visual';
import { useFrontendPlatform } from '@/shared/platform/use-frontend-platform';

/* ═══════════════════════════════════════════════════════════════════════════
   PhaifferTech IoT Design System - Clean, Operational, Readable
   Inspired by Datadog, Grafana (modern), Linear
   ═══════════════════════════════════════════════════════════════════════════ */

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

type Tone = 'neutral' | 'cyan' | 'green' | 'amber' | 'red';

const toneBg: Record<Tone, string> = {
  neutral: 'bg-surface-inset',
  cyan: 'bg-info-muted',
  green: 'bg-success-muted',
  amber: 'bg-warning-muted',
  red: 'bg-destructive-muted',
};

const toneText: Record<Tone, string> = {
  neutral: 'text-muted',
  cyan: 'text-info',
  green: 'text-success',
  amber: 'text-warning',
  red: 'text-destructive',
};

const toneBorder: Record<Tone, string> = {
  neutral: 'border-border',
  cyan: 'border-info/30',
  green: 'border-success/30',
  amber: 'border-warning/30',
  red: 'border-destructive/30',
};

export function IotModulePage({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  const platform = useFrontendPlatform();
  const visualProfile = resolveVisualProfile({
    tenantCode: platform.branding.tenantCode,
    moduleContext: 'iot',
    defaultProfile: 'iot-industrial',
    accentColor: platform.visualProfile.accentColor,
    primaryColor: platform.visualProfile.primaryColor
  });

  const style = {
    ...platform.branding.style,
    '--tenant-accent-soft': withAlpha(visualProfile.accentColor, visualProfile.accentTone.softAlpha),
    '--tenant-primary-soft': withAlpha(visualProfile.primaryColor, visualProfile.surfaceNuance.tintOpacity)
  } as CSSProperties;

  return (
    <div className={cn(sharedPageStackClass, className)} style={style} data-iot-profile={visualProfile.key}>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Icon Components
   ═══════════════════════════════════════════════════════════════════════════ */

export function DeviceIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <path d="M9 6h6M9 10h6M9 14h4" />
    </svg>
  );
}

export function AlarmIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M18 8A6 6 0 1 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

export function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

export function WaveIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 12c2-3 4-6 6-3s4 6 6 3 4-6 6-3" />
    </svg>
  );
}

export function PlugIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 22v-5" />
      <path d="M9 8V2" />
      <path d="M15 8V2" />
      <path d="M18 8v5a6 6 0 0 1-12 0V8Z" />
    </svg>
  );
}

export function BoltIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

export function FactoryIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 20h20" />
      <path d="M5 20v-5l3-3v-4l4 4v8" />
      <path d="M12 20v-8l4-4v-4l4 4v12" />
    </svg>
  );
}

export function AnalysisIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 3v18h18" />
      <path d="m7 14 4-4 4 4 5-5" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Chip Component
   ═══════════════════════════════════════════════════════════════════════════ */

export function Chip({
  label,
  value,
  tone = 'neutral',
  icon,
}: {
  label: string;
  value?: string | number;
  tone?: Tone;
  icon?: ReactNode;
}) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium',
        toneBorder[tone],
        toneBg[tone],
        toneText[tone]
      )}
    >
      {icon && <span className="opacity-80">{icon}</span>}
      <span>{label}</span>
      {value !== undefined && <span className="font-semibold text-foreground">{value}</span>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Page Header
   ═══════════════════════════════════════════════════════════════════════════ */

export function IotPageHeader({
  eyebrow,
  title,
  description,
  chips,
  action,
  aside,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  chips?: ReactNode;
  action?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(300px,0.36fr)] xl:items-start">
      <div>
        <div className={sharedPageHeaderClass}>
          <div className={sharedPageHeaderBodyClass}>
            {eyebrow ? <p className={sharedEyebrowClass}>{eyebrow}</p> : null}
            <h1 className={eyebrow ? `mt-3 ${sharedPageTitleClass}` : sharedPageTitleClass}>{title}</h1>
            <p className={`mt-3 max-w-3xl ${sharedSupportingTextClass}`}>{description}</p>
          </div>
          {action ? <div className="flex flex-wrap items-center gap-3">{action}</div> : null}
        </div>
        {chips ? <div className="mt-5 flex flex-wrap gap-2.5">{chips}</div> : null}
      </div>
      {aside ? <div>{aside}</div> : null}
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Hero Aside
   ═══════════════════════════════════════════════════════════════════════════ */

export function IotHeroAside({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; value: string; tone?: Tone }>;
}) {
  return (
    <div className={`${sharedMutedSurfaceClass} p-4 lg:p-5`} style={workspaceMutedSurfaceStyle}>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--tenant-accent)]">{title}</p>
      <div className="mt-4 space-y-2.5">
        {items.map((item) => (
          <div
            key={`${item.label}-${item.value}`}
            className="flex items-center justify-between rounded-2xl border border-border/70 bg-surface px-3.5 py-3"
          >
            <p className="text-xs text-muted">{item.label}</p>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-foreground">{item.value}</p>
              <span
                className={cn(
                  'h-2 w-2 rounded-full',
                  item.tone === 'red' ? 'bg-destructive' :
                  item.tone === 'amber' ? 'bg-warning' :
                  item.tone === 'green' ? 'bg-success' : 'bg-accent'
                )}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function IotSupportCard({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(`${sharedMutedSurfaceClass} p-4`, className)} style={workspaceMutedSurfaceStyle}>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Metric Card - Clean, Single KPI Focus
   ═══════════════════════════════════════════════════════════════════════════ */

export function IotMetricCard({
  label,
  value,
  footnote,
  status,
  detailTitle,
  detailDescription,
  tone = 'neutral',
  icon,
}: {
  label: string;
  value: string | number;
  footnote?: string;
  status?: string;
  detailTitle?: string;
  detailDescription?: string;
  tone?: Tone;
  icon?: ReactNode;
}) {
  return (
    <div className={`${sharedMutedSurfaceClass} p-5`} style={workspaceMutedSurfaceStyle}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">{label}</p>
          <p className="mt-3 text-3xl font-semibold tabular-nums text-foreground">{value}</p>
        </div>
        {icon ? (
          <span className={cn('rounded-xl p-2.5', toneBg[tone], toneText[tone])}>
            {icon}
          </span>
        ) : null}
      </div>
      {footnote || status ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {status ? <IotStatusPill label={status} tone={tone} /> : null}
          {footnote ? <p className={sharedCompactTextClass}>{footnote}</p> : null}
        </div>
      ) : null}
      {detailTitle || detailDescription ? (
        <div className="mt-4 border-t border-border/70 pt-3">
          {detailTitle ? <p className="text-sm font-medium text-foreground">{detailTitle}</p> : null}
          {detailDescription ? <p className="mt-1 text-xs leading-5 text-muted">{detailDescription}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Panel Container
   ═══════════════════════════════════════════════════════════════════════════ */

export function IotPanel({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn(sharedSectionSurfaceClass, className)} style={workspacePanelSurfaceStyle}>
      <div className={cn(sharedSectionHeaderClass, 'mb-5 border-b border-border/70 pb-4')}>
        <div>
          <h2 className={sharedSectionHeadingClass}>{title}</h2>
          {description ? <p className={`mt-1 ${sharedCompactTextClass}`}>{description}</p> : null}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div>{children}</div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Status Pill
   ═══════════════════════════════════════════════════════════════════════════ */

export function IotStatusPill({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-2xs font-medium',
        toneBorder[tone],
        toneBg[tone],
        toneText[tone]
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Notice Component
   ═══════════════════════════════════════════════════════════════════════════ */

export function IotNotice({
  title,
  description,
  tone = 'neutral',
  action,
}: {
  title: string;
  description: string;
  tone?: Tone;
  action?: ReactNode;
}) {
  return (
    <div className={cn('rounded-2xl border px-4 py-4 lg:px-5', toneBorder[tone], toneBg[tone])}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="mt-1 text-sm text-muted">{description}</p>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Empty State
   ═══════════════════════════════════════════════════════════════════════════ */

export function IotEmptyState({
  title,
  description,
  tone = 'neutral',
  compact = false,
}: {
  title: string;
  description: string;
  tone?: Tone;
  compact?: boolean;
}) {
  return (
    <div className={cn('rounded-2xl border', compact ? 'p-4' : 'px-5 py-5', toneBorder[tone], toneBg[tone])}>
      <div className="flex items-start gap-3">
        <span className={cn('mt-0.5 h-2 w-2 rounded-full', toneText[tone], 'bg-current')} />
        <div>
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="mt-1 text-sm text-muted">{description}</p>
        </div>
      </div>
    </div>
  );
}

export function IotTableStateRow({
  colSpan,
  title,
  description,
  tone = 'neutral',
}: {
  colSpan: number;
  title: string;
  description: string;
  tone?: Tone;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="p-4">
        <IotEmptyState title={title} description={description} tone={tone} compact />
      </td>
    </tr>
  );
}

export function IotDataTable({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-[var(--radius-2xl)] border border-[color:var(--app-shell-border)] bg-[color:var(--surface-1)] shadow-xs">
      <table className="min-w-full divide-y divide-[color:var(--app-shell-border)]">{children}</table>
    </div>
  );
}

export function IotDataTableHeader({ children }: { children: ReactNode }) {
  return <thead className="bg-[color:var(--surface-2)]">{children}</thead>;
}

export function IotDataTableHead({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        'px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--app-shell-muted)]',
        className
      )}
    >
      {children}
    </th>
  );
}

export function IotInlineActionButton({
  onClick,
  children
}: {
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={sharedCompactButtonClass}
    >
      {children}
    </button>
  );
}

export function IotInlineDangerButton({
  onClick,
  children
}: {
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 items-center justify-center rounded-xl border border-destructive/30 bg-destructive-muted px-3 text-xs font-medium text-destructive transition-colors duration-200 hover:border-destructive/50"
    >
      {children}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Button Components
   ═══════════════════════════════════════════════════════════════════════════ */

export function IotActionButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={sharedPrimaryButtonClass}
    >
      {children}
    </Link>
  );
}

export function IotPrimaryButton({
  type = 'button',
  onClick,
  disabled,
  children,
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
      className={`${sharedPrimaryButtonClass} disabled:translate-y-0 disabled:opacity-50`}
    >
      {children}
    </button>
  );
}

export function IotSecondaryButton({
  type = 'button',
  onClick,
  disabled,
  children,
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
      className={`${sharedSecondaryButtonClass} disabled:translate-y-0 disabled:opacity-60`}
    >
      {children}
    </button>
  );
}

export function IotTabButton({
  label,
  active,
  onClick,
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
        sharedCompactButtonClass,
        active
          ? 'border-[color:var(--tenant-accent)] bg-[color:var(--tenant-accent-soft)] text-[color:var(--tenant-accent)]'
          : undefined
      )}
    >
      {label}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Form Components
   ═══════════════════════════════════════════════════════════════════════════ */

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
  type = 'text',
}: FieldProps) {
  return (
    <label className={sharedFieldGroupClass}>
      <span className={sharedInputLabelClass}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className={sharedInputClass}
      />
      {helper ? <span className="text-xs leading-5 text-muted">{helper}</span> : null}
    </label>
  );
}

export function IotTextareaField({
  label,
  value,
  onChange,
  placeholder,
  helper,
}: FieldProps) {
  return (
    <label className={sharedFieldGroupClass}>
      <span className={sharedInputLabelClass}>{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className={sharedTextareaClass}
      />
      {helper ? <span className="text-xs leading-5 text-muted">{helper}</span> : null}
    </label>
  );
}

export function IotSelectField({
  label,
  value,
  onChange,
  options,
  helper,
}: FieldProps & { options: Array<{ value: string; label: string }> }) {
  return (
    <label className={sharedFieldGroupClass}>
      <span className={sharedInputLabelClass}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={sharedInputClass}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {helper ? <span className="text-xs leading-5 text-muted">{helper}</span> : null}
    </label>
  );
}

export function IotDateTimeField(props: Omit<FieldProps, 'type'>) {
  return <IotTextField {...props} type="datetime-local" />;
}

export function IotSectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-2xs font-medium uppercase tracking-wider text-muted">{children}</p>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Mini Trend Chart - Clean, Operational Readability
   ═══════════════════════════════════════════════════════════════════════════ */

export function IotMiniTrend({
  title,
  series,
  accent = 'var(--tenant-accent)',
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

  const chartPadding = { top: 8, bottom: 24, left: 4, right: 4 };
  const viewBox = { width: 100, height: 60 };
  const chartWidth = viewBox.width - chartPadding.left - chartPadding.right;
  const chartHeight = viewBox.height - chartPadding.top - chartPadding.bottom;

  const points = safeSeries.map((item, index) => {
    const x = chartPadding.left + (index / Math.max(safeSeries.length - 1, 1)) * chartWidth;
    const y = chartPadding.top + chartHeight - ((item.value - floor) / domain) * chartHeight;
    return { x, y, label: item.label, value: item.value };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');
  const areaPoints = `${chartPadding.left},${viewBox.height - chartPadding.bottom} ${polylinePoints} ${viewBox.width - chartPadding.right},${viewBox.height - chartPadding.bottom}`;

  const formatValue = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
      maximumFractionDigits: Number.isInteger(value) ? 0 : 1,
    }).format(value);

  return (
    <div className={`${sharedMutedSurfaceClass} p-4`} style={workspaceMutedSurfaceStyle}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className={sharedSectionHeadingClass}>{title}</p>
          <p className={`mt-1 ${sharedCompactTextClass}`}>Pulso recente da operacao</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold tabular-nums text-foreground">{formatValue(currentValue)}</p>
          <p className={cn('text-xs font-medium', delta >= 0 ? 'text-success' : 'text-destructive')}>
            {delta >= 0 ? '+' : ''}{formatValue(delta)} vs anterior
          </p>
        </div>
      </div>

      <svg viewBox={`0 0 ${viewBox.width} ${viewBox.height}`} className="h-32 w-full">
        <defs>
          <linearGradient id={`${gradientId}-area`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.15" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 1, 2, 3].map((i) => {
          const y = chartPadding.top + (chartHeight / 3) * i;
          return (
            <line
              key={i}
              x1={chartPadding.left}
              y1={y}
              x2={viewBox.width - chartPadding.right}
              y2={y}
              stroke="var(--chart-grid)"
              strokeWidth="0.5"
            />
          );
        })}

        {/* Area fill */}
        <polygon points={areaPoints} fill={`url(#${gradientId}-area)`} />

        {/* Line */}
        <polyline
          points={polylinePoints}
          fill="none"
          stroke={accent}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Current point */}
        {points.length > 0 && (
          <circle
            cx={points.at(-1)!.x}
            cy={points.at(-1)!.y}
            r="3"
            fill={accent}
          />
        )}
      </svg>

      {/* Time labels */}
      <div className="mt-2 flex justify-between text-2xs text-muted">
        <span>{safeSeries[0]?.label}</span>
        <span>{safeSeries.at(-1)?.label}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Surface Link
   ═══════════════════════════════════════════════════════════════════════════ */

export function IotSurfaceLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className={`group flex flex-col ${sharedMutedSurfaceClass} p-4 transition-colors hover:border-[color:var(--tenant-accent)]`}
      style={workspaceMutedSurfaceStyle}
    >
      <p className="text-sm font-medium text-foreground group-hover:text-[color:var(--tenant-accent)]">{title}</p>
      <p className={`mt-2 ${sharedCompactTextClass}`}>{description}</p>
      <div className="mt-4 flex items-center gap-1 text-xs font-medium text-[color:var(--tenant-accent)]">
        <span>Acessar</span>
        <svg className="h-3 w-3 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </div>
    </Link>
  );
}
