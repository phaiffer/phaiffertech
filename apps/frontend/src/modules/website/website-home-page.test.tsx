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

    expect(await screen.findByRole('heading', { name: /PetFlow for pet operations that need clarity/i })).toBeInTheDocument();
    expect(screen.getByText('Solutions')).toBeInTheDocument();
    expect(screen.getByText('PetFlow Complete')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Request a demo' })[0]).toHaveAttribute('href', '/contact');
  });
});
