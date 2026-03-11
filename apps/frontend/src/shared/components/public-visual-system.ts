export const publicEyebrowClass = 'text-[10px] font-semibold uppercase tracking-[0.24em] text-action';

export const publicSectionTitleClass = 'mt-3 text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-[2.15rem]';

export const publicSectionSupportingTextClass = 'mt-4 max-w-3xl text-[15px] leading-7 text-slate-600 dark:text-slate-300';

export const publicCardSurfaceClass =
  'rounded-[2rem] border border-sky-500/14 bg-[linear-gradient(180deg,var(--surface),var(--surface-muted))] shadow-[0_18px_44px_rgba(15,23,42,0.14)]';

export const publicInteractiveCardSurfaceClass =
  `${publicCardSurfaceClass} transition duration-200 hover:-translate-y-0.5 hover:border-sky-400/24 hover:shadow-[0_24px_56px_rgba(56,189,248,0.14)]`;

export const publicHighlightSurfaceClass =
  'rounded-[2rem] border border-sky-500/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(239,246,255,0.92))] shadow-[0_24px_60px_rgba(15,23,42,0.14),0_0_40px_rgba(56,189,248,0.12)] dark:bg-[linear-gradient(180deg,rgba(12,21,39,0.98),rgba(16,29,49,0.94))]';

export const publicChromeSurfaceClass =
  'border border-sky-500/12 bg-[color:var(--surface)]/86 shadow-[0_18px_42px_rgba(2,6,23,0.16)] backdrop-blur-xl';

export const publicPrimaryButtonClass =
  'rounded-xl border border-sky-400/18 bg-action px-5 py-3 text-sm font-medium text-white shadow-[0_16px_32px_rgba(31,111,235,0.24)] transition duration-200 hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-blue-700 hover:shadow-[0_22px_44px_rgba(56,189,248,0.2)]';

export const publicSecondaryButtonClass =
  'rounded-xl border border-sky-500/14 bg-[var(--surface)] px-5 py-3 text-sm font-medium text-[var(--foreground)] shadow-[0_12px_28px_rgba(15,23,42,0.08)] transition duration-200 hover:-translate-y-0.5 hover:border-sky-400/24 hover:bg-[var(--surface-muted)] hover:shadow-[0_18px_38px_rgba(15,23,42,0.12)]';
