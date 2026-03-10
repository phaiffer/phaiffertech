import type { Metadata } from 'next';
import { WebsiteArticlesPage } from '@/modules/website/website-articles-page';

export const metadata: Metadata = {
  title: 'Articles',
  description:
    'Technical insights, architecture notes and future publication structure for the PhaifferTech public website.'
};

export default function ArticlesPage() {
  return <WebsiteArticlesPage />;
}
