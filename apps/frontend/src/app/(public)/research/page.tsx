import type { Metadata } from 'next';
import { WebsiteResearchPage } from '@/modules/website/website-research-page';

export const metadata: Metadata = {
  title: 'Research',
  description:
    'Research direction for PhaifferTech across applied architecture, data engineering and future academic continuity.'
};

export default function ResearchPage() {
  return <WebsiteResearchPage />;
}
