import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WebsitePlatformPage } from '@/modules/website/website-platform-page';
import { PublicSiteProvider } from '@/shared/public/public-site-provider';

describe('WebsitePlatformPage', () => {
  it('reuses the canonical website hero layout', async () => {
    window.localStorage.setItem('phaiffertech-public-locale', 'en-US');

    render(
      <PublicSiteProvider>
        <WebsitePlatformPage />
      </PublicSiteProvider>
    );

    expect(
      await screen.findByRole('heading', { name: /The technical foundation behind PetFlow/i })
    ).toBeInTheDocument();
    expect(screen.getAllByText('Shared foundation').length).toBeGreaterThan(0);
    expect(screen.getByText('Modules')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Products' })).toHaveAttribute('href', '/products');
    expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '/contact');
  });
});
