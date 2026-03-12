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
      title: 'Acessar workspace',
      description: 'Entre com o tenant e suas credenciais para abrir a plataforma.',
      tenantCodeLabel: 'Empresa ou tenant',
      emailLabel: 'E-mail',
      passwordLabel: 'Senha',
      submitLabel: 'Entrar',
      loadingLabel: 'Entrando...',
      errorFallback: 'Falha inesperada ao autenticar.',
      forgotPasswordLabel: 'Esqueci minha senha',
      demoActionLabel: 'Usar demo'
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
      title: 'Access workspace',
      description: 'Sign in with your tenant and credentials to enter the platform.',
      tenantCodeLabel: 'Company or tenant',
      emailLabel: 'Email',
      passwordLabel: 'Password',
      submitLabel: 'Sign in',
      loadingLabel: 'Signing in...',
      errorFallback: 'Unexpected authentication failure.',
      forgotPasswordLabel: 'Forgot your password?',
      demoActionLabel: 'Use demo'
    }
  }
} as const;

export function getPublicSiteMessages(locale: PublicLocale) {
  return publicSiteMessages[locale];
}
