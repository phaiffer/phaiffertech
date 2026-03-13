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
      await screen.findByText(/One modular SaaS platform designed to host different operational products/i)
    ).toBeInTheDocument();
    expect(screen.getByAltText('PhaifferTech Background Banner')).toBeInTheDocument();
    expect(screen.getByText('Shared foundation')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Products' })).toHaveAttribute('href', '/products');
    expect(screen.getByRole('link', { name: 'Engineering' })).toHaveAttribute('href', '/engineering');
  });
});
