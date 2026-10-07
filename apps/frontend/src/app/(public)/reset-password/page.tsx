import ResetPasswordPageClient from './reset-password-page-client';

type ResetPasswordPageProps = {
  searchParams?: Promise<{
    token?: string | string[];
  }>;
};

function sanitizeToken(tokenParam?: string | string[]) {
  const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam;

  if (!token || !token.trim()) {
    return null;
  }

  return token.trim();
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const resolvedSearchParams = await searchParams;

  return <ResetPasswordPageClient token={sanitizeToken(resolvedSearchParams?.token)} />;
}
