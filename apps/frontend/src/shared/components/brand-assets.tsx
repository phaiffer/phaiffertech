import type { CSSProperties } from 'react';
import Image from 'next/image';

type BrandTone = 'light' | 'dark';

type BrandMarkProps = {
  alt?: string;
  priority?: boolean;
  tone?: BrandTone;
  className?: string;
  imageClassName?: string;
  style?: CSSProperties;
};

type BrandBannerProps = {
  alt?: string;
  priority?: boolean;
  tone?: BrandTone;
  className?: string;
  imageClassName?: string;
};

type PetFlowMarkProps = {
  className?: string;
  iconClassName?: string;
};

function joinClasses(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(' ');
}

function resolveMarkToneClass(tone: BrandTone) {
  if (tone === 'dark') {
    return 'border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.06))] shadow-[0_24px_64px_-36px_rgba(15,23,42,0.72)] backdrop-blur';
  }

  return 'border-slate-200/80 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.08),transparent_68%),linear-gradient(180deg,#ffffff,#f8fbf9)] shadow-[0_18px_42px_-30px_rgba(15,23,42,0.18)]';
}

function resolveBannerToneClass(tone: BrandTone) {
  if (tone === 'dark') {
    return 'border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.04))] shadow-[0_28px_72px_-38px_rgba(15,23,42,0.8)] backdrop-blur';
  }

  return 'border-slate-200/80 bg-white shadow-[0_16px_32px_-28px_rgba(15,23,42,0.18)]';
}

export function PetFlowMark({ className, iconClassName }: PetFlowMarkProps) {
  return (
    <span
      className={joinClasses(
        'relative inline-flex items-center justify-center overflow-hidden rounded-[1.2rem] border border-emerald-200/80 bg-[radial-gradient(circle_at_top,rgba(167,243,208,0.44),transparent_58%),linear-gradient(135deg,#10b981,#0f766e)] text-white shadow-[0_18px_40px_-26px_rgba(16,185,129,0.5)] ring-1 ring-white/35',
        className
      )}
    >
      <span className="pointer-events-none absolute inset-[10%] rounded-[0.95rem] border border-white/18" />
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        className={joinClasses('h-[60%] w-[60%]', iconClassName)}
      >
        <path d="M7.25 4.6a1.35 1.35 0 0 1 1.35-1.35h4.15c3.56 0 6 2.3 6 5.55 0 3.16-2.44 5.45-6 5.45H10.9V19a1.4 1.4 0 1 1-2.8 0V4.6Zm3.65 1.95v5.45h1.75c2.01 0 3.37-1.05 3.37-2.73 0-1.67-1.36-2.72-3.37-2.72H10.9Z" />
        <circle cx="17.15" cy="6.45" r="1.3" fill="#a7f3d0" />
      </svg>
    </span>
  );
}

export function BrandMark({
  alt = 'PhaifferTech logo',
  priority = false,
  tone = 'light',
  className,
  imageClassName,
  style
}: BrandMarkProps) {
  return (
    <span
      className={joinClasses(
        'relative inline-flex items-center justify-center overflow-hidden rounded-[1.45rem] border p-[0.34rem]',
        resolveMarkToneClass(tone),
        className
      )}
      style={style}
    >
      <Image
        src="/PhaifferTech_logo.png"
        alt={alt}
        width={1024}
        height={1024}
        priority={priority}
        className={joinClasses('h-auto w-auto max-h-full max-w-full object-contain', imageClassName)}
      />
    </span>
  );
}

export function BrandBanner({
  alt = 'PhaifferTech',
  priority = false,
  tone = 'light',
  className,
  imageClassName
}: BrandBannerProps) {
  return (
    <span
      className={joinClasses(
        'relative inline-flex items-center justify-center overflow-hidden rounded-[1.45rem] border p-0.5',
        resolveBannerToneClass(tone),
        className
      )}
    >
      <Image
        src="/PhaifferTech_banner.png"
        alt={alt}
        width={1536}
        height={1024}
        priority={priority}
        className={joinClasses('h-full w-full max-h-full max-w-full object-contain object-center', imageClassName)}
      />
    </span>
  );
}
