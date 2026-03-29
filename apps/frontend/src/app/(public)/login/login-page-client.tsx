'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Check } from 'lucide-react';
import { BrandMark } from '@/shared/components/brand-assets';
import { AuthNoticeReason, consumeAuthNotice } from '@/shared/lib/session';
import { authService } from '@/shared/services/auth-service';
import { ApiClientError } from '@/shared/lib/http';
import { useAuth } from '@/shared/hooks/use-auth';
import { useAppMessages } from '@/shared/i18n/app-i18n-provider';
import { usePublicSite } from '@/shared/public/public-site-provider';

type LoginPageClientProps = {
  nextPath: string;
};

const benefits = [
  'Prontuario eletronico completo',
  'Agenda inteligente com lembretes',
  'Controle financeiro integrado',
  'Seguranca e backup automatico',
];

export default function LoginPageClient({ nextPath }: LoginPageClientProps) {
  const router = useRouter();
  usePublicSite();
  const t = useAppMessages().login;
  const { isAuthenticated, isLoading, signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noticeReason, setNoticeReason] = useState<AuthNoticeReason | null>(null);

  const notice = useMemo(() => {
    if (!noticeReason) return null;
    if (noticeReason === 'signed-out') return t.signedOutNotice;
    if (noticeReason === 'session-expired') return t.sessionExpiredNotice;
    if (noticeReason === 'tenant-mismatch') return t.tenantMismatchNotice;
    if (noticeReason === 'password-reset') return t.passwordResetNotice;
    return t.passwordChangedNotice;
  }, [noticeReason, t]);

  useEffect(() => {
    const authNotice = consumeAuthNotice();
    if (authNotice) setNoticeReason(authNotice);
  }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(nextPath);
    }
  }, [isAuthenticated, isLoading, nextPath, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const tokenData = await authService.login({
        tenantCode: 'default',
        email,
        password,
      });

      signIn({
        accessToken: tokenData.accessToken,
        user: tokenData.user,
      });

      router.replace(nextPath);
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
    <div className="flex min-h-screen">
      {/* Left Side - Form */}
      <section className="flex flex-1 flex-col justify-center bg-white px-8 py-12 sm:px-14 lg:px-20 xl:px-28">
        <div className="mx-auto w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-3">
            <BrandMark
              priority
              className="h-12 w-12 shrink-0"
              imageClassName="scale-[1.08]"
            />
            <div className="min-w-0">
              <span className="block text-lg font-semibold tracking-[-0.03em] text-petflow">
                PetFlow
              </span>
              <span className="mt-0.5 block text-[11px] font-medium text-muted-foreground">
                by PhaifferTech
              </span>
            </div>
          </Link>

          {/* Header */}
          <div className="mt-12">
            <h1 className="text-3xl font-semibold tracking-[-0.03em] text-foreground">
              Bem-vindo de volta
            </h1>
            <p className="mt-2 text-base text-muted">
              Acesse sua clinica veterinaria
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-10 space-y-6">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-foreground">
                Email
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Mail className="h-5 w-5" />
                </span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-border bg-white py-3.5 pl-12 pr-4 text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus:border-petflow focus:outline-none focus:ring-2 focus:ring-petflow/20"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-foreground">
                Senha
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Lock className="h-5 w-5" />
                </span>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-border bg-white py-3.5 pl-12 pr-4 text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus:border-petflow focus:outline-none focus:ring-2 focus:ring-petflow/20"
                  placeholder="********"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-petflow focus:ring-petflow"
                />
                <span className="text-sm text-muted">Lembrar de mim</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-petflow hover:text-petflow-dark"
              >
                Esqueceu a senha?
              </Link>
            </div>

            {notice && (
              <div className="rounded-xl border border-info/30 bg-info-muted px-4 py-3 text-sm text-info">
                {notice}
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive-muted px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-petflow py-3.5 text-base font-semibold text-white shadow-lg shadow-petflow/20 transition-all hover:-translate-y-0.5 hover:bg-petflow-dark hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-8 text-center text-sm text-muted">
            Ainda nao tem conta?{' '}
            <Link href="/register" className="font-medium text-petflow hover:text-petflow-dark">
              Comecar teste gratuito
            </Link>
          </p>
        </div>
      </section>

      {/* Right Side - Promotional Panel */}
      <section className="relative hidden flex-1 overflow-hidden bg-petflow-gradient lg:flex">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(16,185,129,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(20,184,166,0.12),transparent_50%)]" />

        <div className="relative z-10 flex w-full flex-col justify-center px-16 xl:px-24">
          <h2 className="text-4xl font-semibold tracking-[-0.03em] text-white xl:text-5xl">
            Gestao veterinaria{' '}
            <span className="text-petflow-light">profissional</span>
          </h2>
          
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-300">
            Prontuario digital, agendamentos, controle de vacinas e muito mais em uma plataforma moderna.
          </p>

          {/* Benefits List */}
          <div className="mt-10 space-y-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-petflow/20">
                  <Check className="h-4 w-4 text-petflow-light" />
                </span>
                <span className="text-base text-slate-200">{benefit}</span>
              </div>
            ))}
          </div>

          {/* Dog Image */}
          <div className="absolute bottom-0 right-0 w-[400px] xl:w-[500px]">
            <Image
              src="/images/login-dog.jpg"
              alt="Cachorro Shiba Inu"
              width={500}
              height={400}
              className="h-auto w-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#064E3B] via-transparent to-transparent" />
          </div>
        </div>
      </section>
    </div>
  );
}
