import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ForgotPasswordPage from '@/app/(public)/forgot-password/page';
import { PublicSiteProvider } from '@/shared/public/public-site-provider';
import { authService } from '@/shared/services/auth-service';

vi.mock('@/shared/services/auth-service', () => ({
  authService: {
    requestPasswordReset: vi.fn(),
    confirmPasswordReset: vi.fn()
  }
}));

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.setItem('phaiffertech-public-locale', 'en-US');
  });

  it('submits tenant code and email and shows a generic success notice', async () => {
    vi.mocked(authService.requestPasswordReset).mockResolvedValue(undefined);

    render(
      <PublicSiteProvider>
        <ForgotPasswordPage />
      </PublicSiteProvider>
    );

    fireEvent.change(screen.getByLabelText('Company or workspace'), { target: { value: 'default' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'admin@local.test' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }));

    await waitFor(() => {
      expect(authService.requestPasswordReset).toHaveBeenCalledWith({
        tenantCode: 'default',
        email: 'admin@local.test'
      });
    });

    expect(screen.getByText('If an account matches this workspace and email, we will send a reset link shortly.')).toBeInTheDocument();
  });
});
