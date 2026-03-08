'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/shared/services/auth-service';
import { ApiClientError } from '@/shared/lib/http';
import { useAuth } from '@/shared/hooks/use-auth';
import { usePublicSite } from '@/shared/public/public-site-provider';

const copy = {
  'pt-BR': {
    eyebrow: 'Acesso à plataforma',
    title: 'Entre na PhaifferTech Platform',
    description:
      'Acesse a operação multi-tenant com permissões, módulos habilitados por contrato e visão executiva por contexto de negócio.',
    tenantCodeLabel: 'Tenant Code',
    emailLabel: 'E-mail',
    passwordLabel: 'Senha',
    submitLabel: 'Entrar',
    loadingLabel: 'Entrando...',
    helperTitle: 'Ambiente institucional + operação SaaS',
    helperText:
      'A área pública apresenta a proposta da plataforma. A área autenticada entrega a operação real com CRM, IoT e PetFlow conforme o escopo contratado.',
    contractTitle: 'Experiência orientada por contrato',
    contractText:
      'Cada cliente visualiza apenas os módulos e permissões compatíveis com o plano contratado.',
    governanceTitle: 'Governança central',
    governanceText:
      'Autenticação, tenants, IAM, settings e trilha operacional integrados na mesma base.',
    demoTitle: 'Narrativa pronta para demo',
    demoText:
      'A apresentação institucional e os dashboards operacionais seguem a mesma identidade visual.',
    errorFallback: 'Falha inesperada ao autenticar.',
    demoEmail: 'Demo e-mail',
    demoPassword: 'Demo password'
  },
  'en-US': {
    eyebrow: 'Platform access',
    title: 'Sign in to PhaifferTech Platform',
    description:
      'Access a multi-tenant operation with permissions, contract-based modules and executive visibility by business context.',
    tenantCodeLabel: 'Tenant Code',
    emailLabel: 'Email',
    passwordLabel: 'Password',
    submitLabel: 'Sign in',
    loadingLabel: 'Signing in...',
    helperTitle: 'Institutional experience + SaaS operation',
    helperText:
      'The public area presents the platform narrative. The authenticated area delivers the real operation with CRM, IoT and PetFlow according to the contracted scope.',
    contractTitle: 'Contract-oriented experience',
    contractText:
      'Each customer only sees the modules and permissions that match the contracted plan.',
    governanceTitle: 'Central governance',
    governanceText:
      'Authentication, tenants, IAM, settings and operational traceability integrated in the same foundation.',
    demoTitle: 'Demo-ready narrative',
    demoText:
      'The institutional presentation and the operational dashboards follow the same visual identity.',
    errorFallback: 'Unexpected authentication failure.',
    demoEmail: 'Demo email',
    demoPassword: 'Demo password'
  }
} as const;

export default function LoginPage() {
  const router = useRouter();
  const { locale } = usePublicSite();
  const { isAuthenticated, isLoading, signIn } = useAuth();

  const [nextRoute, setNextRoute] = useState('/dashboard');
  const [tenantCode, setTenantCode] = useState('default');
  const [email, setEmail] = useState('admin@local.test');
  const [password, setPassword] = useState('Admin@123');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setNextRoute(params.get('next') || '/dashboard');
  }, []);

  const t = useMemo(() => copy[locale], [locale]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const tokenData = await authService.login({ tenantCode, email, password });

      signIn({
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
        user: tokenData.user
      });

      router.replace(nextRoute);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError(t.errorFallback);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
        <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-card lg:p-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-action">
            {t.eyebrow}
          </p>

          <h1 className="mt-3 text-3xl font-semibold leading-tight text-[var(--foreground)] sm:text-4xl">
            {t.title}
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">
            {t.description}
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label
                htmlFor="tenantCode"
                className="block text-sm font-medium text-[var(--foreground)]"
              >
                {t.tenantCodeLabel}
              </label>
              <input
                id="tenantCode"
                value={tenantCode}
                onChange={(event) => setTenantCode(event.target.value)}
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition placeholder:text-slate-400 focus:border-action focus:ring-2 focus:ring-blue-100"
                required
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[var(--foreground)]"
              >
                {t.emailLabel}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition placeholder:text-slate-400 focus:border-action focus:ring-2 focus:ring-blue-100"
                placeholder="name@company.com"
                required
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[var(--foreground)]"
              >
                {t.passwordLabel}
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition placeholder:text-slate-400 focus:border-action focus:ring-2 focus:ring-blue-100"
                placeholder="••••••••"
                required
              />
            </div>

            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-action px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? t.loadingLabel : t.submitLabel}
            </button>
          </form>
        </section>

        <aside className="grid gap-4">
          <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-card">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Platform context
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
              {t.helperTitle}
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">{t.helperText}</p>
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-card">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Contract scope
              </p>
              <h3 className="mt-2 text-lg font-semibold text-[var(--foreground)]">
                {t.contractTitle}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{t.contractText}</p>
            </section>

            <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-card">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Governance
              </p>
              <h3 className="mt-2 text-lg font-semibold text-[var(--foreground)]">
                {t.governanceTitle}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{t.governanceText}</p>
            </section>
          </div>

          <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-card">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Demo readiness
            </p>
            <h3 className="mt-2 text-lg font-semibold text-[var(--foreground)]">
              {t.demoTitle}
            </h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">{t.demoText}</p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {t.demoEmail}
                </p>
                <p className="mt-1 text-sm font-medium text-[var(--foreground)]">
                  admin@local.test
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {t.demoPassword}
                </p>
                <p className="mt-1 text-sm font-medium text-[var(--foreground)]">
                  Admin@123
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}