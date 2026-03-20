import { FormEvent, useState } from 'react';
import { clearSession, setAuthNotice } from '@/shared/lib/session';
import { ApiClientError } from '@/shared/lib/http';
import { authService } from '@/shared/services/auth-service';
import type { AuthenticatedUser } from '@/shared/types/auth';
import { FormInput } from '@/shared/ui/form-input';
import { PageSection } from '@/shared/ui/page-section';

type AccountSecurityPanelProps = {
  user: AuthenticatedUser | null;
};

export function AccountSecurityPanel({ user }: AccountSecurityPanelProps) {
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
      setError('New password confirmation must match.');
      return;
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from the current password.');
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
      clearSession();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError('Unable to update the password right now.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageSection
      title="Account Security"
      description="Keep the current authenticated workspace coherent while rotating credentials from inside the platform."
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
        <div className="space-y-3">
          <div className="ui-surface-muted p-4 lg:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--app-shell-muted)]">
              Active Account
            </p>
            <div className="mt-3 space-y-3 text-sm text-[color:var(--app-shell-text)]">
              <div>
                <p className="font-semibold text-[color:var(--app-shell-heading)]">{user.fullName}</p>
                <p className="text-[color:var(--app-shell-muted)]">{user.email}</p>
              </div>
              <div>
                <p className="font-semibold text-[color:var(--app-shell-heading)]">Tenant</p>
                <p className="text-[color:var(--app-shell-muted)]">{user.tenantName} ({user.tenantCode})</p>
              </div>
            </div>
          </div>

          <div className="ui-notice-warning">
            Updating the password signs out the current browser and revokes active refresh sessions for the user.
          </div>

          <div className="ui-notice-neutral">
            Self-service password recovery stays out of scope until notification delivery and reset-token infrastructure are productized.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error ? (
            <div className="ui-notice-error">{error}</div>
          ) : null}

          <FormInput
            label="Current password"
            value={currentPassword}
            onChange={setCurrentPassword}
            type="password"
            required
          />

          <FormInput
            label="New password"
            value={newPassword}
            onChange={setNewPassword}
            type="password"
            required
          />

          <FormInput
            label="Confirm new password"
            value={confirmNewPassword}
            onChange={setConfirmNewPassword}
            type="password"
            required
          />

          <button type="submit" disabled={submitting} className="ui-primary-button">
            {submitting ? 'Updating password...' : 'Update password'}
          </button>
        </form>
      </div>
    </PageSection>
  );
}
