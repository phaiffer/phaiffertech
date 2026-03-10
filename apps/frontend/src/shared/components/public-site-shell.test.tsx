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
  });
});
