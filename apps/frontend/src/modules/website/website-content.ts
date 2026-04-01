import { PublicLocale } from '@/shared/public/public-site-provider';

export type WebsiteAction = {
  label: string;
  href: string;
};

export type WebsiteHeroStat = {
  value: string;
  label: string;
};

export type WebsiteStat = {
  value: string;
  label: string;
  description: string;
};

export type WebsiteCard = {
  eyebrow: string;
  title: string;
  description: string;
  bullets?: string[];
  footer?: string;
  href?: string;
  iconName?: string;
};

export type WebsiteArticleSection = {
  title: string;
  paragraphs: string[];
};

export type WebsiteArticle = {
  slug: string;
  category: string;
  readTime: string;
  title: string;
  description: string;
  highlight: string;
  sections: WebsiteArticleSection[];
  closing: string;
};

type WebsiteContent = {
  home: {
    hero: {
      eyebrow: string;
      title: string;
      titleHighlight?: string;
      description: string;
      highlights: string[];
      stats: WebsiteHeroStat[];
      primaryCta: WebsiteAction;
      secondaryCta: WebsiteAction;
    };
    signalTitle: string;
    signalDescription: string;
    signals: WebsiteStat[];
    productsTitle: string;
    productsDescription: string;
    products: WebsiteCard[];
    expertiseTitle: string;
    expertiseDescription: string;
    expertise: WebsiteCard[];
    architectureTitle: string;
    architectureDescription: string;
    architecture: WebsiteCard[];
    cta: {
      eyebrow: string;
      title: string;
      description: string;
      primaryCta: WebsiteAction;
      secondaryCta: WebsiteAction;
    };
  };
  about: {
    eyebrow: string;
    title: string;
    description: string;
    principlesTitle: string;
    principlesDescription: string;
    principles: WebsiteCard[];
    directionTitle: string;
    directionDescription: string;
    direction: WebsiteCard[];
    identityTitle: string;
    identityDescription: string;
    identity: WebsiteStat[];
  };
  platform: {
    eyebrow: string;
    title: string;
    description: string;
    foundationTitle: string;
    foundationDescription: string;
    foundation: WebsiteCard[];
    layersTitle: string;
    layersDescription: string;
    layers: WebsiteCard[];
    modulesTitle: string;
    modulesDescription: string;
    modules: WebsiteCard[];
  };
  products: {
    eyebrow: string;
    title: string;
    description: string;
    products: WebsiteCard[];
    fitTitle: string;
    fitDescription: string;
    fit: WebsiteCard[];
  };
  engineering: {
    eyebrow: string;
    title: string;
    description: string;
    expertiseTitle: string;
    expertiseDescription: string;
    expertise: WebsiteCard[];
    deliveryTitle: string;
    deliveryDescription: string;
    delivery: WebsiteCard[];
    principlesTitle: string;
    principlesDescription: string;
    principles: WebsiteStat[];
  };
  research: {
    eyebrow: string;
    title: string;
    description: string;
    tracksTitle: string;
    tracksDescription: string;
    tracks: WebsiteCard[];
    outputsTitle: string;
    outputsDescription: string;
    outputs: WebsiteCard[];
    bridgeTitle: string;
    bridgeDescription: string;
    bridge: WebsiteStat[];
  };
  articles: {
    eyebrow: string;
    title: string;
    description: string;
    featuredTitle: string;
    featuredDescription: string;
    items: WebsiteArticle[];
  };
  contact: {
    eyebrow: string;
    title: string;
    description: string;
    lanesTitle: string;
    lanesDescription: string;
    lanes: WebsiteCard[];
    readinessTitle: string;
    readinessDescription: string;
    readiness: WebsiteCard[];
    cta: {
      eyebrow: string;
      title: string;
      description: string;
      primaryCta: WebsiteAction;
      secondaryCta: WebsiteAction;
    };
  };
};

