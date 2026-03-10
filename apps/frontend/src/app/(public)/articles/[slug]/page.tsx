import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getWebsiteArticle,
  getWebsiteArticleSlugs
} from '@/modules/website/website-content';
import { WebsiteArticlePage } from '@/modules/website/website-article-page';

type ArticlePageProps = {
  params: {
    slug: string;
  };
};

export function generateStaticParams() {
  return getWebsiteArticleSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: ArticlePageProps): Metadata {
  const article = getWebsiteArticle('en-US', params.slug);

  return {
    title: article?.title ?? 'Article',
    description: article?.description ?? 'Technical insight from PhaifferTech.'
  };
}

export default function ArticlePage({ params }: ArticlePageProps) {
  if (!getWebsiteArticle('en-US', params.slug)) {
    notFound();
  }

  return <WebsiteArticlePage slug={params.slug} />;
}
