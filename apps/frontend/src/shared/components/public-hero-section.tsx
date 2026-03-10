import Link from 'next/link';

type PublicHeroSectionProps = {
  id?: string;
  eyebrow: string;
  title: string;
  description: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  platformCardEyebrow: string;
  platformCardTitle: string;
  platformCardText: string;
  frontendCardEyebrow: string;
  frontendCardTitle: string;
  backendCardEyebrow: string;
  backendCardTitle: string;
};

export function PublicHeroSection({
  id,
  eyebrow,
  title,
  description,
  primaryCtaLabel,
  primaryCtaHref,
  secondaryCtaLabel,
  secondaryCtaHref,
  platformCardEyebrow,
  platformCardTitle,
  platformCardText,
  frontendCardEyebrow,
  frontendCardTitle,
  backendCardEyebrow,
  backendCardTitle
}: PublicHeroSectionProps) {
  return (
    <section
      id={id}
      className="relative overflow-hidden border-b border-[var(--border)] bg-[linear-gradient(180deg,rgba(15,23,42,0.03),transparent_65%)]"
    >
      <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_55%)]" />

      <div className="relative mx-auto grid w-full max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-24">
        <div className="relative">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-action">
            {eyebrow}
          </p>

          <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight text-[var(--foreground)] sm:text-5xl lg:text-6xl">
            {title}
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            {description}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={primaryCtaHref}
              className="rounded-xl bg-action px-5 py-3 text-sm font-medium text-white shadow-[0_16px_30px_rgba(31,111,235,0.24)] transition hover:bg-blue-700"
            >
              {primaryCtaLabel}
            </Link>

            <Link
              href={secondaryCtaHref}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-5 py-3 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-muted)]"
            >
              {secondaryCtaLabel}
            </Link>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-[2rem] border border-sky-500/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(238,242,255,0.9))] p-6 shadow-[0_24px_60px_rgba(15,23,42,0.12)] dark:bg-[linear-gradient(180deg,rgba(17,26,46,0.96),rgba(23,35,61,0.9))]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              {platformCardEyebrow}
            </p>
            <p className="mt-3 text-2xl font-semibold text-[var(--foreground)] sm:text-3xl">
              {platformCardTitle}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{platformCardText}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-card">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                {frontendCardEyebrow}
              </p>
              <p className="mt-2 text-lg font-semibold text-[var(--foreground)]">
                {frontendCardTitle}
              </p>
            </div>

            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-card">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                {backendCardEyebrow}
              </p>
              <p className="mt-2 text-lg font-semibold text-[var(--foreground)]">
                {backendCardTitle}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
