import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PublicSiteShell } from '@/shared/components/public-site-shell';
import { PublicSiteProvider } from '@/shared/public/public-site-provider';

const { usePathnameMock } = vi.hoisted(() => ({
  usePathnameMock: vi.fn()
}));

vi.mock('next/navigation', () => ({
  usePathname: () => usePathnameMock()
}));

describe('PublicSiteShell', () => {
  beforeEach(() => {
    usePathnameMock.mockReset();
    usePathnameMock.mockReturnValue('/platform');
    window.localStorage.setItem('phaiffertech-public-locale', 'en-US');
  });

  it('shows the institutional navigation across the public site', async () => {
    render(
      <PublicSiteProvider>
        <PublicSiteShell>
          <div>content</div>
        </PublicSiteShell>
      </PublicSiteProvider>
    );

    const aboutLinks = await screen.findAllByRole('link', { name: 'About' });
    const accessLinks = screen.getAllByRole('link', { name: 'Platform access' });

    expect(aboutLinks[0]).toHaveAttribute('href', '/about');
    expect(accessLinks[0]).toHaveAttribute('href', '/login');
    expect(screen.getAllByText('PetFlow').length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: 'Light' })).not.toBeInTheDocument();
  });

  it('uses minimal chrome on the login route', () => {
    usePathnameMock.mockReturnValue('/login');

    render(
      <PublicSiteProvider>
        <PublicSiteShell>
          <div>login-content</div>
        </PublicSiteShell>
      </PublicSiteProvider>
    );

    expect(screen.getByText('login-content')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'About' })).not.toBeInTheDocument();
    expect(screen.queryByText('PetFlow')).not.toBeInTheDocument();
  });
});
