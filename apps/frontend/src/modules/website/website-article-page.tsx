'use client';

import Link from 'next/link';
import {
  publicCardSurfaceClass,
  publicEyebrowClass
} from '@/shared/components/public-visual-system';
import { usePublicSite } from '@/shared/public/public-site-provider';
import { getWebsiteArticle, getWebsiteContent } from './website-content';
import { WebsiteHero } from './website-hero';
import { WebsiteArticleGrid, WebsiteSection, WebsiteSplitSection } from './website-sections';

type WebsiteArticlePageProps = {
  slug: string;
};

export function WebsiteArticlePage({ slug }: WebsiteArticlePageProps) {
  const { locale } = usePublicSite();
  const article = getWebsiteArticle(locale, slug);
  const articleList = getWebsiteContent(locale).articles.items;
  const labels =
    locale === 'pt-BR'
      ? {
          backToInsights: 'Voltar para insights',
          research: 'Pesquisa',
          context: 'Contexto',
          explore: 'Explorar',
          platform: 'Plataforma',
          engineering: 'Engineering',
          related: 'Relacionados',
          relatedTitle: 'Mais da mesma direção técnica',
          readInsight: 'Ler insight'
        }
      : {
          backToInsights: 'Back to insights',
          research: 'Research',
          context: 'Context',
          explore: 'Explore',
          platform: 'Platform',
          engineering: 'Engineering',
          related: 'Related',
          relatedTitle: 'More from the same technical direction',
          readInsight: 'Read insight'
        };

  if (!article) {
    return null;
  }

  const relatedArticles = articleList.filter((item) => item.slug !== slug).slice(0, 2);

  return (
    <>
      <WebsiteHero
        eyebrow={article.category}
        title={article.title}
        description={article.description}
        primaryCta={{ label: labels.backToInsights, href: '/articles' }}
        secondaryCta={{ label: labels.research, href: '/research' }}
      />

      <WebsiteSection tone="muted">
        <div className="grid gap-10 lg:grid-cols-[0.72fr_0.28fr] lg:items-start">
          <article className={`${publicCardSurfaceClass} p-8`}>
            <p className="text-lg font-medium leading-8 text-white">
              {article.highlight}
            </p>

            <div className="mt-10 space-y-10">
              {article.sections.map((section) => (
                <section key={section.title}>
                  <h2 className="text-2xl font-semibold tracking-tight text-white">
                    {section.title}
                  </h2>

                  <div className="mt-4 space-y-4 text-base leading-8 text-[#b6bec5]">
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            <div className="mt-10 border-t border-white/10 pt-6 text-base leading-8 text-[#b6bec5]">
              {article.closing}
            </div>
          </article>

          <aside className="space-y-4">
            <div className={`${publicCardSurfaceClass} p-6`}>
              <p className={publicEyebrowClass}>
                {labels.context}
              </p>
              <p className="mt-4 text-sm leading-6 text-[#b6bec5]">{article.category}</p>
              <p className="mt-2 text-sm leading-6 text-[#b6bec5]">{article.readTime}</p>
            </div>

            <div className={`${publicCardSurfaceClass} p-6`}>
              <p className={publicEyebrowClass}>
                {labels.explore}
              </p>
              <div className="mt-4 flex flex-col gap-3 text-sm">
                <Link href="/platform" className="font-semibold uppercase tracking-[0.16em] text-sky-400 transition hover:text-white">
                  {labels.platform}
                </Link>
                <Link href="/engineering" className="font-semibold uppercase tracking-[0.16em] text-sky-400 transition hover:text-white">
                  {labels.engineering}
                </Link>
                <Link href="/research" className="font-semibold uppercase tracking-[0.16em] text-sky-400 transition hover:text-white">
                  {labels.research}
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </WebsiteSection>

      <WebsiteSplitSection
        eyebrow={labels.related}
        title={labels.relatedTitle}
        description={article.description}
      >
        <WebsiteArticleGrid items={relatedArticles} ctaLabel={labels.readInsight} />
      </WebsiteSplitSection>
    </>
  );
}
