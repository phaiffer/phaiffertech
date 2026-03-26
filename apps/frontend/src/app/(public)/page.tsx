import type { Metadata } from 'next';
import { WebsiteHomePage } from '@/modules/website/website-home-page';

export const metadata: Metadata = {
  title: 'PetFlow para banho e tosa recorrente',
  description:
    'PhaifferTech apresenta o PetFlow como sistema principal para agenda, recorrencia, estoque, cobranca e operacao pet.'
};

export default function PublicHomePage() {
  return <WebsiteHomePage />;
}
