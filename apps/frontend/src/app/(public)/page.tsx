import Link from 'next/link';

export default function PublicHomePage() {
  return (
    <main>
      <section className="border-b border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-action">
            PhaifferTech Platform
          </p>

          <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-tight">
            Modular SaaS platform for real operations.
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-slate-600">
            PhaifferTech unifies CRM, IoT and vertical solutions in a modular
            multi-tenant platform designed for operational environments.
          </p>

          <div className="mt-10 flex gap-4">
            <Link
              href="/login"
              className="rounded-xl bg-action px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Access platform
            </Link>

            <Link
              href="/dashboard"
              className="rounded-xl border border-[var(--border)] px-6 py-3 text-sm font-medium transition hover:bg-[var(--surface-muted)]"
            >
              Open dashboard
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <h2 className="text-3xl font-semibold">Platform modules</h2>

          <p className="mt-4 max-w-2xl text-slate-600">
            The platform exposes modular capabilities that can be enabled per
            tenant according to the contracted scope.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-[var(--border)] p-6">
              <p className="text-sm font-semibold">CRM</p>
              <p className="mt-3 text-sm text-slate-600">
                Leads, deals, contacts, pipelines and commercial workflows.
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--border)] p-6">
              <p className="text-sm font-semibold">IoT</p>
              <p className="mt-3 text-sm text-slate-600">
                Devices, telemetry ingestion, alarms and operational monitoring.
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--border)] p-6">
              <p className="text-sm font-semibold">PetFlow</p>
              <p className="mt-3 text-sm text-slate-600">
                Veterinary operations including scheduling, inventory and
                clinical workflows.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <h2 className="text-3xl font-semibold">Architecture</h2>

          <p className="mt-4 max-w-2xl text-slate-600">
            The platform is built as a modular monorepo with a Spring Boot
            multi-tenant backend and a Next.js frontend organized by domain
            modules.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-[var(--border)] p-6">
              <p className="text-sm font-semibold">Backend</p>
              <p className="mt-3 text-sm text-slate-600">
                Java 21 · Spring Boot · Multi-tenant · JWT · RBAC · Flyway · MySQL
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--border)] p-6">
              <p className="text-sm font-semibold">Frontend</p>
              <p className="mt-3 text-sm text-slate-600">
                Next.js App Router · TypeScript · Tailwind · Modular architecture
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}