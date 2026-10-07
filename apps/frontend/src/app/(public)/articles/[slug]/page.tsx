import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getWebsiteArticle,
  getWebsiteArticleSlugs
} from '@/modules/website/website-content';
import { WebsiteArticlePage } from '@/modules/website/website-article-page';

type ArticlePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return getWebsiteArticleSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getWebsiteArticle('en-US', slug);

  return {
    title: article?.title ?? 'Article',
    description: article?.description ?? 'Technical insight from PhaifferTech.'
  };
}

export default async function ArticlePage({
  params
}: ArticlePageProps) {
  const { slug } = await params;

  if (!getWebsiteArticle('en-US', slug)) {
    notFound();
  }

  return <WebsiteArticlePage slug={slug} />;
}