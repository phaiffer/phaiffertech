import LoginPageClient from './login-page-client';

type LoginPageProps = {
  searchParams?: {
    next?: string | string[];
  };
};

function sanitizeNextPath(nextParam?: string | string[]) {
  const nextPath = Array.isArray(nextParam) ? nextParam[0] : nextParam;

  if (!nextPath || !nextPath.startsWith('/') || nextPath.startsWith('//')) {
    return '/dashboard';
  }

  return nextPath;
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  return <LoginPageClient nextPath={sanitizeNextPath(searchParams?.next)} />;
}
