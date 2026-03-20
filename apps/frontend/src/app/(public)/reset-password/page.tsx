import ResetPasswordPageClient from './reset-password-page-client';

type ResetPasswordPageProps = {
  searchParams?: {
    token?: string | string[];
  };
};

function sanitizeToken(tokenParam?: string | string[]) {
  const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam;

  if (!token || !token.trim()) {
    return null;
  }

  return token.trim();
}

export default function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  return <ResetPasswordPageClient token={sanitizeToken(searchParams?.token)} />;
}
