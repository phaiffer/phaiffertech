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
      await screen.findByRole('heading', {
        name: /PetFlow for PetShop, grooming, veterinary clinic, and combined packages/i
      })
    ).toBeInTheDocument();
    expect(screen.getByText('Solutions')).toBeInTheDocument();
    expect(screen.getByText('One system. Four commercial fronts for real pet operations.')).toBeInTheDocument();
    expect(screen.getByText('Combined packages')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Request a demo' })[0]).toHaveAttribute('href', '/contact');
  });
});
