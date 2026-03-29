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
        'relative inline-flex items-center overflow-hidden rounded-[1.45rem] border p-1.5',
        resolveBannerToneClass(tone),
        className
      )}
    >
      <Image
        src="/PhaifferTech.png"
        alt={alt}
        width={1536}
        height={1024}
        priority={priority}
        className={joinClasses('h-auto w-auto max-h-full max-w-full object-contain object-left', imageClassName)}
      />
    </span>
  );
}
