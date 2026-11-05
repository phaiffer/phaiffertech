import { FormEvent, useState } from 'react';
import { useAppI18n } from '@/shared/i18n/app-i18n-provider';
import { clearImpersonationBackupSession, clearSession, setAuthNotice } from '@/shared/lib/session';
import { resolveApiErrorMessage } from '@/shared/lib/api-error-message';
import { authService } from '@/shared/services/auth-service';
import type { AuthenticatedUser } from '@/shared/types/auth';
import { FormInput } from '@/shared/ui/form-input';

type AccountSecurityPanelProps = {
  user: AuthenticatedUser | null;
};

export function AccountSecurityPanel({ user }: AccountSecurityPanelProps) {
  const { messages } = useAppI18n();
  const copy = messages.workspaceSettings.security;
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (newPassword !== confirmNewPassword) {
      setError(copy.mismatch);
      return;
    }

    if (currentPassword === newPassword) {
      setError(copy.sameAsCurrent);
      return;
    }

    setSubmitting(true);

    try {
      await authService.changePassword({
        currentPassword,
        newPassword,
        confirmNewPassword
      });
      setAuthNotice('password-changed');
      clearImpersonationBackupSession();
      clearSession();
    } catch (err) {
      setError(resolveApiErrorMessage(err, copy.genericError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="space-y-3 border-t border-[color:var(--line)] pt-4">
      <div>
        <h2 className="text-sm font-semibold text-[var(--ink)]">{copy.title}</h2>
        <p className="text-sm text-[var(--ink-2)]">{copy.description}</p>
      </div>

      <p className="text-sm text-[var(--ink-2)]">
        <span className="font-medium text-[var(--ink)]">{user.fullName}</span> · {user.email} · {user.tenantName}
      </p>

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <FormInput
            label={copy.currentPassword}
            value={currentPassword}
            onChange={setCurrentPassword}
            type="password"
            autoComplete="current-password"
            required
          />
          <FormInput
            label={copy.newPassword}
            value={newPassword}
            onChange={setNewPassword}
            type="password"
            autoComplete="new-password"
            description={copy.newPasswordDescription}
            required
          />
          <FormInput
            label={copy.confirmNewPassword}
            value={confirmNewPassword}
            onChange={setConfirmNewPassword}
            type="password"
            autoComplete="new-password"
            required
          />
        </div>

        {error ? <div className="ui-notice-error">{error}</div> : null}

        <button type="submit" disabled={submitting} className="ui-primary-button">
          {submitting ? copy.submitting : copy.submit}
        </button>
      </form>

      <p className="text-xs text-[var(--ink-2)]">{copy.signOutWarning}</p>
      <p className="text-xs text-[var(--ink-2)]">{copy.forgotPasswordHint}</p>
    </section>
  );
}
