import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WebsiteHomePage } from '@/modules/website/website-home-page';
import { PublicSiteProvider } from '@/shared/public/public-site-provider';

describe('WebsiteHomePage', () => {
  it('renders the institutional positioning and product summary', async () => {
    window.localStorage.setItem('phaiffertech-public-locale', 'en-US');

    render(
      <PublicSiteProvider>
        <WebsiteHomePage />
      </PublicSiteProvider>
    );

    expect(
      await screen.findByText(
        /PhaifferTech builds modular software platforms for operational environments/i
      )
    ).toBeInTheDocument();
    expect(screen.getByText('IoT System')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Explore the platform' })).toHaveAttribute(
      'href',
      '/platform'
    );
  });
});
