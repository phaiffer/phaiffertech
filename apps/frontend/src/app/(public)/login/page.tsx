'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/shared/services/auth-service';
import { ApiClientError } from '@/shared/lib/http';
import { useAuth } from '@/shared/hooks/use-auth';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, signIn } = useAuth();

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const tokenData = await authService.login({
        tenantCode,
        email,
        password
      });

      signIn({
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
        user: tokenData.user
      });

      router.replace('/dashboard');
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError('Unexpected authentication error.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">

        {/* Login Form */}

        <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-card">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-action">
            Platform Access
          </p>

          <h1 className="mt-4 text-3xl font-semibold">
            Sign in to PhaifferTech
          </h1>

          <p className="mt-3 text-sm text-slate-600">
            Access the operational platform with tenant isolation,
            permissions and modular capabilities.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">

            <div>
              <label className="text-sm font-medium">Tenant Code</label>
              <input
                value={tenantCode}
                onChange={(e) => setTenantCode(e.target.value)}
                className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-action"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-action"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full rounded-xl border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-action"
                required
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-action px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-70"
            >
              {submitting ? 'Signing in...' : 'Sign in'}
            </button>

          </form>
        </section>

        {/* Platform Context Panel */}

        <aside className="grid gap-6">

          <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-card">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Platform Context
            </p>

            <h2 className="mt-3 text-2xl font-semibold">
              Modular SaaS architecture
            </h2>

            <p className="mt-4 text-sm text-slate-600 leading-6">
              PhaifferTech combines CRM, IoT and vertical solutions in a single
              multi-tenant platform with modular capabilities enabled per
              customer.
            </p>
          </section>

          <div className="grid gap-4 sm:grid-cols-2">

            <section className="rounded-2xl border border-[var(--border)] p-6">
              <p className="text-xs font-semibold uppercase text-slate-500">
                Contract Scope
              </p>
              <p className="mt-3 text-sm text-slate-600">
                Each tenant sees only the modules enabled in the contract.
              </p>
            </section>

            <section className="rounded-2xl border border-[var(--border)] p-6">
              <p className="text-xs font-semibold uppercase text-slate-500">
                Governance
              </p>
              <p className="mt-3 text-sm text-slate-600">
                Identity, permissions and tenant isolation are enforced
                centrally.
              </p>
            </section>

          </div>

          <section className="rounded-2xl border border-[var(--border)] p-6 bg-[var(--surface-muted)]">
            <p className="text-xs font-semibold uppercase text-slate-500">
              Demo Credentials
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">

              <div>
                <p className="text-xs text-slate-500">Email</p>
                <p className="text-sm font-medium">admin@local.test</p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Password</p>
                <p className="text-sm font-medium">Admin@123</p>
              </div>

            </div>
          </section>

        </aside>
      </div>
    </div>
  );
}