const websiteContent: Record<PublicLocale, WebsiteContent> = {
  'en-US': {
    home: {
      hero: {
        eyebrow: 'PetFlow · PetShop · grooming · veterinary clinic',
        title:
          'PetFlow for PetShop, grooming, veterinary clinic, and combined packages.',
        description:
          'Run PetShop, Banho e Tosa, veterinary clinic routines, and combined packages in one PetFlow workspace with scheduling, stock, care context, and billing connected.',
        highlights: [
          'PetShop, grooming, and clinic workflows in one place',
          'Combined packages and recurring service control',
          'Stock, billing, and professional accountability'
        ],
        stats: [
          {
            value: 'Operation',
            label: 'PetShop counter, grooming queue, and clinic schedule'
          },
          {
            value: 'Packages',
            label: 'Combined packages, recurring clients, and renewals'
          },
          {
            value: 'Billing',
            label: 'Products, services, clinical care, and extras in one flow'
          }
        ],
        primaryCta: { label: 'Request a demo', href: '/contact' },
        secondaryCta: { label: 'PetFlow access', href: '/login' }
      },
      signalTitle: 'A clearer operating system for real pet businesses.',
      signalDescription:
        'PetFlow keeps retail, service execution, clinical care, combined packages, stock, and billing on the same workflow so pet businesses do not need fragmented tools.',
      signals: [
        {
          value: 'Operation',
          label: 'Counter, schedule, and care flow',
          description:
            'Clients, pets, retail service, grooming services, clinical appointments, and professionals stay in one operating view. No notebook, no spreadsheet.'
        },
        {
          value: 'Packages',
          label: 'Recurring and combined packages',
          description:
            'Track recurring packages, combined offers, remaining sessions, and the right moment to renew hybrid service plans.'
        },
        {
          value: 'Billing',
          label: 'Billing, stock, and package follow-through',
          description:
            'Manage products, low-stock alerts, clinical and service charges, and package billing with a cleaner operational view.'
        }
      ],
      productsTitle: 'One system. Four commercial fronts for real pet operations.',
      productsDescription:
        'PetFlow presents PetShop, Banho e Tosa, veterinary clinic, and combined packages in one coherent commercial offer with one operating system behind it.',
      products: [
        {
          eyebrow: 'PetShop',
          title: 'Retail, stock, and counter operation',
          description:
            'Manage catalog, stock alerts, add-ons, and front-desk flow with the client and pet context visible in the same workspace.',
          bullets: ['Product catalog with stock visibility', 'Retail linked to client and pet history', 'Counter operation inside PetFlow']
        },
        {
          eyebrow: 'Banho e Tosa',
          title: 'Scheduling, queue, and professionals',
          description:
            'Book baths, grooming, and add-ons with the assigned professional, service queue, and pet context visible from start to finish.',
          bullets: ['Daily schedule with responsible professional', 'Pet and client context on every visit', 'Operational queue ready for demo']
        },
        {
          eyebrow: 'Veterinary clinic',
          title: 'Appointments, care records, and billing',
          description:
            'Keep consultations, care records, prescriptions, and billing in the same workspace used for the commercial and operational routine.',
          bullets: ['Clinical scheduling with pet history', 'Care context connected to the customer record', 'Billing inside the same system']
        },
        {
          eyebrow: 'Combined packages',
          title: 'One offer for hybrid pet businesses',
          description:
            'Sell combined packages that mix PetShop, grooming, and veterinary clinic services with unified follow-through and billing.',
          bullets: ['Combined packages for hybrid operations', 'Shared pet and customer history', 'One billing flow across products and services']
        }
      ],
      expertiseTitle: 'Operational details that make the demo credible.',
      expertiseDescription:
        'PetFlow sells better when the story sounds like a real operation: PetShop rhythm, Banho e Tosa execution, clinic routine, combined packages, billing follow-through, and a solid technical base underneath.',
      expertise: [
        {
          eyebrow: 'Counter, queue, and clinic schedule',
          title: 'A clearer rhythm for appointments, pets, products, and responsible professionals',
          description:
            'The product keeps client, pet, service, retail, professional, and daily schedule context tied together so the operation does not collapse into WhatsApp and spreadsheets.'
        },
        {
          eyebrow: 'Recurring and combined packages',
          title: 'Package control with remaining sessions and renewal visibility',
          description:
            'Recurring and hybrid packages stay visible, remaining sessions stay readable, and the team can act before the package ends.'
        },
        {
          eyebrow: 'Stock, services, and clinic billing',
          title: 'Operational billing without leaving the PetFlow flow',
          description:
            'Product sales, service add-ons, clinical charges, invoices, and professional commission remain part of the same commercial story instead of separate disconnected tools.'
        },
        {
          eyebrow: 'Technical foundation preserved',
          title: 'A product that looks polished without faking a second app',
          description:
            'The current architecture, permissions, and module foundations remain intact while the visible experience becomes more sellable and coherent.'
        }
      ],
      architectureTitle: 'A public narrative that stays readable for business and credible for technical peers',
      architectureDescription:
        'The platform can be explained at three levels: product value, engineering capability and research direction. That balance is what turns the public website into a positioning asset rather than a thin marketing shell.',
      architecture: [
        {
          eyebrow: 'Modular monolith',
          title: 'Strong boundaries without premature fragmentation',
          description:
            'Modules evolve independently inside a shared codebase while contracts and capabilities keep cross-module integration explicit.'
        },
        {
          eyebrow: 'Multi-tenant',
          title: 'Tenancy, permissions and enablement are platform-native',
          description:
            'Tenant isolation, module availability, feature flags and permission checks are part of the real implementation.'
        },
        {
          eyebrow: 'Institutional surface',
          title: 'Public, commercial and authenticated experiences are separated cleanly',
          description:
            'The website presents the company and the platform without leaking the internal shell or flattening the application architecture.'
        }
      ],
      cta: {
        eyebrow: 'PetFlow available now',
        title: 'Run PetShop, grooming, and clinic operations with more control.',
        description:
          'Show a clearer offer from the first conversation: PetShop, Banho e Tosa, veterinary clinic, and combined packages in one system.',
        primaryCta: { label: 'Get in touch', href: '/contact' },
        secondaryCta: { label: 'PetFlow access', href: '/login' }
      }
    },
    about: {
      eyebrow: 'About PhaifferTech',
      title: 'Software house specialised in management systems for the pet industry.',
      description:
        'PhaifferTech builds PetFlow — a management system for veterinary clinics, pet shops and grooming services — on a modular SaaS platform built from scratch with scalability and maintainability in mind.',
      principlesTitle: 'What we deliver in practice',
      principlesDescription:
        'PetFlow is a functional system, not a prototype. Every part of the product was built and tested for real use.',
      principles: [
        {
          eyebrow: 'Real product',
          title: 'A system in production, not just in planning',
          description:
            'Java 21 + Spring Boot backend, Next.js frontend, PostgreSQL database and GCP Cloud Run infrastructure — all running, with CI/CD and automated integration tests.'
        },
        {
          eyebrow: 'Customer focus',
          title: 'Built from real pet business problems',
          description:
            'Requirements were gathered directly from operators in the sector. Monthly plan control, pet taxi as a billable extra and penultimate session alerts came from real client conversations.'
        },
        {
          eyebrow: 'Solid architecture',
          title: 'Built to grow without rewriting',
          description:
            'Multi-tenant, modular and with clear domain separation — the system supports multiple clients and expansion into new segments without breaking what is already working.'
        },
        {
          eyebrow: 'Continuous delivery',
          title: 'CI/CD, tests and automated deployment from day one',
          description:
            'GitHub Actions, Testcontainers and GCP Cloud Run ensure every change is tested and delivered in a controlled way.'
        }
      ],
      directionTitle: 'Company direction',
      directionDescription:
        'PetFlow is the commercial focus today. The platform is ready for what comes next.',
      direction: [
        {
          eyebrow: 'Now',
          title: 'PetFlow — complete management for pet businesses',
          description:
            'Scheduling, monthly plans, inventory, professionals, billing and clinical records in a single system. Available for veterinary clinics, pet shops and grooming services.'
        },
        {
          eyebrow: 'In progress',
          title: 'Shared foundation and guided evolution',
          description:
            'Permissions, notifications, multi-tenancy and billing scaffolding remain ready behind the scenes while the visible product stays centered on PetFlow.'
        },
        {
          eyebrow: 'Future phase',
          title: 'Preserved module foundations',
          description:
            'Additional code paths stay protected internally for future extraction and later decisions, without expanding today\'s commercial surface.'
        }
      ],
      identityTitle: 'By the numbers',
      identityDescription:
        'What the project represents technically.',
      identity: [
        {
          value: 'V52',
          label: 'Flyway migrations',
          description:
            '52 incremental migrations since the start, with no schema rewrites.'
        },
        {
          value: '1',
          label: 'Official product surface',
          description:
            'PetFlow is the only product being promoted commercially right now.'
        },
        {
          value: 'GCP',
          label: 'Infrastructure',
          description:
            'Cloud Run, Cloud SQL, Secret Manager and Terraform from the first deploy.'
        }
      ]
    },
    platform: {
      eyebrow: 'Platform',
      title: 'The technical foundation behind PetFlow.',
      description:
        'PhaifferTech Platform is the shared core of authentication, multi-tenancy, permissions and modules that powers PetFlow today. The goal is to keep the visible product simple without discarding the technical base.',
      foundationTitle: 'Shared foundation',
      foundationDescription:
        'The platform already exposes cross-cutting concerns that matter in real SaaS operations and future integration work.',
      foundation: [
        {
          eyebrow: 'Governance',
          title: 'Auth, tenancy, IAM and permissions',
          description:
            'The platform enforces tenant isolation, access control and contract-based enablement as shared concerns rather than module-specific patches.'
        },
        {
          eyebrow: 'Platform services',
          title: 'Audit, attachments, notifications and settings',
          description:
            'Cross-cutting capabilities stay out of module business logic while remaining reusable across products.'
        },
        {
          eyebrow: 'Operational visibility',
          title: 'Capability-driven dashboards',
          description:
            'The dashboard layer aggregates module summaries through explicit capabilities instead of hidden module coupling.'
        }
      ],
      layersTitle: 'How the architecture is explained publicly',
      layersDescription:
        'The public site simplifies the platform architecture without flattening it into generic marketing language.',
      layers: [
        {
          eyebrow: 'Public layer',
          title: 'Institutional website and technical positioning',
          description:
            'The website explains products, architecture and research direction while keeping the authenticated application isolated.'
        },
        {
          eyebrow: 'Core and shared',
          title: 'Technical foundation without vertical business logic',
          description:
            'Auth, tenancy, IAM, module access, feature flags and reusable technical contracts stay out of PetFlow business rules.'
        },
        {
          eyebrow: 'Visible product',
          title: 'PetFlow owns the commercial story',
          description:
            'The platform stays behind the scenes while PetFlow carries the visible story for PetShop, grooming, veterinary clinic routines, combined packages, stock, and billing.'
        }
      ],
      modulesTitle: 'What is visible on this foundation now',
      modulesDescription:
        'The value of the platform is not showing every module at once. It is keeping PetFlow strong while the rest of the codebase remains preserved for later decisions.',
      modules: [
        {
          eyebrow: 'PetFlow · primary product',
          title: 'Operations for PetShop, grooming, veterinary clinic, and combined packages',
          description:
            'PetFlow connects appointments, combined packages, professionals, stock alerts, billing, and customer follow-through — the current commercial focus of the platform.'
        },
        {
          eyebrow: 'Shared foundation',
          title: 'Reusable services behind the visible product',
          description:
            'Permissions, tenant scope, audit, notifications, and dashboard contracts stay reusable without inflating the commercial surface.'
        }
      ]
    },
    products: {
      eyebrow: 'Products',
      title: 'PetFlow packages the real pet operation in one offer.',
      description:
        'PhaifferTech now focuses its commercial execution on PetFlow for PetShop, Banho e Tosa, veterinary clinic routines, and combined packages.',
      products: [
        {
          eyebrow: 'PetShop',
          title: 'Retail, stock, and counter routine',
          description:
            'Organize products, stock signals, counter activity, and customer context in the same workspace used by the rest of the operation.'
        },
        {
          eyebrow: 'Banho e Tosa',
          title: 'Scheduling, queue, and responsible professionals',
          description:
            'Keep baths, grooming services, assigned professionals, and service flow visible from booking to billing.'
        },
        {
          eyebrow: 'Veterinary clinic',
          title: 'Appointments, care history, and billing',
          description:
            'Run consultations, care records, prescriptions, and financial follow-through without splitting clinic work into another system.'
        },
        {
          eyebrow: 'Combined packages',
          title: 'One commercial offer for hybrid businesses',
          description:
            'Bundle PetShop, grooming, and clinic services with combined packages, recurring follow-through, and one billing story.'
        }
      ],
      fitTitle: 'Built for the way pet businesses actually work',
      fitDescription:
        'Whether you run PetShop, Banho e Tosa, veterinary clinic routines, or a hybrid operation with combined packages, PetFlow adapts to the daily routine without forcing generic workflows.',
      fit: [
        {
          eyebrow: 'Veterinary clinic',
          title: 'Appointments, care records, and billing in one place',
          description:
            'Manage patient scheduling, medical history, vaccinations, prescriptions, and invoice follow-through from a single workspace.'
        },
        {
          eyebrow: 'Grooming / banho e tosa',
          title: 'Service bookings, pet profiles, and payment tracking',
          description:
            'Set up your service menu, assign groomers, track each pet visit, and follow through on billing without switching between tools.'
        },
        {
          eyebrow: 'Pet shop',
          title: 'Product catalog, inventory, and retail operations',
          description:
            'Manage SKUs, pricing, stock levels, and reorder signals alongside client and appointment workflows — all in PetFlow.'
        },
        {
          eyebrow: 'Combined packages',
          title: 'One system for services, care, products, and sales',
          description:
            'Combine services, products, care records, and billing in a single workspace for businesses that sell more than one package.'
        }
      ]
    },
    engineering: {
      eyebrow: 'Engineering',
      title: 'Software built with architectural discipline from day one.',
      description:
        'Java 21, Spring Boot, Next.js, PostgreSQL, GCP and Terraform. Multi-tenant, modular and with automated integration tests — not as a future goal, but as a starting point.',
      expertiseTitle: 'Expertise areas',
      expertiseDescription:
        'These are the technical areas the public site needs to communicate clearly because they explain why the platform exists the way it does.',
      expertise: [
        {
          eyebrow: 'Data Engineering & Analytics',
          title: 'Operational data flows, analytical aggregations and integration posture',
          description:
            'Systems are designed with data lifecycles, observability, analytical continuity, and business insight in mind. PetFlow surfaces decision-support data directly from operations.'
        },
        {
          eyebrow: 'Cloud Architecture',
          title: 'Architecture choices that survive deployment reality',
          description:
            'Scalability, deployment constraints, governance and maintainability are considered early rather than retrofitted later.'
        },
        {
          eyebrow: 'Backend Engineering',
          title: 'Explicit domain services and modular contracts',
          description:
            'The backend architecture emphasizes DTOs, services, mappers, contracts and multi-tenant guardrails.'
        },
        {
          eyebrow: 'Platform Engineering',
          title: 'Shared capabilities that compound product value',
          description:
            'Feature flags, module access, dashboard capabilities and canonical references are treated as reusable platform building blocks.'
        }
      ],
      deliveryTitle: 'How the work is framed',
      deliveryDescription:
        'The engineering posture is intentionally practical: strong enough for public technical authority, still grounded in the current repository reality.',
      delivery: [
        {
          eyebrow: 'Architecture notes',
          title: 'Technical explanations tied to real implementation',
          description:
            'Public material can point to architecture decisions, integration patterns and tradeoffs already visible in the codebase.'
        },
        {
          eyebrow: 'Operational software',
          title: 'Products are framed as systems, not isolated screens',
          description:
            'PetFlow is explained through workflows, contracts and platform posture, without inflating the visible surface.'
        },
        {
          eyebrow: 'Progressive evolution',
          title: 'Incremental implementation over architectural theater',
          description:
            'The platform evolves in steps that preserve compatibility, tenancy, permissions and explicit module boundaries.'
        }
      ],
      principlesTitle: 'Engineering principles',
      principlesDescription:
        'The same principles that guide the repository should be legible in the public positioning of the brand.',
      principles: [
        {
          value: 'Explicit',
          label: 'Contracts over hidden coupling',
          description:
            'Cross-module integrations are made visible through capabilities and defined contracts.'
        },
        {
          value: 'Incremental',
          label: 'Evolution over reinvention',
          description:
            'Changes are implemented in safe phases instead of broad redesigns that create avoidable breakage.'
        },
        {
          value: 'Operational',
          label: 'Systems tied to real workflows',
          description:
            'Technical design is anchored in operational use, not in abstract architecture diagrams alone.'
        }
      ]
    },
    research: {
      eyebrow: 'Research',
      title: 'Applied technical research, anchored in a real product.',
      description:
        'The platform serves as a foundation for studies in data engineering, systems architecture and operations — with continuity for postgraduate work and future dissertation.',
      tracksTitle: 'Research tracks already visible in the platform direction',
      tracksDescription:
        'The current repository already exposes themes that can evolve into formal technical notes, postgraduate work and later research outputs.',
      tracks: [
        {
          eyebrow: 'Data Engineering',
          title: 'Operational data structures and system integration',
          description:
            'The platform naturally surfaces questions around canonical models, telemetry flows, cross-module references and analytical continuity.'
        },
        {
          eyebrow: 'Software Architecture',
          title: 'Modular monolith strategy and capability-based integration',
          description:
            'The repository already shows a controlled approach to modular boundaries, shared services and incremental integration.'
        },
        {
          eyebrow: 'Cloud and platform systems',
          title: 'Governance, deployment posture and reusable cross-cutting layers',
          description:
            'Auth, tenancy, IAM, auditing and modular enablement create a foundation for technical discussion beyond a single product.'
        },
        {
          eyebrow: 'Applied domain systems',
          title: 'Recurring pet operations as an applied system',
          description:
            'PetFlow already provides a concrete context for applied analysis in service execution, recurring billing, stock flow and customer follow-through.'
        }
      ],
      outputsTitle: 'What this page prepares the brand to publish',
      outputsDescription:
        'The goal is not to ship a full publishing stack today. It is to leave a credible surface for future outputs.',
      outputs: [
        {
          eyebrow: 'Technical studies',
          title: 'Architecture notes, integration studies and implementation rationale',
          description:
            'The public site can host long-form explanations that stay connected to the real platform.'
        },
        {
          eyebrow: 'Academic continuity',
          title: 'Postgraduate, TCC and dissertation-aligned visibility',
          description:
            'Research positioning becomes easier when the website already explains technical direction and evidence sources.'
        },
        {
          eyebrow: 'Applied insight',
          title: 'A bridge between codebase evolution and formal publication',
          description:
            'Public insights can later evolve into stronger research artifacts instead of starting from zero.'
        }
      ],
      bridgeTitle: 'Research connected to delivery',
      bridgeDescription:
        'The strongest positioning here is the bridge between practical systems and academic depth.',
      bridge: [
        {
          value: 'Codebase',
          label: 'Real implementation as evidence',
          description:
            'Architecture and product evolution already provide concrete material for study and reflection.'
        },
        {
          value: 'Products',
          label: 'Operational contexts for applied analysis',
          description:
            'PetFlow and the shared foundation create enough operational depth for applied analysis without inflating the visible story.'
        },
        {
          value: 'Future',
          label: 'Prepared for publication without overbuilding now',
          description:
            'The public website gains the structure needed for future articles, notes and academic outputs.'
        }
      ]
    },
    articles: {
      eyebrow: 'Insights',
      title: 'Technical notes, architecture decisions and platform vision.',
      description:
        'Posts about what was built, why it was built that way and what comes next.',
      featuredTitle: 'Featured directions',
      featuredDescription:
        'The initial article structure is static by design, but the routes and content shape are already ready for future MDX or content integration when that becomes worth the cost.',
      items: [
        {
          slug: 'building-modular-saas-for-operational-environments',
          category: 'Architecture',
          readTime: '8 min read',
          title: 'Building modular SaaS for operational environments',
          description:
            'Why modular discipline, explicit contracts and shared platform capabilities matter when products need to evolve without fragmentation.',
          highlight:
            'A serious operational platform is not only about adding modules. It is about defining what stays shared, what stays vertical and how integration remains explicit over time.',
          sections: [
            {
              title: 'Why operational products need stronger architectural boundaries',
              paragraphs: [
                'Operational software accumulates pressure quickly: new workflows, customer-specific expectations, data flows and integration points. Without clear boundaries, each new feature leaks complexity into the rest of the platform.',
                'PhaifferTech uses a modular monolith posture because it gives strong local boundaries, explicit contracts and lower coordination overhead while the platform still needs to evolve quickly.'
              ]
            },
            {
              title: 'Shared capabilities without shared business confusion',
              paragraphs: [
                'Tenancy, IAM, auditing, feature gating and module access are shared because they are platform concerns. PetFlow stays vertical because its business rules should not be diluted into generic infrastructure layers.',
                'This separation makes the codebase easier to explain publicly and easier to evolve internally.'
              ]
            },
            {
              title: 'Why this matters for future growth',
              paragraphs: [
                'A public engineering brand becomes more credible when the website can describe the architecture accurately instead of hiding behind startup clichés.',
                'The same design choice also keeps future integrations safer, because modules do not need to bypass boundaries to exchange context.'
              ]
            }
          ],
          closing:
            'The result is a platform that can host multiple product lines while preserving a technical story that customers, peers and evaluators can all understand.'
        },
        {
          slug: 'operational-data-for-recurring-pet-services',
          category: 'Data Engineering',
          readTime: '7 min read',
          title: 'Data thinking for recurring pet operations',
          description:
            'How grooming operations become more reliable when appointments, plans, stock and billing are treated as connected operational data.',
          highlight:
            'A grooming operation generates more than booked services. It produces service cadence, customer recurrence, stock pressure and billing events that should be treated as one operating system.',
          sections: [
            {
              title: 'From scheduled visits to operational data flow',
              paragraphs: [
                'Recurring pet operations become strategically stronger when appointments, plan sessions, pet taxi extras and pickup notifications are treated as connected operational flows rather than isolated screens.',
                'That framing influences how contracts are written, how billing previews are surfaced and how the commercial demo can be explained.'
              ]
            },
            {
              title: 'Why platform posture matters',
              paragraphs: [
                'The platform foundation matters because grooming use cases still pressure identity, module access, tenant separation, auditing and billing visibility at the same time.',
                'Having those concerns already built into the shared layers makes PetFlow easier to extend without rewriting its foundations.'
              ]
            },
            {
              title: 'Applied research value',
              paragraphs: [
                'Recurring service operations are fertile ground for future work in data engineering, platform design and operational analytics.',
                'That is one reason the public positioning of PhaifferTech should connect product delivery, operational clarity and research direction.'
              ]
            }
          ],
          closing:
            'The PetFlow story becomes stronger when it is explained as an operational data system for recurring pet services.'
        },
        {
          slug: 'shared-foundations-for-service-and-billing-operations',
          category: 'Products',
          readTime: '9 min read',
          title: 'Shared foundations for service and billing operations',
          description:
            'What PetFlow reveals about building service execution, recurring plans and billing follow-through on one architectural base.',
          highlight:
            'Reception, service execution, stock and billing look different on the surface, but they all benefit from explicit contracts, shared governance and progressive integration.',
          sections: [
            {
              title: 'Why service operations and billing should not be flattened',
              paragraphs: [
                'A transversal platform does not mean flattening every concern into a single abstract workflow. Front desk, service execution, recurring plans and invoicing need different language, different entities and different operational semantics.',
                'The platform value comes from shared governance and explicit integration points, not from pretending every operational step is the same.'
              ]
            },
            {
              title: 'Where shared foundation actually helps',
              paragraphs: [
                'Canonical references, tenancy, permissions, dashboards, notifications and authenticated shell concerns are the kind of capabilities that compound value across the same visible product surface.',
                'That makes it possible to expand PetFlow incrementally without violating ownership boundaries or inflating the commercial story.'
              ]
            },
            {
              title: 'Why this matters to product and research',
              paragraphs: [
                'The same integration choices that help product evolution also create a clean basis for architecture discussion and future academic analysis.',
                'That is why PhaifferTech needs its public brand to explain both the working product and the reasoning behind its foundation.'
              ]
            }
          ],
          closing:
            'The strongest portfolio story is not more visible modules. It is a disciplined foundation under one product that is ready to sell today.'
        }
      ]
    },
    contact: {
      eyebrow: 'Contact',
      title: 'Request a quote, hiring plan, or demo for PetFlow.',
      description:
        'Talk to PhaifferTech about PetShop, Banho e Tosa, veterinary clinic routines, or combined packages. Email willian.phaiffer@phaiffertech.com.br or call +55 41 9629-4533.',
      lanesTitle: 'What you can request here',
      lanesDescription:
        'The contact page supports the three commercial requests that matter right now for the real PetFlow offer.',
      lanes: [
        {
          eyebrow: 'Quotation',
          title: 'Request a quote for your operation',
          description:
            'Ask for pricing and scope for PetShop, Banho e Tosa, veterinary clinic routines, or combined packages.'
        },
        {
          eyebrow: 'Hiring',
          title: 'Plan the PetFlow hiring and rollout',
          description:
            'Use this lane when you want to understand onboarding, rollout timing, package mix, and how PetFlow lands in your business.'
        },
        {
          eyebrow: 'Demo',
          title: 'Book a guided commercial demonstration',
          description:
            'Schedule a guided demo focused on the operational flow that matters most for your PetShop, grooming, clinic, or hybrid routine.'
        }
      ],
      readinessTitle: 'Direct contact channels',
      readinessDescription:
        'Use the channel that fits your pace and include the operation type you want to cover so the first response lands faster.',
      readiness: [
        {
          eyebrow: 'Email',
          title: 'willian.phaiffer@phaiffertech.com.br',
          description:
            'Best for quotation requests, hiring conversations, and combined package discussions that need a written follow-up.'
        },
        {
          eyebrow: 'Phone',
          title: '+55 41 9629-4533',
          description:
            'Best for faster contact, commercial alignment, and demo scheduling with the PhaifferTech team.'
        },
        {
          eyebrow: 'Tell us your mix',
          title: 'Mention PetShop, Banho e Tosa, clinic, or combined packages',
          description:
            'That helps us prepare the right quotation, hiring path, or demo narrative before the first interaction.'
        }
      ],
      cta: {
        eyebrow: 'Contact',
        title: 'Contact PhaifferTech about the real PetFlow offer.',
        description:
          'Use email for quotation and hiring requests, or call to speed up demo scheduling and commercial follow-up.',
        primaryCta: { label: 'Send email', href: 'mailto:willian.phaiffer@phaiffertech.com.br' },
        secondaryCta: { label: 'Call now', href: 'tel:+554196294533' }
      }
    }
  },
  'pt-BR': {
    home: {
      hero: {
        eyebrow: 'PetFlow · PetShop · Banho e Tosa · Clinica Veterinaria',
        title: 'PetFlow para PetShop, Banho e Tosa, Clinica Veterinaria e pacotes combinados.',
        titleHighlight: 'PetShop',
        description:
          'Organize PetShop, Banho e Tosa, Clinica Veterinaria e pacotes combinados em um unico fluxo operacional com agenda, estoque, contexto clinico e cobranca conectados.',
        highlights: [
          'PetShop, grooming e clinica no mesmo workspace',
          'Pacotes combinados e recorrencia sem planilha paralela',
          'Estoque, cobranca e responsabilidade por profissional'
        ],
        stats: [
          {
            value: 'Operacao',
            label: 'Balcao do PetShop, fila do Banho e Tosa e agenda clinica'
          },
          {
            value: 'Pacotes',
            label: 'Pacotes combinados, recorrentes e renovacao'
          },
          {
            value: 'Cobranca',
            label: 'Produtos, servicos, clinica e extras no mesmo fluxo'
          }
        ],
        primaryCta: { label: 'Solicitar demo', href: '/contact' },
        secondaryCta: { label: 'Acesso PetFlow', href: '/login' }
      },
      signalTitle: 'Uma operacao mais clara para o pet business real.',
      signalDescription:
        'O PetFlow conecta varejo, execucao de servicos, rotina clinica, pacotes combinados, estoque e cobranca no mesmo fluxo para evitar operacao fragmentada.',
      signals: [
        {
          value: 'Operacao',
          label: 'Balcao, agenda e atendimento clinico no mesmo fluxo',
          description:
            'Clientes, pets, varejo, Banho e Tosa, atendimentos clinicos e profissionais no mesmo fluxo. Sem caderno, sem planilha.'
        },
        {
          value: 'Pacotes',
          label: 'Recorrentes e combinados sem confusao operacional',
          description:
            'Separe recorrentes, pacotes combinados e avulsos, acompanhe sessoes restantes e prepare a renovacao do jeito certo.'
        },
        {
          value: 'Cobranca',
          label: 'Estoque, servicos e faturamento no mesmo ritmo da operacao',
          description:
            'Gerencie produtos, alertas de estoque minimo, cobranca de servicos e contexto clinico com mais clareza comercial.'
        }
      ],
      productsTitle: 'Um sistema. Quatro frentes comerciais para a operacao pet real.',
      productsDescription:
        'O PetFlow apresenta PetShop, Banho e Tosa, Clinica Veterinaria e pacotes combinados na mesma oferta comercial e no mesmo sistema operacional.',
      products: [
        {
          eyebrow: 'PetShop',
          title: 'Varejo, estoque e operacao de balcao',
          description:
            'Organize catalogo, alertas de estoque, adicionais e atendimento de balcao com cliente e pet no mesmo workspace.',
          bullets: ['Catalogo de produtos com visibilidade de estoque', 'Varejo conectado ao historico do cliente e do pet', 'Operacao de balcao dentro do PetFlow']
        },
        {
          eyebrow: 'Banho e Tosa',
          title: 'Agenda, fila e profissionais responsaveis',
          description:
            'Visualize Banho e Tosa, adicionais e profissional responsavel no mesmo fluxo operacional, do agendamento ao fechamento.',
          bullets: ['Agenda do dia com responsavel visivel', 'Pet e cliente conectados em cada visita', 'Fila pronta para apresentacao comercial']
        },
        {
          eyebrow: 'Clinica Veterinaria',
          title: 'Atendimentos, prontuarios e faturamento',
          description:
            'Mantenha consultas, prontuarios, prescricoes e cobranca no mesmo workspace usado pela rotina comercial e operacional.',
          bullets: ['Agenda clinica com historico do pet', 'Contexto de cuidado conectado ao cadastro do cliente', 'Faturamento dentro do mesmo sistema']
        },
        {
          eyebrow: 'Pacotes combinados',
          title: 'Uma oferta unica para negocios pet hibridos',
          description:
            'Venda pacotes que combinam PetShop, Banho e Tosa e Clinica Veterinaria com follow-up e cobranca unificados.',
          bullets: ['Pacotes combinados para operacoes hibridas', 'Historico compartilhado de pet e cliente', 'Uma cobranca para produtos e servicos']
        }
      ],
      expertiseTitle: 'Detalhes operacionais que deixam a demo crivel.',
      expertiseDescription:
        'O PetFlow vende melhor quando a historia parece operacao real: ritmo de PetShop, execucao de Banho e Tosa, rotina clinica, pacotes combinados, cobranca e uma base tecnica firme por tras.',
      expertise: [
        {
          eyebrow: 'Balcao, fila e agenda clinica',
          title: 'Uma rotina mais clara para agenda, pets, produtos e profissionais',
          description:
            'Cliente, pet, servico, varejo, profissional e horario ficam no mesmo fluxo para que a operacao nao dependa de caderno, WhatsApp e planilhas soltas.'
        },
        {
          eyebrow: 'Recorrencia e pacotes combinados',
          title: 'Controle de pacotes com sessoes restantes e renovacao visivel',
          description:
            'Recorrentes, combinados e avulsos ficam visiveis, sessoes restantes ficam legiveis e a equipe consegue agir antes do fim do pacote.'
        },
        {
          eyebrow: 'Estoque, servicos e clinica',
          title: 'Cobranca operacional sem sair do fluxo do PetFlow',
          description:
            'Produtos, adicionais, cobranca clinica, invoices e comissao por profissional entram na mesma narrativa comercial.'
        },
        {
          eyebrow: 'Base tecnica preservada',
          title: 'Acabamento premium sem fingir uma segunda aplicacao',
          description:
            'Arquitetura, permissoes e fundacoes modulares continuam reais enquanto a experiencia visivel fica mais coerente e vendavel.'
        }
      ],
      architectureTitle: 'Uma narrativa pública legível para negócio e defensável para pares técnicos',
      architectureDescription:
        'A plataforma pode ser explicada em três níveis: valor de produto, capacidade de engenharia e direção de pesquisa. Esse equilíbrio transforma o site público em ativo de posicionamento e não em casca de marketing.',
      architecture: [
        {
          eyebrow: 'Modular monolith',
          title: 'Fronteiras fortes sem fragmentação prematura',
          description:
            'Os módulos evoluem independentemente dentro do mesmo codebase enquanto contracts e capabilities mantêm a integração explícita.'
        },
        {
          eyebrow: 'Multi-tenant',
          title: 'Tenancy, permissões e enablement são nativos da plataforma',
          description:
            'Isolamento por tenant, disponibilidade modular, feature flags e permission checks fazem parte da implementação real.'
        },
        {
          eyebrow: 'Superfície institucional',
          title: 'Experiências pública, comercial e autenticada separadas de forma limpa',
          description:
            'O website apresenta empresa e plataforma sem vazar o shell interno nem achatar a arquitetura da aplicação.'
        }
      ],
      cta: {
        eyebrow: 'PetFlow disponivel agora',
        title: 'Pronto para operar PetShop, Banho e Tosa e Clinica com mais controle?',
        description:
          'Mostre desde a primeira conversa uma oferta mais clara: PetShop, Banho e Tosa, Clinica Veterinaria e pacotes combinados no mesmo sistema.',
        primaryCta: { label: 'Solicitar demo', href: '/contact' },
        secondaryCta: { label: 'Acesso PetFlow', href: '/login' }
      }
    },
    about: {
      eyebrow: 'Sobre a PhaifferTech',
      title: 'Software house especializada em sistemas de gestão para o setor pet.',
      description:
        'A PhaifferTech desenvolve o PetFlow — sistema de gestão para clínicas veterinárias, pet shops e serviços de banho e tosa — sobre uma plataforma SaaS modular construída do zero com foco em escalabilidade e manutenibilidade.',
      principlesTitle: 'O que entregamos na prática',
      principlesDescription:
        'O PetFlow é um sistema funcional, não um protótipo. Cada parte do produto foi construída e testada para uso real.',
      principles: [
        {
          eyebrow: 'Produto real',
          title: 'Sistema em produção, não só em planejamento',
          description:
            'Backend Java 21 + Spring Boot, frontend Next.js, banco PostgreSQL e infraestrutura no GCP Cloud Run — tudo em funcionamento, com CI/CD e testes de integração automatizados.'
        },
        {
          eyebrow: 'Foco no cliente',
          title: 'Construído a partir de problemas reais de pet businesses',
          description:
            'Os requisitos foram levantados diretamente com operadores do setor. O controle de planos mensais, pet taxi como extra faturável e aviso de penúltima sessão vieram de conversas reais com clientes.'
        },
        {
          eyebrow: 'Arquitetura sólida',
          title: 'Preparado para crescer sem reescrever',
          description:
            'Multi-tenant, modular e com separação clara entre domínios — o sistema suporta múltiplos clientes e expansão para novos segmentos sem quebrar o que está funcionando.'
        },
        {
          eyebrow: 'Entrega contínua',
          title: 'CI/CD, testes e deploy automatizado desde o início',
          description:
            'GitHub Actions, Testcontainers e GCP Cloud Run garantem que cada mudança seja testada e entregue de forma controlada.'
        }
      ],
      directionTitle: 'Direção da empresa',
      directionDescription:
        'PetFlow é o foco comercial hoje. A plataforma está preparada para o que vem depois.',
      direction: [
        {
          eyebrow: 'Agora',
          title: 'PetFlow — gestão completa para pet businesses',
          description:
            'Agenda, planos mensais, estoque, profissionais, faturamento e prontuário clínico em um único sistema. Disponível para clínicas veterinárias, pet shops e serviços de banho e tosa.'
        },
        {
          eyebrow: 'Em evolução',
          title: 'Fundação compartilhada e evolução guiada',
          description:
            'Permissões, notificações, multi-tenancy e base de cobran��a continuam prontas nos bastidores enquanto o produto visível permanece centrado no PetFlow.'
        },
        {
          eyebrow: 'Fase futura',
          title: 'Fundações preservadas para etapas futuras',
          description:
            'Outros caminhos de código permanecem protegidos internamente para extração e decisões futuras, sem expandir a superfície comercial de agora.'
        }
      ],
      identityTitle: 'Em números',
      identityDescription:
        'O que o projeto representa tecnicamente.',
      identity: [
        {
          value: 'V52',
          label: 'Migrações Flyway',
          description:
            '52 migrações incrementais desde o início, sem reescrita de schema.'
        },
        {
          value: '1',
          label: 'Produto oficial visível',
          description:
            'PetFlow é o único produto promovido comercialmente neste momento.'
        },
        {
          value: 'GCP',
          label: 'Infraestrutura',
          description:
            'Cloud Run, Cloud SQL, Secret Manager e Terraform desde o primeiro deploy.'
        }
      ]
    },
    platform: {
      eyebrow: 'Plataforma',
      title: 'A fundacao tecnica por tras do PetFlow.',
      description:
        'A PhaifferTech Platform e o nucleo compartilhado de autenticacao, multi-tenancy, permissoes e modulos que sustenta o PetFlow hoje. A meta e manter o produto visivel simples sem descartar a base tecnica.',
      foundationTitle: 'Fundação compartilhada',
      foundationDescription:
        'A plataforma já expõe preocupações transversais que importam em SaaS real e em integração futura.',
      foundation: [
        {
          eyebrow: 'Governança',
          title: 'Auth, tenancy, IAM e permissions',
          description:
            'A plataforma trata isolamento por tenant, controle de acesso e enablement por contrato como concerns compartilhados e não como patches de módulo.'
        },
        {
          eyebrow: 'Serviços de plataforma',
          title: 'Audit, attachments, notifications e settings',
          description:
            'Capabilities transversais ficam fora da lógica de negócio dos módulos, mas permanecem reutilizáveis entre produtos.'
        },
        {
          eyebrow: 'Visibilidade operacional',
          title: 'Dashboards orientados por capabilities',
          description:
            'A camada de dashboard agrega resumos dos módulos via capabilities explícitas em vez de acoplamento oculto.'
        }
      ],
      layersTitle: 'Como a arquitetura é explicada publicamente',
      layersDescription:
        'O site simplifica a arquitetura da plataforma sem achatá-la em marketing genérico.',
      layers: [
        {
          eyebrow: 'Camada pública',
          title: 'Website institucional e posicionamento técnico',
          description:
            'O site explica produtos, arquitetura e direção de pesquisa mantendo a aplicação autenticada isolada.'
        },
        {
          eyebrow: 'Core e shared',
          title: 'Fundação técnica sem regra de negócio vertical',
          description:
            'Auth, tenancy, IAM, module access, feature flags e contratos tecnicos reutilizaveis ficam fora das regras do PetFlow.'
        },
        {
          eyebrow: 'Produto visivel',
          title: 'PetFlow conduz a historia comercial',
          description:
            'A plataforma fica nos bastidores enquanto o PetFlow carrega a historia visivel de PetShop, Banho e Tosa, Clinica Veterinaria, pacotes combinados, estoque e cobranca.'
        }
      ],
      modulesTitle: 'O que fica visivel nesta fundacao agora',
      modulesDescription:
        'O valor da plataforma nao esta em mostrar todos os modulos ao mesmo tempo. Esta em manter o PetFlow forte enquanto o restante da base fica preservado para decisoes futuras.',
      modules: [
        {
          eyebrow: 'PetFlow · produto principal',
          title: 'Operacao para PetShop, Banho e Tosa, Clinica Veterinaria e pacotes combinados',
          description:
            'O PetFlow conecta appointments, pacotes combinados, profissionais, alertas de estoque, cobranca e follow-up com clientes — foco comercial atual da plataforma.'
        },
        {
          eyebrow: 'Fundacao compartilhada',
          title: 'Servicos reutilizaveis por tras do produto visivel',
          description:
            'Permissoes, tenant scope, auditoria, notificacoes e contratos de dashboard continuam reutilizaveis sem inflar a superficie comercial.'
        }
      ]
    },
    products: {
      eyebrow: 'Produtos',
      title: 'PetFlow empacota a operacao pet real em uma unica oferta.',
      description:
        'A PhaifferTech concentra sua execucao comercial no PetFlow para PetShop, Banho e Tosa, Clinica Veterinaria e pacotes combinados.',
      products: [
        {
          eyebrow: 'PetShop',
          title: 'Varejo, estoque e rotina de balcao',
          description:
            'Organize produtos, sinais de estoque, atendimento de balcao e contexto do cliente no mesmo workspace usado pelo restante da operacao.'
        },
        {
          eyebrow: 'Banho e Tosa',
          title: 'Agenda, fila e profissionais responsaveis',
          description:
            'Mantenha Banho e Tosa, profissionais responsaveis e fluxo de servico visiveis do agendamento ao faturamento.'
        },
        {
          eyebrow: 'Clinica Veterinaria',
          title: 'Atendimentos, historico de cuidado e faturamento',
          description:
            'Execute consultas, prontuarios, prescricoes e follow-up financeiro sem jogar a rotina clinica para outro sistema.'
        },
        {
          eyebrow: 'Pacotes combinados',
          title: 'Uma oferta comercial para negocios pet hibridos',
          description:
            'Combine PetShop, Banho e Tosa e clinica em pacotes combinados com recorrencia, follow-up e cobranca na mesma narrativa.'
        }
      ],
      fitTitle: 'Feito para o jeito que negocios pet realmente funcionam',
      fitDescription:
        'Seja um PetShop, uma operacao de Banho e Tosa, uma Clinica Veterinaria ou um negocio com pacotes combinados, o PetFlow se adapta ao ritmo diario sem impor fluxo generico.',
      fit: [
        {
          eyebrow: 'Clínica veterinária',
          title: 'Agendamentos, prontuários e faturamento em um só lugar',
          description:
            'Gerencie agenda, histórico médico, vacinas, prescrições e cobrança a partir de um único workspace.'
        },
        {
          eyebrow: 'Banho e tosa / grooming',
          title: 'Agendamento de serviços, perfil do pet e controle financeiro',
          description:
            'Configure o menu de serviços, atribua profissionais, acompanhe cada visita e feche a cobrança sem trocar de ferramenta.'
        },
        {
          eyebrow: 'Pet shop',
          title: 'Catálogo de produtos, estoque e operação de varejo',
          description:
            'Gerencie SKUs, preços, níveis de estoque e pontos de reposição integrados aos fluxos de clientes e atendimentos.'
        },
        {
          eyebrow: 'Pacotes combinados',
          title: 'Um sistema para serviços, cuidados, produtos e vendas',
          description:
            'Combine serviços, produtos, prontuários e faturamento em um único workspace para negócios que vendem mais de um pacote.'
        }
      ]
    },
    engineering: {
      eyebrow: 'Engineering',
      title: 'Software construído com disciplina arquitetural desde o primeiro dia.',
      description:
        'Java 21, Spring Boot, Next.js, PostgreSQL, GCP e Terraform. Multi-tenant, modular e com testes de integração automatizados — não como meta futura, mas como ponto de partida.',
      expertiseTitle: 'Áreas de especialidade',
      expertiseDescription:
        'Estas são as áreas técnicas que o site precisa comunicar claramente porque explicam por que a plataforma existe do jeito que existe.',
      expertise: [
        {
          eyebrow: 'Data Engineering & Analytics',
          title: 'Fluxos operacionais de dados, análise e postura de integração',
          description:
            'Os sistemas são pensados com ciclos de vida de dados, observabilidade, continuidade analítica e suporte à decisão. O PetFlow expõe insights de negócio diretamente da operação.'
        },
        {
          eyebrow: 'Cloud Architecture',
          title: 'Escolhas de arquitetura que sobrevivem à realidade de deploy',
          description:
            'Escalabilidade, restrições de deployment, governança e mantenabilidade entram cedo em vez de aparecer como remendo.'
        },
        {
          eyebrow: 'Backend Engineering',
          title: 'Serviços de domínio explícitos e contratos modulares',
          description:
            'A arquitetura backend enfatiza DTOs, services, mappers, contracts e guardrails multi-tenant.'
        },
        {
          eyebrow: 'Platform Engineering',
          title: 'Capabilities compartilhadas que acumulam valor de produto',
          description:
            'Feature flags, module access, dashboard capabilities e referências canônicas são tratados como blocos reutilizáveis de plataforma.'
        }
      ],
      deliveryTitle: 'Como o trabalho é enquadrado',
      deliveryDescription:
        'A postura de engenharia é intencionalmente pragmática: forte o suficiente para autoridade pública, mas ainda ancorada na realidade do repositório atual.',
      delivery: [
        {
          eyebrow: 'Notas de arquitetura',
          title: 'Explicações técnicas ligadas à implementação real',
          description:
            'O material público pode apontar para decisões de arquitetura, padrões de integração e trade-offs já visíveis no codebase.'
        },
        {
          eyebrow: 'Software operacional',
          title: 'Produtos apresentados como sistemas, não como telas isoladas',
          description:
            'O PetFlow é explicado por fluxos, contratos e postura de plataforma, sem inflar a superfície visível.'
        },
        {
          eyebrow: 'Evolução progressiva',
          title: 'Incremento seguro no lugar de teatro arquitetural',
          description:
            'A plataforma evolui em etapas que preservam compatibilidade, tenancy, permissions e fronteiras explícitas.'
        }
      ],
      principlesTitle: 'Princípios de engineering',
      principlesDescription:
        'Os mesmos princípios que guiam o repositório devem ficar legíveis no posicionamento público da marca.',
      principles: [
        {
          value: 'Explícito',
          label: 'Contracts acima de acoplamento escondido',
          description:
            'Integrações cross-module ficam visíveis por meio de capabilities e contratos definidos.'
        },
        {
          value: 'Incremental',
          label: 'Evolução acima de reinvenção',
          description:
            'Mudanças são implementadas em fases seguras em vez de redesigns amplos e frágeis.'
        },
        {
          value: 'Operacional',
          label: 'Sistemas ligados a workflows reais',
          description:
            'O design técnico é ancorado em uso operacional e não apenas em diagramas abstratos.'
        }
      ]
    },
    research: {
      eyebrow: 'Pesquisa',
      title: 'Investigação técnica aplicada, ancorada em produto real.',
      description:
        'A plataforma serve como base para estudos em data engineering, arquitetura de sistemas e operações — com continuidade para pós-graduação e futura dissertação.',
      tracksTitle: 'Trilhas de pesquisa já visíveis na direção da plataforma',
      tracksDescription:
        'O repositório atual já expõe temas que podem evoluir para notas técnicas formais, pós-graduação e futuros outputs de pesquisa.',
      tracks: [
        {
          eyebrow: 'Data Engineering',
          title: 'Estruturas operacionais de dados e integração entre sistemas',
          description:
            'A plataforma naturalmente levanta questões sobre modelos canônicos, fluxos de telemetria, referências cross-module e continuidade analítica.'
        },
        {
          eyebrow: 'Software Architecture',
          title: 'Estratégia de modular monolith e integração por capabilities',
          description:
            'O repositório já mostra uma abordagem controlada para fronteiras modulares, serviços compartilhados e integração incremental.'
        },
        {
          eyebrow: 'Cloud e platform systems',
          title: 'Governança, postura de deployment e camadas reutilizáveis',
          description:
            'Auth, tenancy, IAM, auditing e modular enablement criam base para discussão técnica além de um único produto.'
        },
        {
          eyebrow: 'Sistemas aplicados',
          title: 'Operação pet recorrente como sistema aplicado',
          description:
            'O PetFlow já fornece um contexto concreto para análise aplicada em execução de serviços, cobrança recorrente, estoque e follow-up com clientes.'
        }
      ],
      outputsTitle: 'O que esta página prepara a marca para publicar',
      outputsDescription:
        'O objetivo não é entregar uma stack completa de publicação agora. É deixar uma superfície crível para outputs futuros.',
      outputs: [
        {
          eyebrow: 'Estudos técnicos',
          title: 'Notas de arquitetura, estudos de integração e racional de implementação',
          description:
            'O site público pode hospedar explicações de longo formato conectadas à plataforma real.'
        },
        {
          eyebrow: 'Continuidade acadêmica',
          title: 'Visibilidade alinhada à pós-graduação, TCC e dissertação',
          description:
            'O posicionamento de pesquisa fica mais forte quando o site já explica direção técnica e fontes de evidência.'
        },
        {
          eyebrow: 'Insight aplicado',
          title: 'Uma ponte entre evolução do codebase e publicação formal',
          description:
            'Insights públicos podem evoluir depois para artefatos de pesquisa mais fortes em vez de começarem do zero.'
        }
      ],
      bridgeTitle: 'Pesquisa conectada à entrega',
      bridgeDescription:
        'O posicionamento mais forte aqui é a ponte entre sistemas práticos e profundidade acadêmica.',
      bridge: [
        {
          value: 'Codebase',
          label: 'Implementação real como evidência',
          description:
            'Arquitetura e evolução de produto já fornecem material concreto para estudo e reflexão.'
        },
        {
          value: 'Produtos',
          label: 'Contextos operacionais para análise aplicada',
          description:
            'O PetFlow e a fundação compartilhada criam profundidade operacional suficiente para análise aplicada sem inflar a narrativa visível.'
        },
        {
          value: 'Futuro',
          label: 'Preparado para publicação sem overbuild agora',
          description:
            'O site ganha a estrutura necessária para artigos, notas e outputs acadêmicos futuros.'
        }
      ]
    },
    articles: {
      eyebrow: 'Insights',
      title: 'Notas técnicas, decisões de arquitetura e visão de plataforma.',
      description:
        'Publicações sobre o que foi construído, por que foi construído assim e o que vem a seguir.',
      featuredTitle: 'Direções iniciais',
      featuredDescription:
        'A estrutura inicial de artigos é estática por escolha, mas as rotas e o formato já estão prontos para futura integração com MDX ou content layer quando isso fizer sentido.',
      items: [
        {
          slug: 'building-modular-saas-for-operational-environments',
          category: 'Architecture',
          readTime: '8 min read',
          title: 'Building modular SaaS for operational environments',
          description:
            'Por que disciplina modular, contratos explícitos e capabilities compartilhadas importam quando os produtos precisam evoluir sem fragmentação.',
          highlight:
            'Uma plataforma operacional séria não depende apenas de adicionar módulos. Ela depende de definir o que continua compartilhado, o que continua vertical e como a integração permanece explícita ao longo do tempo.',
          sections: [
            {
              title: 'Por que produtos operacionais exigem fronteiras mais fortes',
              paragraphs: [
                'Software operacional acumula pressão rapidamente: novos workflows, expectativas específicas, fluxos de dados e pontos de integração. Sem fronteiras claras, cada feature nova vaza complexidade para o resto da plataforma.',
                'A PhaifferTech usa postura de modular monolith porque isso entrega fronteiras locais fortes, contratos explícitos e menor overhead de coordenação enquanto a plataforma ainda precisa evoluir rápido.'
              ]
            },
            {
              title: 'Capabilities compartilhadas sem confusão de negócio compartilhada',
              paragraphs: [
                'Tenancy, IAM, auditing, feature gating e module access são compartilhados porque são concerns de plataforma. O PetFlow continua vertical porque suas regras de negócio não devem ser diluídas em camadas genéricas.',
                'Essa separação torna o codebase mais fácil de explicar publicamente e mais fácil de evoluir internamente.'
              ]
            },
            {
              title: 'Por que isso importa para o crescimento futuro',
              paragraphs: [
                'Uma marca pública de engenharia se torna mais crível quando o site consegue descrever a arquitetura de forma fiel em vez de esconder tudo atrás de clichês de startup.',
                'A mesma escolha também torna integrações futuras mais seguras, porque os módulos não precisam atravessar fronteiras de forma ad hoc para trocar contexto.'
              ]
            }
          ],
          closing:
            'O resultado é uma plataforma capaz de hospedar várias linhas de produto enquanto preserva uma história técnica compreensível para clientes, pares e avaliadores.'
        },
        {
          slug: 'operational-data-for-recurring-pet-services',
          category: 'Data Engineering',
          readTime: '7 min read',
          title: 'Data thinking para operacao pet recorrente',
          description:
            'Como operacoes de banho e tosa ficam mais confiaveis quando agenda, planos, estoque e cobranca sao tratados como dados operacionais conectados.',
          highlight:
            'Uma operacao de banho e tosa gera mais do que servicos agendados. Ela produz cadencia de atendimento, recorrencia, pressao de estoque e eventos de cobranca que devem ser tratados como um so sistema operacional.',
          sections: [
            {
              title: 'De visitas agendadas a fluxo operacional de dados',
              paragraphs: [
                'Uma operacao pet recorrente fica estrategicamente mais forte quando appointments, sessoes de plano, extras de pet taxi e avisos de retirada sao tratados como fluxos conectados em vez de telas isoladas.',
                'Esse enquadramento influencia como contratos sao escritos, como previews de cobranca aparecem e como a demo comercial pode ser explicada.'
              ]
            },
            {
              title: 'Por que a postura de plataforma importa',
              paragraphs: [
                'A fundacao de plataforma importa porque casos de uso de banho e tosa ainda pressionam identity, module access, separacao por tenant, auditing e visibilidade de cobranca ao mesmo tempo.',
                'Ter essas concerns ja construidas nas camadas compartilhadas torna o PetFlow mais facil de expandir sem reescrever sua base.'
              ]
            },
            {
              title: 'Valor para pesquisa aplicada',
              paragraphs: [
                'Operacoes recorrentes de servico sao terreno fertil para trabalho futuro em data engineering, platform design e analytics operacional.',
                'Essa e uma das razoes pelas quais o posicionamento publico da PhaifferTech deve conectar entrega de produto, clareza operacional e direcao de pesquisa.'
              ]
            }
          ],
          closing:
            'A narrativa do PetFlow fica mais forte quando e explicada como sistema operacional de dados para servicos pet recorrentes.'
        },
        {
          slug: 'shared-foundations-for-service-and-billing-operations',
          category: 'Products',
          readTime: '9 min read',
          title: 'Shared foundations for service and billing operations',
          description:
            'O que o PetFlow revela sobre construir execucao de servicos, planos recorrentes e cobranca sobre a mesma base arquitetural.',
          highlight:
            'Recepcao, execucao de servico, estoque e cobranca parecem diferentes na superficie, mas todos se beneficiam de contratos explicitos, governanca compartilhada e integracao progressiva.',
          sections: [
            {
              title: 'Por que operacao de servico e cobranca nao devem ser achatadas',
              paragraphs: [
                'Uma plataforma transversal nao significa achatar todas as preocupacoes num unico workflow abstrato. Recepcao, execucao do servico, planos recorrentes e faturamento precisam de linguagem, entidades e semantica operacional diferentes.',
                'O valor da plataforma vem da governanca compartilhada e dos pontos de integracao explicitos, e nao de fingir que cada etapa operacional e igual.'
              ]
            },
            {
              title: 'Onde a fundação compartilhada realmente ajuda',
              paragraphs: [
                'Referencias canonicas, tenancy, permissions, dashboards, notificacoes e concerns do shell autenticado sao o tipo de capability que acumula valor dentro da mesma superficie visivel.',
                'Isso permite expandir o PetFlow de forma incremental sem violar ownership nem inflar a historia comercial.'
              ]
            },
            {
              title: 'Por que isso importa para produto e pesquisa',
              paragraphs: [
                'As mesmas escolhas de integracao que ajudam a evolucao do produto tambem criam uma base limpa para discussao arquitetural e analise academica futura.',
                'E por isso que a marca publica da PhaifferTech precisa explicar tanto o produto em funcionamento quanto o raciocinio por tras da fundacao.'
              ]
            }
          ],
          closing:
            'A historia mais forte do portfolio nao e ter mais modulos visiveis. E ter uma fundacao disciplinada sustentando um produto que ja pode ser vendido agora.'
        }
      ]
    },
    contact: {
      eyebrow: 'Contato',
      title: 'Solicite cotacao, contratacao ou demo do PetFlow.',
      description:
        'Fale com a PhaifferTech sobre PetShop, Banho e Tosa, Clinica Veterinaria ou pacotes combinados. Escreva para willian.phaiffer@phaiffertech.com.br ou ligue para +55 41 9629-4533.',
      lanesTitle: 'O que voce pode solicitar aqui',
      lanesDescription:
        'A pagina de contato cobre os tres pedidos comerciais que importam agora para a oferta real do PetFlow.',
      lanes: [
        {
          eyebrow: 'Cotacao',
          title: 'Solicite uma proposta para a sua operacao',
          description:
            'Peça precificacao e escopo para PetShop, Banho e Tosa, Clinica Veterinaria ou pacotes combinados.'
        },
        {
          eyebrow: 'Contratacao',
          title: 'Planeje a entrada do PetFlow no negocio',
          description:
            'Use esta trilha para entender onboarding, prazo de rollout, combinacao de pacotes e como o PetFlow entra na sua operacao.'
        },
        {
          eyebrow: 'Demo',
          title: 'Agende uma demonstracao comercial guiada',
          description:
            'Marque uma demo guiada focada no fluxo operacional que mais importa para o seu PetShop, Banho e Tosa, clinica ou rotina hibrida.'
        }
      ],
      readinessTitle: 'Canais diretos de contato',
      readinessDescription:
        'Use o canal que combina com o seu ritmo e informe qual tipo de operacao deseja cobrir para acelerar a primeira resposta.',
      readiness: [
        {
          eyebrow: 'E-mail',
          title: 'willian.phaiffer@phaiffertech.com.br',
          description:
            'Melhor canal para cotacoes, conversas de contratacao e pedidos de pacotes combinados que pedem retorno por escrito.'
        },
        {
          eyebrow: 'Telefone',
          title: '+55 41 9629-4533',
          description:
            'Melhor canal para contato mais rapido, alinhamento comercial e agendamento de demonstracao com a equipe da PhaifferTech.'
        },
        {
          eyebrow: 'Informe sua mistura',
          title: 'Mencione PetShop, Banho e Tosa, clinica ou pacotes combinados',
          description:
            'Isso ajuda a preparar a cotacao, a contratacao ou a narrativa da demo antes da primeira interacao.'
        }
      ],
      cta: {
        eyebrow: 'Contato',
        title: 'Fale com a PhaifferTech sobre a oferta real do PetFlow.',
        description:
          'Use o e-mail para cotacao e contratacao, ou ligue para acelerar o agendamento de demo e o follow-up comercial.',
        primaryCta: { label: 'Enviar e-mail', href: 'mailto:willian.phaiffer@phaiffertech.com.br' },
        secondaryCta: { label: 'Ligar agora', href: 'tel:+554196294533' }
      }
    }
  }
};

export function getWebsiteContent(locale: PublicLocale) {
  return websiteContent[locale];
}

export function getWebsiteArticleSlugs() {
  return websiteContent['en-US'].articles.items.map((article) => article.slug);
}

export function hasWebsiteArticleSlug(slug: string) {
  return getWebsiteArticleSlugs().includes(slug);
}

export function getWebsiteArticle(locale: PublicLocale, slug: string) {
  return websiteContent[locale].articles.items.find((article) => article.slug === slug) ?? null;
}
