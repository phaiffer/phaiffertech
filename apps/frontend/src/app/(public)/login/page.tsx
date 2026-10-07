import LoginPageClient from './login-page-client';

type LoginPageProps = {
  searchParams?: Promise<{
    next?: string | string[];
  }>;
};

function sanitizeNextPath(nextParam?: string | string[]) {
  const nextPath = Array.isArray(nextParam) ? nextParam[0] : nextParam;

  if (!nextPath || !nextPath.startsWith('/') || nextPath.startsWith('//')) {
    return '/dashboard';
  }

  return nextPath;
}

export default async function LoginPage({
  searchParams
}: LoginPageProps) {
  const resolvedSearchParams = await searchParams;

  return (
    <LoginPageClient
      nextPath={sanitizeNextPath(resolvedSearchParams?.next)}
    />
  );
}