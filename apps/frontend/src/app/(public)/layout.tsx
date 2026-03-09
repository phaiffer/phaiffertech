import Link from 'next/link';
import { PublicSiteProvider } from '@/shared/public/public-site-provider';

export default function PublicLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <PublicSiteProvider>
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <header className="border-b border-[var(--border)] bg-[var(--surface)]">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                PhaifferTech Platform
              </p>
              <p className="mt-1 text-lg font-semibold">SaaS Control Plane</p>
            </div>

            <nav className="flex items-center gap-3">
              <Link
                href="/"
                className="rounded-xl px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-[var(--surface-muted)]"
              >
                Home
              </Link>

              <Link
                href="/login"
                className="rounded-xl bg-action px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                Login
              </Link>
            </nav>
          </div>
        </header>

        <main>{children}</main>

        <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-6 text-sm text-slate-500 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <span>
              PhaifferTech Platform · Modular SaaS for operational environments.
            </span>

            <div className="flex items-center gap-4">
              <Link href="/" className="transition hover:text-[var(--foreground)]">
                Home
              </Link>

              <Link
                href="/login"
                className="transition hover:text-[var(--foreground)]"
              >
                Login
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </PublicSiteProvider>
  );
}