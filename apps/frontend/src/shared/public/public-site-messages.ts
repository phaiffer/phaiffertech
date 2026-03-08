import { PublicLocale } from './public-site-provider';

export const publicSiteMessages = {
  'pt-BR': {
    shell: {
      brandEyebrow: 'Phaiffer Platform',
      brandTitle: 'SaaS Control Plane',
      navPlatform: 'Plataforma',
      navModules: 'Módulos',
      navArchitecture: 'Arquitetura',
      navLogin: 'Entrar',
      navHome: 'Início',
      themeLight: 'Light',
      themeDark: 'Dark',
      localeLabel: 'Idioma',
      footerText:
        'PhaifferTech Platform · Institutional shell prepared for bilingual public experience.'
    },
    home: {
      heroEyebrow: 'Plataforma modular para operações reais',
      heroTitle: 'Software institucional e produto SaaS na mesma base.',
      heroDescription:
        'Uma experiência pública mais limpa para apresentação comercial, conectada a uma plataforma multi-tenant com CRM, IoT e PetFlow.',
      heroPrimaryCta: 'Acessar plataforma',
      heroSecondaryCta: 'Ver arquitetura',
      platformCardEyebrow: 'Multi-tenant',
      platformCardTitle: 'JWT + RBAC + Modules',
      platformCardText:
        'Camada pública conectada a uma plataforma operacional com isolamento por tenant, permissões e habilitação modular.',
      frontendCardEyebrow: 'Frontend',
      frontendCardTitle: 'Next.js App Router',
      backendCardEyebrow: 'Backend',
      backendCardTitle: 'Spring Boot + Multi-tenant',
      modulesTitle: 'Capacidades da plataforma',
      modulesDescription:
        'Apresente apenas o que faz sentido para cada cliente, sem poluição visual e com separação clara entre produto, operação e contexto comercial.',
      moduleCoreTitle: 'Core Platform',
      moduleCoreText:
        'Auth, tenants, IAM, settings, attachments, audit, subscription e governança central.',
      moduleCrmTitle: 'CRM',
      moduleCrmText:
        'Leads, deals, contacts, pipeline, tasks, notes e visão comercial operacional.',
      moduleIotTitle: 'IoT',
      moduleIotText:
        'Devices, telemetry, alarms, maintenance, reports e narrativa executiva para demo.',
      modulePetTitle: 'PetFlow',
      modulePetText:
        'Clientes, pets, agenda, medical workflow, inventory, invoices e operação clínica.',
      architectureEyebrow: 'Architecture',
      architectureTitle: 'Base preparada para evolução',
      architectureText:
        'Esta camada pública já fica pronta para evoluir com internacionalização completa, dark/light mode e integração visual com a plataforma autenticada.',
      ctaEyebrow: 'Pronto para apresentar',
      ctaTitle: 'Uma entrada institucional mais forte para vender melhor o produto.',
      ctaText:
        'Ajuste a narrativa pública da PhaifferTech antes de seguir com o refinamento dos módulos internos.',
      ctaPrimary: 'Acessar plataforma',
      ctaSecondary: 'Ir para login'
    },
    login: {
      eyebrow: 'Acesso à plataforma',
      title: 'Entre na PhaifferTech Platform',
      description:
        'Acesse a operação multi-tenant com permissões, módulos habilitados por contrato e visão executiva por contexto de negócio.',
      tenantCodeLabel: 'Tenant Code',
      emailLabel: 'E-mail',
      passwordLabel: 'Senha',
      submitLabel: 'Entrar',
      loadingLabel: 'Entrando...',
      helperTitle: 'Ambiente institucional + operação SaaS',
      helperText:
        'A área pública apresenta a proposta da plataforma. A área autenticada entrega a operação real com CRM, IoT e PetFlow conforme o escopo contratado.',
      contractTitle: 'Experiência orientada por contrato',
      contractText:
        'Cada cliente visualiza apenas os módulos e permissões compatíveis com o plano contratado.',
      governanceTitle: 'Governança central',
      governanceText:
        'Autenticação, tenants, IAM, settings e trilha operacional integrados na mesma base.',
      demoTitle: 'Narrativa pronta para demo',
      demoText:
        'A apresentação institucional e os dashboards operacionais seguem a mesma identidade visual.',
      errorFallback: 'Falha inesperada ao autenticar.',
      demoEmail: 'Demo e-mail',
      demoPassword: 'Demo password',
      platformContextEyebrow: 'Contexto da plataforma',
      contractScopeEyebrow: 'Escopo contratual',
      governanceEyebrow: 'Governança',
      demoReadinessEyebrow: 'Pronto para demo'
    }
  },
  'en-US': {
    shell: {
      brandEyebrow: 'Phaiffer Platform',
      brandTitle: 'SaaS Control Plane',
      navPlatform: 'Platform',
      navModules: 'Modules',
      navArchitecture: 'Architecture',
      navLogin: 'Login',
      navHome: 'Home',
      themeLight: 'Light',
      themeDark: 'Dark',
      localeLabel: 'Language',
      footerText:
        'PhaifferTech Platform · Institutional shell prepared for a bilingual public experience.'
    },
    home: {
      heroEyebrow: 'Modular platform for real operations',
      heroTitle: 'Institutional software and SaaS product in the same foundation.',
      heroDescription:
        'A cleaner public-facing experience for commercial presentations, connected to a multi-tenant platform with CRM, IoT and PetFlow.',
      heroPrimaryCta: 'Open platform',
      heroSecondaryCta: 'View architecture',
      platformCardEyebrow: 'Multi-tenant',
      platformCardTitle: 'JWT + RBAC + Modules',
      platformCardText:
        'Public layer connected to an operational platform with tenant isolation, permissions and modular enablement.',
      frontendCardEyebrow: 'Frontend',
      frontendCardTitle: 'Next.js App Router',
      backendCardEyebrow: 'Backend',
      backendCardTitle: 'Spring Boot + Multi-tenant',
      modulesTitle: 'Platform capabilities',
      modulesDescription:
        'Present only what matters to each customer, without visual noise and with clear separation between product, operations and commercial context.',
      moduleCoreTitle: 'Core Platform',
      moduleCoreText:
        'Auth, tenants, IAM, settings, attachments, audit, subscription and central governance.',
      moduleCrmTitle: 'CRM',
      moduleCrmText:
        'Leads, deals, contacts, pipeline, tasks, notes and operational commercial visibility.',
      moduleIotTitle: 'IoT',
      moduleIotText:
        'Devices, telemetry, alarms, maintenance, reports and executive demo storytelling.',
      modulePetTitle: 'PetFlow',
      modulePetText:
        'Clients, pets, scheduling, medical workflow, inventory, invoices and clinic operations.',
      architectureEyebrow: 'Architecture',
      architectureTitle: 'Foundation ready for evolution',
      architectureText:
        'This public layer is ready to evolve with full internationalization, dark/light mode and visual integration with the authenticated platform.',
      ctaEyebrow: 'Presentation ready',
      ctaTitle: 'A stronger institutional entry point to sell the product better.',
      ctaText:
        'Adjust the public narrative of PhaifferTech before continuing with the refinement of the internal modules.',
      ctaPrimary: 'Open platform',
      ctaSecondary: 'Go to login'
    },
    login: {
      eyebrow: 'Platform access',
      title: 'Sign in to PhaifferTech Platform',
      description:
        'Access a multi-tenant operation with permissions, contract-based modules and executive visibility by business context.',
      tenantCodeLabel: 'Tenant Code',
      emailLabel: 'Email',
      passwordLabel: 'Password',
      submitLabel: 'Sign in',
      loadingLabel: 'Signing in...',
      helperTitle: 'Institutional experience + SaaS operation',
      helperText:
        'The public area presents the platform narrative. The authenticated area delivers the real operation with CRM, IoT and PetFlow according to the contracted scope.',
      contractTitle: 'Contract-oriented experience',
      contractText:
        'Each customer only sees the modules and permissions that match the contracted plan.',
      governanceTitle: 'Central governance',
      governanceText:
        'Authentication, tenants, IAM, settings and operational traceability integrated in the same foundation.',
      demoTitle: 'Demo-ready narrative',
      demoText:
        'The institutional presentation and the operational dashboards follow the same visual identity.',
      errorFallback: 'Unexpected authentication failure.',
      demoEmail: 'Demo email',
      demoPassword: 'Demo password',
      platformContextEyebrow: 'Platform context',
      contractScopeEyebrow: 'Contract scope',
      governanceEyebrow: 'Governance',
      demoReadinessEyebrow: 'Demo readiness'
    }
  }
} as const;

export function getPublicSiteMessages(locale: PublicLocale) {
  return publicSiteMessages[locale];
}