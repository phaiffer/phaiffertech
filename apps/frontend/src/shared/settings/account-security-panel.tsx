import { FormEvent, useState } from 'react';
import { useAppI18n } from '@/shared/i18n/app-i18n-provider';
import { clearImpersonationBackupSession, clearSession, setAuthNotice } from '@/shared/lib/session';
import { resolveApiErrorMessage } from '@/shared/lib/api-error-message';
import { authService } from '@/shared/services/auth-service';
import type { AuthenticatedUser } from '@/shared/types/auth';
import { FormInput } from '@/shared/ui/form-input';
import { PageSection } from '@/shared/ui/page-section';

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
    <PageSection title={copy.title} description={copy.description}>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
        <div className="space-y-3">
          <div className="ui-surface-muted p-4 lg:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--app-shell-muted)]">
              {copy.activeAccount}
            </p>
            <div className="mt-3 space-y-3 text-sm text-[color:var(--app-shell-text)]">
              <div>
                <p className="font-semibold text-[color:var(--app-shell-heading)]">{user.fullName}</p>
                <p className="text-[color:var(--app-shell-muted)]">{user.email}</p>
              </div>
              <div>
                <p className="font-semibold text-[color:var(--app-shell-heading)]">{copy.tenant}</p>
                <p className="text-[color:var(--app-shell-muted)]">{user.tenantName} ({user.tenantCode})</p>
              </div>
            </div>
          </div>

          <div className="ui-notice-warning">{copy.signOutWarning}</div>

          <div className="ui-notice-neutral">{copy.forgotPasswordHint}</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error ? (
            <div className="ui-notice-error">{error}</div>
          ) : null}

          <FormInput
            label={copy.currentPassword}
            value={currentPassword}
            onChange={setCurrentPassword}
            type="password"
            description={copy.currentPasswordDescription}
            required
          />

          <FormInput
            label={copy.newPassword}
            value={newPassword}
            onChange={setNewPassword}
            type="password"
            description={copy.newPasswordDescription}
            required
          />

          <FormInput
            label={copy.confirmNewPassword}
            value={confirmNewPassword}
            onChange={setConfirmNewPassword}
            type="password"
            required
          />

          <button type="submit" disabled={submitting} className="ui-primary-button">
            {submitting ? copy.submitting : copy.submit}
          </button>
        </form>
      </div>
    </PageSection>
  );
}
