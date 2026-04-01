import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WebsiteContactPage } from '@/modules/website/website-contact-page';
import { PublicSiteProvider } from '@/shared/public/public-site-provider';

describe('WebsiteContactPage', () => {
  it('renders the real contact channels and commercial request paths', async () => {
    window.localStorage.setItem('phaiffertech-public-locale', 'en-US');

    render(
      <PublicSiteProvider>
        <WebsiteContactPage />
      </PublicSiteProvider>
    );

    expect(
      await screen.findByRole('heading', {
        name: /Request a quote, hiring plan, or demo for PetFlow/i
      })
    ).toBeInTheDocument();
    expect(screen.getByText('Quotation')).toBeInTheDocument();
    expect(screen.getByText('Hiring')).toBeInTheDocument();
    expect(screen.getByText('Demo')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Send email' })[0]).toHaveAttribute(
      'href',
      'mailto:willian.phaiffer@phaiffertech.com.br'
    );
    expect(screen.getAllByRole('link', { name: 'Call now' })[0]).toHaveAttribute(
      'href',
      'tel:+554196294533'
    );
    expect(screen.getByText('willian.phaiffer@phaiffertech.com.br')).toBeInTheDocument();
    expect(screen.getByText('+55 41 9629-4533')).toBeInTheDocument();
  });
});
