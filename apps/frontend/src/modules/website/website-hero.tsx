'use client';

import { PublicHeroSection } from '@/shared/components/public-hero-section';
import type { PublicLocale } from '@/shared/public/public-site-provider';
import type { WebsiteAction } from './website-content';

type WebsiteHeroVariant =
  | 'about'
  | 'platform'
  | 'products'
  | 'engineering'
  | 'research'
  | 'articles'
  | 'article'
  | 'contact';

type WebsiteHeroCardCopy = {
  platformCardEyebrow: string;
  platformCardTitle: string;
  platformCardText: string;
  frontendCardEyebrow: string;
  frontendCardTitle: string;
  backendCardEyebrow: string;
  backendCardTitle: string;
};

type WebsiteHeroProps = {
  id?: string;
  locale: PublicLocale;
  eyebrow: string;
  title: string;
  description: string;
  primaryCta: WebsiteAction;
  secondaryCta: WebsiteAction;
  variant?: WebsiteHeroVariant;
  cards?: WebsiteHeroCardCopy;
};

const defaultHeroCardCopy: Record<PublicLocale, Record<WebsiteHeroVariant, WebsiteHeroCardCopy>> = {
  'en-US': {
    about: {
      platformCardEyebrow: 'Company posture',
      platformCardTitle: 'Platform execution, product continuity, and research direction stay on one line.',
      platformCardText:
        'The same canonical hero frame now carries company identity, product direction, and architecture intent without switching layout patterns.',
      frontendCardEyebrow: 'Delivery',
      frontendCardTitle: 'Operational product surfaces with explicit UX discipline',
      backendCardEyebrow: 'Continuity',
      backendCardTitle: 'Research and platform direction grounded in a real codebase'
    },
    platform: {
      platformCardEyebrow: 'Platform view',
      platformCardTitle: 'Shared tenancy, contracts, and capability boundaries stay visible from the first screen.',
      platformCardText:
        'The platform page now uses the same hero shell as the homepage so the visual identity remains stable while the copy shifts to architecture detail.',
      frontendCardEyebrow: 'Frontend shell',
      frontendCardTitle: 'Canonical public navigation and modular page composition',
      backendCardEyebrow: 'Backend foundation',
      backendCardTitle: 'Multi-tenant contracts, modules, and governed product exposure'
    },
    products: {
      platformCardEyebrow: 'Product portfolio',
      platformCardTitle: 'CRM, PetFlow, and IoT System stay framed as one platform family.',
      platformCardText:
        'The products page now inherits the canonical hero structure so portfolio messaging keeps the same visual authority as the homepage.',
      frontendCardEyebrow: 'Modules',
      frontendCardTitle: 'Distinct operational domains presented through one public identity',
      backendCardEyebrow: 'Shared core',
      backendCardTitle: 'Contracts, tenancy, and capability reuse across products'
    },
    engineering: {
      platformCardEyebrow: 'Engineering posture',
      platformCardTitle: 'Architecture decisions, delivery discipline, and platform rigor stay in the same public frame.',
      platformCardText:
        'The engineering page now reuses the homepage hero system so technical authority is communicated through one canonical composition.',
      frontendCardEyebrow: 'Frontend',
      frontendCardTitle: 'Typed surfaces, consistent layout primitives, and deliberate UX structure',
      backendCardEyebrow: 'Backend',
      backendCardTitle: 'Modular monolith discipline with explicit contracts and operational boundaries'
    },
    research: {
      platformCardEyebrow: 'Research posture',
      platformCardTitle: 'Applied research remains connected to delivery, architecture, and product validation.',
      platformCardText:
        'The research page now shares the same hero identity as the homepage so exploration reads as part of the platform story rather than a separate visual track.',
      frontendCardEyebrow: 'Outputs',
      frontendCardTitle: 'Readable public surfaces for technical direction and findings',
      backendCardEyebrow: 'Bridge',
      backendCardTitle: 'Research continuity linked back to the active product foundation'
    },
    articles: {
      platformCardEyebrow: 'Publishing posture',
      platformCardTitle: 'Technical writing sits inside the same platform narrative and visual system.',
      platformCardText:
        'The articles index now follows the canonical hero layout so insights read as part of one institutional website rather than a separate content microsite.',
      frontendCardEyebrow: 'Insights',
      frontendCardTitle: 'Public writing shaped by the same compositional system as the rest of the site',
      backendCardEyebrow: 'Threads',
      backendCardTitle: 'Articles connected to platform, engineering, and research direction'
    },
    article: {
      platformCardEyebrow: 'Technical article',
      platformCardTitle: 'Each article now opens inside the same canonical hero frame as the rest of the website.',
      platformCardText:
        'The article detail page no longer switches to a different intro pattern, which keeps background treatment, typography, and structural rhythm consistent.',
      frontendCardEyebrow: 'Context',
      frontendCardTitle: 'Readable long-form content inside the same public identity system',
      backendCardEyebrow: 'Explore',
      backendCardTitle: 'Related platform, engineering, and research threads stay nearby'
    },
    contact: {
      platformCardEyebrow: 'Conversation entry',
      platformCardTitle: 'Contact, access, and next-step validation now live in the same hero system as the homepage.',
      platformCardText:
        'The contact page keeps the canonical public layout while shifting the copy toward demos, platform access, and technical discussion readiness.',
      frontendCardEyebrow: 'Access',
      frontendCardTitle: 'Public-to-authenticated transition remains explicit and guided',
      backendCardEyebrow: 'Dialogue',
      backendCardTitle: 'Product, platform, and engineering conversations framed with the same visual identity'
    }
  },
  'pt-BR': {
    about: {
      platformCardEyebrow: 'Postura da empresa',
      platformCardTitle: 'Execução de plataforma, continuidade de produto e direção de pesquisa na mesma linha.',
      platformCardText:
        'O mesmo enquadramento visual do hero agora carrega identidade da empresa, direção de produto e intenção arquitetural sem trocar o padrão de layout.',
      frontendCardEyebrow: 'Entrega',
      frontendCardTitle: 'Superfícies operacionais com disciplina explícita de UX',
      backendCardEyebrow: 'Continuidade',
      backendCardTitle: 'Pesquisa e direção de plataforma ancoradas em um codebase real'
    },
    platform: {
      platformCardEyebrow: 'Visão de plataforma',
      platformCardTitle: 'Tenancy compartilhado, contracts e boundaries de capability visíveis desde a primeira dobra.',
      platformCardText:
        'A página de plataforma agora usa o mesmo shell do hero da home para manter a identidade visual estável enquanto a copy aprofunda a arquitetura.',
      frontendCardEyebrow: 'Shell frontend',
      frontendCardTitle: 'Navegação pública canônica e composição modular de páginas',
      backendCardEyebrow: 'Fundação backend',
      backendCardTitle: 'Contracts multi-tenant, módulos e exposição governada de produto'
    },
    products: {
      platformCardEyebrow: 'Portfólio de produtos',
      platformCardTitle: 'CRM, PetFlow e IoT System apresentados como uma mesma família de plataforma.',
      platformCardText:
        'A página de produtos agora herda a estrutura canônica do hero para que o portfólio mantenha a mesma autoridade visual da home.',
      frontendCardEyebrow: 'Módulos',
      frontendCardTitle: 'Domínios operacionais distintos em uma única identidade pública',
      backendCardEyebrow: 'Core compartilhado',
      backendCardTitle: 'Contracts, tenancy e reuse de capability entre produtos'
    },
    engineering: {
      platformCardEyebrow: 'Postura de engenharia',
      platformCardTitle: 'Decisões de arquitetura, disciplina de entrega e rigor de plataforma no mesmo enquadramento público.',
      platformCardText:
        'A página de engineering agora reutiliza o sistema de hero da home para comunicar autoridade técnica dentro da mesma composição canônica.',
      frontendCardEyebrow: 'Frontend',
      frontendCardTitle: 'Superfícies tipadas, primitives consistentes e estrutura visual deliberada',
      backendCardEyebrow: 'Backend',
      backendCardTitle: 'Disciplina de modular monolith com contracts explícitos e boundaries operacionais'
    },
    research: {
      platformCardEyebrow: 'Postura de pesquisa',
      platformCardTitle: 'Pesquisa aplicada conectada à entrega, à arquitetura e à validação de produto.',
      platformCardText:
        'A página de research agora compartilha a mesma identidade visual da home para que exploração técnica seja lida como parte da história da plataforma.',
      frontendCardEyebrow: 'Outputs',
      frontendCardTitle: 'Superfícies públicas legíveis para direção técnica e resultados',
      backendCardEyebrow: 'Ponte',
      backendCardTitle: 'Continuidade de pesquisa conectada de volta à fundação ativa do produto'
    },
    articles: {
      platformCardEyebrow: 'Postura editorial',
      platformCardTitle: 'Publicação técnica dentro da mesma narrativa de plataforma e do mesmo sistema visual.',
      platformCardText:
        'A listagem de artigos agora segue o hero canônico para que os insights façam parte do mesmo site institucional, e não de um microsite separado.',
      frontendCardEyebrow: 'Insights',
      frontendCardTitle: 'Escrita pública moldada pela mesma composição do restante do site',
      backendCardEyebrow: 'Trilhas',
      backendCardTitle: 'Artigos conectados à direção de plataforma, engineering e research'
    },
    article: {
      platformCardEyebrow: 'Artigo técnico',
      platformCardTitle: 'Cada artigo agora abre dentro do mesmo enquadramento canônico do restante do website.',
      platformCardText:
        'A página de artigo não troca mais para um intro diferente, o que mantém tratamento de fundo, tipografia e ritmo estrutural consistentes.',
      frontendCardEyebrow: 'Contexto',
      frontendCardTitle: 'Conteúdo longo legível dentro do mesmo sistema de identidade pública',
      backendCardEyebrow: 'Explorar',
      backendCardTitle: 'Trilhas relacionadas de plataforma, engineering e research sempre por perto'
    },
    contact: {
      platformCardEyebrow: 'Entrada de conversa',
      platformCardTitle: 'Contato, acesso e próximo passo de validação agora vivem no mesmo sistema de hero da home.',
      platformCardText:
        'A página de contato mantém o layout público canônico enquanto desloca a copy para demos, acesso à plataforma e prontidão para discussões técnicas.',
      frontendCardEyebrow: 'Acesso',
      frontendCardTitle: 'Transição explícita e guiada do site público para o ambiente autenticado',
      backendCardEyebrow: 'Diálogo',
      backendCardTitle: 'Conversas sobre produto, plataforma e engenharia dentro da mesma identidade visual'
    }
  }
};

export function WebsiteHero({
  id,
  locale,
  eyebrow,
  title,
  description,
  primaryCta,
  secondaryCta,
  variant = 'about',
  cards
}: WebsiteHeroProps) {
  const heroCards = cards ?? defaultHeroCardCopy[locale][variant];

  return (
    <PublicHeroSection
      id={id}
      eyebrow={eyebrow}
      title={title}
      description={description}
      primaryCtaLabel={primaryCta.label}
      primaryCtaHref={primaryCta.href}
      secondaryCtaLabel={secondaryCta.label}
      secondaryCtaHref={secondaryCta.href}
      platformCardEyebrow={heroCards.platformCardEyebrow}
      platformCardTitle={heroCards.platformCardTitle}
      platformCardText={heroCards.platformCardText}
      frontendCardEyebrow={heroCards.frontendCardEyebrow}
      frontendCardTitle={heroCards.frontendCardTitle}
      backendCardEyebrow={heroCards.backendCardEyebrow}
      backendCardTitle={heroCards.backendCardTitle}
    />
  );
}
