import { PublicLocale } from './public-site-provider';

export const publicSiteMessages = {
  'pt-BR': {
    shell: {
      brandEyebrow: 'PhaifferTech',
      brandTitle: 'Engineering platforms for real operations',
      brandSubtitle:
        'Arquitetura de software, dados, cloud e pesquisa aplicada na mesma base.',
      navHome: 'Início',
      navAbout: 'Sobre',
      navPlatform: 'Plataforma',
      navProducts: 'Produtos',
      navEngineering: 'Engineering',
      navResearch: 'Pesquisa',
      navArticles: 'Insights',
      navContact: 'Contato',
      navLogin: 'Acesso à plataforma',
      themeLight: 'Light',
      themeDark: 'Dark',
      localeLabel: 'Idioma',
      footerNarrativeTitle: 'PhaifferTech',
      footerNarrativeText:
        'Empresa e plataforma orientadas por arquitetura de software, cloud, data engineering e sistemas operacionais modulares.',
      footerExploreTitle: 'Explorar',
      footerProductsTitle: 'Produtos',
      footerAccessTitle: 'Acesso',
      footerCopyright:
        'PhaifferTech · Plataforma SaaS modular multi-tenant para operação, engenharia e pesquisa aplicada.'
    },
    login: {
      eyebrow: 'Acesso à plataforma',
      title: 'Entre na PhaifferTech Platform',
      description:
        'Acesse o ambiente protegido da plataforma com isolamento por tenant, permissões granulares, habilitação modular e governança operacional.',
      tenantCodeLabel: 'Tenant Code',
      emailLabel: 'E-mail',
      passwordLabel: 'Senha',
      submitLabel: 'Entrar',
      loadingLabel: 'Entrando...',
      helperTitle: 'Camada institucional + operação autenticada',
      helperText:
        'O site público comunica posicionamento, arquitetura e direção técnica. A área autenticada entrega a operação real conforme módulos, permissões e escopo contratado.',
      contractTitle: 'Escopo orientado por contrato',
      contractText:
        'Cada cliente enxerga apenas os módulos, recursos e permissões compatíveis com o contrato ativo.',
      governanceTitle: 'Governança central',
      governanceText:
        'Autenticação, tenancy, IAM, auditoria e políticas de acesso permanecem centralizados na mesma fundação.',
      demoTitle: 'Ambiente preparado para demonstração',
      demoText:
        'A mesma base suporta demonstração comercial, desenvolvimento de produto e validação técnica do ecossistema.',
      errorFallback: 'Falha inesperada ao autenticar.',
      demoEmail: 'E-mail de demonstração',
      demoPassword: 'Senha de demonstração',
      platformContextEyebrow: 'Contexto da plataforma',
      contractScopeEyebrow: 'Escopo contratual',
      governanceEyebrow: 'Governança',
      demoReadinessEyebrow: 'Pronto para demo',
      returnToSite: 'Voltar ao site institucional'
    }
  },
  'en-US': {
    shell: {
      brandEyebrow: 'PhaifferTech',
      brandTitle: 'Engineering platforms for real operations',
      brandSubtitle:
        'Software architecture, data engineering, cloud systems and applied research on the same foundation.',
      navHome: 'Home',
      navAbout: 'About',
      navPlatform: 'Platform',
      navProducts: 'Products',
      navEngineering: 'Engineering',
      navResearch: 'Research',
      navArticles: 'Insights',
      navContact: 'Contact',
      navLogin: 'Platform access',
      themeLight: 'Light',
      themeDark: 'Dark',
      localeLabel: 'Language',
      footerNarrativeTitle: 'PhaifferTech',
      footerNarrativeText:
        'A company and platform shaped by software architecture, cloud systems, data engineering and modular operational products.',
      footerExploreTitle: 'Explore',
      footerProductsTitle: 'Products',
      footerAccessTitle: 'Access',
      footerCopyright:
        'PhaifferTech · Multi-tenant modular SaaS platform for operations, engineering and applied research.'
    },
    login: {
      eyebrow: 'Platform access',
      title: 'Sign in to PhaifferTech Platform',
      description:
        'Enter the protected platform environment with tenant isolation, granular permissions, modular enablement and operational governance.',
      tenantCodeLabel: 'Tenant Code',
      emailLabel: 'Email',
      passwordLabel: 'Password',
      submitLabel: 'Sign in',
      loadingLabel: 'Signing in...',
      helperTitle: 'Institutional experience + authenticated operation',
      helperText:
        'The public website communicates positioning, architecture and technical direction. The authenticated area delivers the real operation according to modules, permissions and contracted scope.',
      contractTitle: 'Contract-oriented scope',
      contractText:
        'Each customer only sees the modules, capabilities and permissions that match the active contract.',
      governanceTitle: 'Central governance',
      governanceText:
        'Authentication, tenancy, IAM, auditing and access policies remain centralized in the same foundation.',
      demoTitle: 'Demo-ready environment',
      demoText:
        'The same base supports commercial demos, product development and technical validation across the ecosystem.',
      errorFallback: 'Unexpected authentication failure.',
      demoEmail: 'Demo email',
      demoPassword: 'Demo password',
      platformContextEyebrow: 'Platform context',
      contractScopeEyebrow: 'Contract scope',
      governanceEyebrow: 'Governance',
      demoReadinessEyebrow: 'Demo readiness',
      returnToSite: 'Back to the institutional site'
    }
  }
} as const;

export function getPublicSiteMessages(locale: PublicLocale) {
  return publicSiteMessages[locale];
}
