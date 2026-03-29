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
        eyebrow: 'PetFlow · recurring grooming · pet shop operations',
        title:
          'PetFlow for recurring grooming and pet shop operations.',
        description:
          'Keep appointments, monthly plans, professionals, stock alerts, and billing in one PetFlow workspace built for bath and grooming routines.',
        highlights: [
          'Recurring grooming plans',
          'Stock, billing, and commission',
          'Automated reminders and pickup messages'
        ],
        stats: [
          {
            value: 'Queue',
            label: 'Daily appointments with the assigned professional'
          },
          {
            value: 'Plans',
            label: 'Recurring clients, penultimate visits, and renewals'
          },
          {
            value: 'Billing',
            label: 'Pet taxi extras, stock alerts, and collection context'
          }
        ],
        primaryCta: { label: 'Request a demo', href: '/contact' },
        secondaryCta: { label: 'PetFlow access', href: '/login' }
      },
      signalTitle: 'A clearer operating system for pet businesses.',
      signalDescription:
        'PetFlow keeps reception, service execution, recurring plans, stock, and billing on the same workflow so a grooming operation can run without fragmented tools.',
      signals: [
        {
          value: 'Scheduling',
          label: 'Appointments & scheduling',
          description:
            'Clients, pets, bath and grooming services, professionals, and daily queue control in one place. No notebook, no spreadsheet.'
        },
        {
          value: 'Plans',
          label: 'Recurring plans & loyalty',
          description:
            'Separate recurring clients from one-time visits, track remaining sessions, and warn the team when the client is close to the final visits of the monthly plan.'
        },
        {
          value: 'Billing',
          label: 'Billing, extras, and stock alerts',
          description:
            'Manage products, low-stock alerts, pet taxi extras, and monthly billing with a cleaner operational view.'
        }
      ],
      productsTitle: 'One visible product. The full bath and grooming cycle.',
      productsDescription:
        'PetFlow is now the official visible product. It keeps reception, appointments, recurring plans, professionals, stock, and billing aligned for pet shops and grooming teams.',
      products: [
        {
          eyebrow: 'Reception and daily schedule',
          title: 'Service queue with responsible professional',
          description:
            'Book baths, grooming, and add-ons with the pet, client, and responsible professional visible in the same flow.',
          bullets: ['Daily schedule with professional assignment', 'Pet and client context on every visit', 'Operational queue ready for demo']
        },
        {
          eyebrow: 'Recurring clients and monthly plans',
          title: 'Plan control with session countdown',
          description:
            'Track active plans, sessions remaining, penultimate-visit alerts, and the difference between recurring and one-time customers.',
          bullets: ['Recurring versus one-time visibility', 'Penultimate-session alert', 'Automatic renewal notice logic']
        },
        {
          eyebrow: 'Billing, extras, and retail support',
          title: 'Next cycle billing with stock awareness',
          description:
            'Show projected charges, pet taxi extras, low-stock products, and service commissions without leaving the PetFlow workspace.',
          bullets: ['Inventory with reorder alerts', 'Billing with pet taxi and extras', 'Commission by professional']
        }
      ],
      expertiseTitle: 'Operational details that make the demo credible.',
      expertiseDescription:
        'PetFlow sells better when the story sounds like a real operation: reception rhythm, recurring plans, stock pressure, billing follow-through, and a solid technical base underneath.',
      expertise: [
        {
          eyebrow: 'Front desk and service queue',
          title: 'A clearer rhythm for appointments, pets, and responsible professionals',
          description:
            'The product keeps client, pet, service, professional, and daily schedule context tied together so the operation does not collapse into WhatsApp and spreadsheets.'
        },
        {
          eyebrow: 'Recurring plans',
          title: 'Monthly loyalty with penultimate-visit alerts',
          description:
            'Recurring versus one-time clients stay visible, remaining sessions stay readable, and the team can act before the plan ends.'
        },
        {
          eyebrow: 'Stock, extras, and commission',
          title: 'Operational billing without leaving the PetFlow flow',
          description:
            'Pet taxi add-ons, stock alerts, invoices, and professional commission remain part of the same commercial story instead of separate disconnected tools.'
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
        title: 'Run bath and grooming with more control.',
        description:
          'Show a clearer operation from the first demo: appointments, recurring plans, professionals, stock, and billing in one system.',
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
            'The platform stays behind the scenes while PetFlow carries the visible story for grooming, recurring plans, stock, and billing.'
        }
      ],
      modulesTitle: 'What is visible on this foundation now',
      modulesDescription:
        'The value of the platform is not showing every module at once. It is keeping PetFlow strong while the rest of the codebase remains preserved for later decisions.',
      modules: [
        {
          eyebrow: 'PetFlow · primary product',
          title: 'Operations for grooming, pet retail, and recurring service routines',
          description:
            'PetFlow connects appointments, monthly plans, professionals, stock alerts, billing, and customer follow-through — the current commercial focus of the platform.'
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
      title: 'PetFlow is the official product surface now.',
      description:
        'PhaifferTech now focuses its commercial execution on PetFlow — operational software for grooming, pet shops, and recurring service environments.',
      products: [
        {
          eyebrow: 'Bath and grooming operation',
          title: 'PetFlow',
          description:
            'Scheduling, monthly plans, inventory, professionals and billing in one system. Built for pet shops and grooming services.'
        },
        {
          eyebrow: 'Recurring revenue',
          title: 'Monthly plans and billing follow-through',
          description:
            'Separate recurring clients from one-time visits, track sessions left, warn at the penultimate visit, and prepare the next billing cycle.'
        },
        {
          eyebrow: 'Stock and service delivery',
          title: 'Retail support and team accountability',
          description:
            'Keep products above minimum stock, attach a professional to each procedure, and explain commission by appointment and by professional.'
        }
      ],
      fitTitle: 'Built for the way pet businesses actually work',
      fitDescription:
        'Whether you run a grooming salon, a pet shop, or a pet operation with monthly loyalty plans, PetFlow adapts to the daily routine without forcing generic workflows.',
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
          eyebrow: 'Hybrid operation',
          title: 'One system for services, care, products, and sales',
          description:
            'Combine services, products, care records, and billing in a single workspace for businesses that do more than one thing.'
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
      title: 'Interested in PetFlow? Let\'s talk.',
      description:
        'Get in touch to learn about the system, schedule a demo or understand how PetFlow fits your pet business.',
      lanesTitle: 'Where the conversation can start',
      lanesDescription:
        'Each lane reflects a credible entry point into the company narrative without pretending that every interaction is the same.',
      lanes: [
        {
          eyebrow: 'Commercial',
          title: 'PetFlow demo for grooming operations',
          description:
            'For conversations centered on bath and grooming flow, recurring plans, stock alerts, pet taxi extras, and billing.'
        },
        {
          eyebrow: 'Technical',
          title: 'Architecture and engineering alignment',
          description:
            'For discussions centered on software architecture, data engineering, modular integration and cloud/platform strategy.'
        },
        {
          eyebrow: 'Research',
          title: 'Applied studies and academic direction',
          description:
            'For technical studies, architecture notes, postgraduate continuity and future research collaboration.'
        }
      ],
      readinessTitle: 'What helps before the first interaction',
      readinessDescription:
        'The contact page is also a qualification layer: it helps frame the kind of information that makes the first conversation more productive.',
      readiness: [
        {
          eyebrow: 'Operational context',
          title: 'Clarify the environment and the pressure points',
          description:
            'What kind of operation is involved, what visibility is missing and which workflows are currently fragile.'
        },
        {
          eyebrow: 'Technical scope',
          title: 'Define whether the need is product, integration or architecture',
          description:
            'This helps distinguish between platform access, module evaluation and deeper engineering discussions.'
        },
        {
          eyebrow: 'Expected next step',
          title: 'Know whether the first step is discovery, validation or protected access',
          description:
            'Some conversations start with the live demo, others with rollout validation, and others with protected PetFlow access.'
        }
      ],
      cta: {
        eyebrow: 'Contact',
        title: 'Interested in PetFlow? Let\'s talk.',
        description:
          'Get in touch to learn about the system, schedule a demo or understand how PetFlow fits your pet business.',
        primaryCta: { label: 'Send a message', href: 'mailto:contato@phaiffertech.com.br' },
        secondaryCta: { label: 'PetFlow access', href: '/login' }
      }
    }
  },
  'pt-BR': {
    home: {
      hero: {
        eyebrow: 'Gestao Veterinaria Completa',
        title: 'O sistema que sua clinica merece',
        titleHighlight: 'clinica merece',
        description:
          'Prontuario eletronico, agendamentos, gestao de vacinas e controle financeiro. Tudo em uma plataforma moderna e intuitiva para clinicas veterinarias.',
        highlights: [
          'Teste gratis por 14 dias',
          'Setup em minutos'
        ],
        stats: [
          {
            value: 'Fila',
            label: 'Atendimentos do dia com profissional responsavel'
          },
          {
            value: 'Planos',
            label: 'Recorrentes, penultimo banho e renovacao'
          },
          {
            value: 'Cobranca',
            label: 'Extras, pet taxi e contexto financeiro do ciclo'
          }
        ],
        primaryCta: { label: 'Comecar agora', href: '/register' },
        secondaryCta: { label: 'Ver demonstracao', href: '/demo' }
      },
      signalTitle: 'Uma operacao mais clara para o seu pet business.',
      signalDescription:
        'O PetFlow conecta recepcao, execucao do servico, planos recorrentes, estoque e cobranca no mesmo fluxo para evitar operacao fragmentada.',
      signals: [
        {
          value: 'Agenda',
          label: 'Fila de servicos com cliente, pet e profissional',
          description:
            'Clientes, pets, banho, tosa e adicionais no mesmo fluxo. Sem caderno, sem planilha.'
        },
        {
          value: 'Planos',
          label: 'Recorrentes e avulsos sem confusao operacional',
          description:
            'Separe clientes de plano mensal dos avulsos, acompanhe sessoes restantes e receba aviso na penultima visita.'
        },
        {
          value: 'Cobranca',
          label: 'Estoque, extras e faturamento no mesmo ritmo da operacao',
          description:
            'Gerencie produtos, alertas de estoque minimo, pet taxi e cobranca mensal com mais clareza comercial.'
        }
      ],
      productsTitle: 'Tudo que voce precisa em um so lugar',
      productsDescription:
        'Gerencie toda sua clinica veterinaria com ferramentas profissionais e intuitivas.',
      products: [
        {
          eyebrow: 'Prontuario',
          title: 'Prontuario Digital',
          description:
            'Historico completo de cada paciente com anamnese, diagnosticos, prescricoes e anexos.',
          bullets: ['Historico medico completo', 'Anexo de exames e imagens', 'Prescricoes personalizadas'],
          href: '/recursos/prontuario'
        },
        {
          eyebrow: 'Agenda',
          title: 'Agendamentos',
          description:
            'Agenda inteligente com visualizacao por dia, semana ou mes. Envio automatico de lembretes.',
          bullets: ['Agenda visual e intuitiva', 'Lembretes automaticos por SMS/Email', 'Gestao de filas e encaixes'],
          href: '/recursos/agendamentos'
        },
        {
          eyebrow: 'Vacinas',
          title: 'Controle de Vacinas',
          description:
            'Carteira de vacinacao digital com alertas automaticos de reforcos e doses pendentes.',
          bullets: ['Carteira digital completa', 'Alertas de reforcos automaticos', 'Controle de estoque de vacinas'],
          href: '/recursos/vacinas'
        },
        {
          eyebrow: 'Tutores',
          title: 'Gestao de Tutores',
          description:
            'Cadastro completo de tutores com historico de todos os pets e comunicacao centralizada.',
          bullets: ['Perfil completo do tutor', 'Visualizacao de todos os pets', 'Historico de pagamentos'],
          href: '/recursos/tutores'
        },
        {
          eyebrow: 'Financeiro',
          title: 'Controle Financeiro',
          description:
            'Faturamento, fluxo de caixa e relatorios financeiros completos para sua clinica.',
          bullets: ['Controle de receitas e despesas', 'Relatorios financeiros detalhados', 'Gestao de contas a pagar/receber'],
          href: '/recursos/financeiro'
        },
        {
          eyebrow: 'Pacientes',
          title: 'Cadastro de Pacientes',
          description:
            'Ficha completa de cada pet com fotos, raca, idade, peso e informacoes medicas importantes.',
          bullets: ['Ficha completa do paciente', 'Fotos e identificacao visual', 'Alergias e restricoes medicas'],
          href: '/recursos/pacientes'
        }
      ],
      expertiseTitle: 'Detalhes operacionais que deixam a demo crivel.',
      expertiseDescription:
        'O PetFlow vende melhor quando a historia parece operacao real: recepcao, recorrencia, estoque, cobranca, mensagens automaticas e uma base tecnica firme por tras.',
      expertise: [
        {
          eyebrow: 'Recepcao e fila operacional',
          title: 'Uma rotina mais clara para agenda, pets e profissionais',
          description:
            'Cliente, pet, servico, profissional e horario ficam no mesmo fluxo para que a operacao nao dependa de caderno, WhatsApp e planilhas soltas.'
        },
        {
          eyebrow: 'Planos recorrentes',
          title: 'Mensalidade com alerta de penultimo banho',
          description:
            'Recorrentes versus avulsos ficam visiveis, sessoes restantes ficam legiveis e a equipe consegue agir antes do fim do plano.'
        },
        {
          eyebrow: 'Estoque, extras e comissao',
          title: 'Cobranca operacional sem sair do fluxo do PetFlow',
          description:
            'Pet taxi, adicionais, estoque baixo, invoices e comissao por profissional entram na mesma narrativa comercial.'
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
        title: 'Pronto para modernizar sua clinica?',
        description:
          'Comece seu teste gratuito hoje e veja como o PetFlow pode transformar sua gestao veterinaria.',
        primaryCta: { label: 'Comecar teste gratuito', href: '/register' },
        secondaryCta: { label: 'Falar com especialista', href: '/contact' }
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
            'A plataforma fica nos bastidores enquanto o PetFlow carrega a historia visivel de agenda, planos recorrentes, estoque e cobranca.'
        }
      ],
      modulesTitle: 'O que fica visivel nesta fundacao agora',
      modulesDescription:
        'O valor da plataforma nao esta em mostrar todos os modulos ao mesmo tempo. Esta em manter o PetFlow forte enquanto o restante da base fica preservado para decisoes futuras.',
      modules: [
        {
          eyebrow: 'PetFlow · produto principal',
          title: 'Operacao para banho e tosa, loja pet e recorrencia mensal',
          description:
            'O PetFlow conecta appointments, planos mensais, profissionais, alertas de estoque, cobranca e follow-up com clientes — foco comercial atual da plataforma.'
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
      title: 'PetFlow e a superficie oficial do produto agora.',
      description:
        'A PhaifferTech concentra sua execucao comercial no PetFlow — software operacional para banho e tosa, pet shops e servicos recorrentes.',
      products: [
        {
          eyebrow: 'Operacao de banho e tosa',
          title: 'PetFlow',
          description:
            'Agenda, planos mensais, estoque, profissionais e faturamento em um unico sistema. Feito para grooming e pet shop.'
        },
        {
          eyebrow: 'Receita recorrente',
          title: 'Planos mensais e cobranca do proximo ciclo',
          description:
            'Separe recorrentes de avulsos, acompanhe sessoes restantes, avise na penultima visita e prepare a cobranca do proximo mes.'
        },
        {
          eyebrow: 'Entrega do servico e apoio de loja',
          title: 'Estoque, extras e responsabilidade por profissional',
          description:
            'Mantenha produtos acima do minimo, associe profissional a cada procedimento e explique comissao por atendimento e por profissional.'
        }
      ],
      fitTitle: 'Feito para o jeito que negocios pet realmente funcionam',
      fitDescription:
        'Seja um salao de banho e tosa, um pet shop ou uma operacao com planos recorrentes, o PetFlow se adapta ao ritmo diario sem impor fluxo generico.',
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
          eyebrow: 'Operação híbrida',
          title: 'Um sistema para serviços, cuidados, produtos e vendas',
          description:
            'Combine serviços, produtos, prontuários e faturamento em um único workspace para negócios que fazem mais de uma coisa.'
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
      title: 'Interessado no PetFlow? Vamos conversar.',
      description:
        'Entre em contato para conhecer o sistema, agendar uma demonstração ou entender como o PetFlow se encaixa no seu pet business.',
      lanesTitle: 'Onde a conversa pode começar',
      lanesDescription:
        'Cada trilha reflete um ponto de entrada crível para a narrativa da empresa sem fingir que toda interação é igual.',
      lanes: [
        {
          eyebrow: 'Comercial',
          title: 'Demo PetFlow para banho e tosa',
          description:
            'Para conversas centradas em agenda, planos recorrentes, alertas de estoque, pet taxi e cobranca do banho e tosa.'
        },
        {
          eyebrow: 'Técnico',
          title: 'Alinhamento de arquitetura e engineering',
          description:
            'Para discussões centradas em software architecture, data engineering, integração modular e estratégia de cloud/platform.'
        },
        {
          eyebrow: 'Pesquisa',
          title: 'Estudos aplicados e direção acadêmica',
          description:
            'Para estudos técnicos, notas de arquitetura, continuidade de pós-graduação e futura colaboração em pesquisa.'
        }
      ],
      readinessTitle: 'O que ajuda antes da primeira interação',
      readinessDescription:
        'A página de contato também funciona como camada de qualificação: ela ajuda a enquadrar que tipo de informação torna a primeira conversa mais produtiva.',
      readiness: [
        {
          eyebrow: 'Contexto operacional',
          title: 'Esclareça o ambiente e os pontos de pressão',
          description:
            'Que tipo de operação está envolvida, que visibilidade falta hoje e quais workflows estão frágeis.'
        },
        {
          eyebrow: 'Escopo técnico',
          title: 'Defina se a necessidade é produto, integração ou arquitetura',
          description:
            'Isso ajuda a separar acesso à plataforma, avaliação de módulo e discussões mais profundas de engineering.'
        },
        {
          eyebrow: 'Próximo passo esperado',
          title: 'Saiba se o primeiro passo é descoberta, validação ou acesso protegido',
          description:
            'Algumas conversas comecam pela demo ao vivo, outras pela validacao do rollout e outras por acesso protegido ao PetFlow.'
        }
      ],
      cta: {
        eyebrow: 'Contato',
        title: 'Interessado no PetFlow? Vamos conversar.',
        description:
          'Entre em contato para conhecer o sistema, agendar uma demonstração ou entender como o PetFlow se encaixa no seu pet business.',
        primaryCta: { label: 'Enviar mensagem', href: 'mailto:contato@phaiffertech.com.br' },
        secondaryCta: { label: 'Acessar o PetFlow', href: '/login' }
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
