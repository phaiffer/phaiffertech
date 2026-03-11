import { PublicLocale } from '@/shared/public/public-site-provider';

export type WebsiteAction = {
  label: string;
  href: string;
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
      description: string;
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
        eyebrow: 'Data engineering · cloud architecture · operational platforms',
        title:
          'PhaifferTech builds modular software platforms for operational environments, technical authority and applied research.',
        description:
          'The company combines product execution, platform engineering and research-oriented thinking to design scalable SaaS foundations, industrial and clinical operational systems, and data-intensive architectures without losing architectural discipline.',
        primaryCta: { label: 'Explore the platform', href: '/platform' },
        secondaryCta: { label: 'See engineering direction', href: '/engineering' }
      },
      signalTitle: 'A platform narrative that matches the real codebase',
      signalDescription:
        'The public layer now reflects the actual maturity of the repository: modular products, explicit architecture boundaries and a serious engineering direction.',
      signals: [
        {
          value: '3',
          label: 'Products on one foundation',
          description:
            'CRM, IoT System and PetFlow share cross-cutting capabilities instead of isolated stacks.'
        },
        {
          value: 'Data',
          label: 'Engineering-first positioning',
          description:
            'Operational systems are treated as data-producing, integration-ready and architecture-driven assets.'
        },
        {
          value: 'Applied',
          label: 'Research anchored in delivery',
          description:
            'The platform supports commercial product work, postgraduate studies and future research continuity.'
        }
      ],
      productsTitle: 'Products with different operational scopes, one shared platform',
      productsDescription:
        'PhaifferTech is not presenting disconnected experiments. Each product line extends the same platform posture: shared governance, modular enablement and explicit architectural boundaries.',
      products: [
        {
          eyebrow: 'Commercial control',
          title: 'CRM / Operational Hub',
          description:
            'Commercial structure, operational coordination and future cross-module follow-up on a shared CRM core.',
          bullets: ['Companies, contacts, leads and deals', 'Tasks, notes and activity', 'Prepared for canonical references across products']
        },
        {
          eyebrow: 'Clinical operations',
          title: 'PetFlow',
          description:
            'Scheduling, care continuity, inventory and clinical workflow for veterinary and pet-service operations.',
          bullets: ['Appointments connected to medical workflow', 'Clinical timeline by pet and appointment', 'Operational contracts already aligned front to back']
        },
        {
          eyebrow: 'Industrial / field operations',
          title: 'IoT System',
          description:
            'Telemetry, device management, alarms, dashboards and operational storytelling for industrial and infrastructure contexts.',
          bullets: ['Device, telemetry and reporting modules', 'Capability-based executive dashboard', 'Validation scripts and demo-ready operational flow']
        }
      ],
      expertiseTitle: 'Authority built on engineering depth, not on generic buzzwords',
      expertiseDescription:
        'The site positions PhaifferTech as a technical brand for software architecture, data engineering and cloud systems that can support real operational products.',
      expertise: [
        {
          eyebrow: 'Data Engineering',
          title: 'Operational data flows and reusable platform primitives',
          description:
            'Data structures, ingestion thinking, tenancy concerns and modular contracts are treated as first-class design constraints.'
        },
        {
          eyebrow: 'Cloud Architecture',
          title: 'Infrastructure thinking without losing product clarity',
          description:
            'Cloud posture is connected to maintainability, deployment realism, observability and modular boundaries.'
        },
        {
          eyebrow: 'Platform Engineering',
          title: 'Shared capabilities that compound across products',
          description:
            'IAM, feature flags, module access, dashboards and canonical references reduce fragmentation and future integration risk.'
        },
        {
          eyebrow: 'Applied Research',
          title: 'Technical investigation tied to delivery and evidence',
          description:
            'The platform is also a vehicle for architecture notes, technical studies, postgraduate work and future dissertation-grade material.'
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
        eyebrow: 'Positioning with substance',
        title: 'Use the public layer to explain the platform before opening the protected operation.',
        description:
          'The website is now structured to support conversations about architecture, product direction, applied research and platform access without pretending scale that does not exist.',
        primaryCta: { label: 'Read the platform overview', href: '/platform' },
        secondaryCta: { label: 'Open platform access', href: '/login' }
      }
    },
    about: {
      eyebrow: 'About PhaifferTech',
      title: 'A technology company shaped by platform thinking, software architecture and applied engineering.',
      description:
        'PhaifferTech combines institutional positioning, SaaS product development and research-oriented technical work in a single direction. The goal is not to look large on the outside; it is to be technically coherent enough that products, architecture and research can evolve from the same foundation.',
      principlesTitle: 'What defines the brand',
      principlesDescription:
        'PhaifferTech is positioned as a company that can explain and build the architecture behind operational software, not only ship isolated interfaces.',
      principles: [
        {
          eyebrow: 'Seriousness',
          title: 'Operational software with architectural discipline',
          description:
            'The public brand is aligned with a codebase that already enforces module boundaries, contracts and platform governance.'
        },
        {
          eyebrow: 'Clarity',
          title: 'Business-readable and technically defensible communication',
          description:
            'The same company narrative must make sense for customers, peers, evaluators and academic supervisors.'
        },
        {
          eyebrow: 'Continuity',
          title: 'Product, architecture and research are not separate tracks',
          description:
            'Each one informs the others: operational products generate questions, research sharpens framing and architecture keeps the platform coherent.'
        },
        {
          eyebrow: 'Restraint',
          title: 'No fake scale, no inflated marketing language',
          description:
            'The positioning aims for credibility: strong engineering language, honest product maturity and visible long-term direction.'
        }
      ],
      directionTitle: 'Long-term direction',
      directionDescription:
        'The company direction is intentionally layered so it can support commercial growth and academic continuity without changing its technical center of gravity.',
      direction: [
        {
          eyebrow: 'Product',
          title: 'Grow modular SaaS products from one platform core',
          description:
            'CRM, PetFlow and IoT System evolve as real products with explicit boundaries and shared platform services.'
        },
        {
          eyebrow: 'Engineering',
          title: 'Deepen platform and data capabilities',
          description:
            'Cloud architecture, modular integration and operational data flows are central to future technical maturity.'
        },
        {
          eyebrow: 'Research',
          title: 'Turn delivery and architecture work into evidence and publication',
          description:
            'The platform supports technical studies, postgraduate visibility and future dissertation-grade investigation.'
        }
      ],
      identityTitle: 'Identity in practice',
      identityDescription:
        'The brand should help people understand where PhaifferTech sits: not as a generic agency, and not as a shallow startup landing page.',
      identity: [
        {
          value: 'Company',
          label: 'Technology brand',
          description:
            'Public-facing, commercially credible and aligned with product execution.'
        },
        {
          value: 'Platform',
          label: 'Modular SaaS foundation',
          description:
            'Shared core capabilities, reusable architecture and real application modules.'
        },
        {
          value: 'Research',
          label: 'Applied technical direction',
          description:
            'Built to support academic outputs, architecture notes and research continuity.'
        }
      ]
    },
    platform: {
      eyebrow: 'Platform',
      title: 'One modular SaaS platform designed to host different operational products without collapsing their boundaries.',
      description:
        'PhaifferTech Platform is the shared operational foundation behind CRM, PetFlow and IoT System. The intent is to reuse governance and contracts where it makes sense, while preserving explicit ownership of each business domain.',
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
            'Auth, tenancy, IAM, module access, feature flags and reusable technical contracts stay out of CRM, Pet and IoT business rules.'
        },
        {
          eyebrow: 'Vertical modules',
          title: 'CRM, Pet and IoT own their business domains',
          description:
            'Each module keeps its own services, DTOs, mappers and controllers, with cross-module integration going through explicit contracts.'
        }
      ],
      modulesTitle: 'Products on the same foundation',
      modulesDescription:
        'The value of the platform is not that every product does the same thing. It is that they can evolve under the same architectural discipline.',
      modules: [
        {
          eyebrow: 'CRM',
          title: 'Commercial structure and future transversal coordination',
          description:
            'CRM handles companies, contacts, leads, deals, tasks, notes and activity while preparing for future cross-product coordination.'
        },
        {
          eyebrow: 'PetFlow',
          title: 'Clinical and operational workflows for pet care environments',
          description:
            'PetFlow already connects appointments with medical workflow, inventory and a consolidated clinical timeline.'
        },
        {
          eyebrow: 'IoT System',
          title: 'Operational telemetry and industrial monitoring',
          description:
            'IoT System supports devices, telemetry, alarms, reporting and operational storytelling on top of the shared platform.'
        }
      ]
    },
    products: {
      eyebrow: 'Products',
      title: 'Product lines built with business clarity and architectural realism.',
      description:
        'PhaifferTech presents its products as operational systems with actual scope, not as inflated slogans. Each one is positioned by value, domain fit and architectural maturity.',
      products: [
        {
          eyebrow: 'Industrial / infrastructure',
          title: 'IoT System',
          description:
            'Operational visibility for telemetry-driven environments with devices, alarms, reports and dashboard narratives that are already useful for demos and evolution.',
          bullets: [
            'Devices, telemetry and alarm flows',
            'Operational validation scripts and demo narrative',
            'Platform-aligned dashboards and module guards'
          ],
          footer: 'Best fit: industrial monitoring, field assets, infrastructure operations and telemetry-heavy use cases.'
        },
        {
          eyebrow: 'Clinical / service operations',
          title: 'PetFlow',
          description:
            'A veterinary and pet-service operational module covering intake, scheduling, clinical context, inventory and care continuity.',
          bullets: [
            'Appointments linked to medical workflow',
            'Clinical timeline by pet and appointment',
            'Operational contracts already hardened across backend and frontend'
          ],
          footer: 'Best fit: clinics, pet-service operations and environments where scheduling and care flow need to coexist.'
        },
        {
          eyebrow: 'Commercial / coordination',
          title: 'CRM / Operational Hub',
          description:
            'The CRM covers core commercial structure today and is being prepared to become a transversal relationship and follow-up layer for the platform ecosystem.',
          bullets: [
            'Companies, contacts, leads and deals',
            'Tasks, notes and activity with canonical references',
            'Prepared for future CRM ↔ product integration'
          ],
          footer: 'Best fit: commercial operation, follow-up, post-sale coordination and platform-wide account visibility.'
        }
      ],
      fitTitle: 'Why the portfolio matters together',
      fitDescription:
        'The product story is stronger when the public site explains how the shared platform reduces duplication while keeping domain ownership explicit.',
      fit: [
        {
          eyebrow: 'Shared governance',
          title: 'One foundation for access, tenancy and module enablement',
          description:
            'Products do not reinvent the basics of SaaS governance every time a domain expands.'
        },
        {
          eyebrow: 'Explicit boundaries',
          title: 'Different products without hidden coupling',
          description:
            'Cross-module integration is capability-driven, which keeps the portfolio scalable and technically explainable.'
        },
        {
          eyebrow: 'Future growth',
          title: 'Prepared for commercial, operational and research evolution',
          description:
            'The portfolio can grow without forcing a redesign of the platform narrative each time a module matures.'
        }
      ]
    },
    engineering: {
      eyebrow: 'Engineering',
      title: 'Platform engineering, data thinking and cloud architecture applied to real operational products.',
      description:
        'PhaifferTech is positioned around engineering authority that can support product development, technical discussions and future publication. The focus is not superficial consulting language, but systems thinking tied to actual software implementation.',
      expertiseTitle: 'Expertise areas',
      expertiseDescription:
        'These are the technical areas the public site needs to communicate clearly because they explain why the platform exists the way it does.',
      expertise: [
        {
          eyebrow: 'Data Engineering',
          title: 'Operational data flows, events and integration posture',
          description:
            'Systems are designed with data lifecycles, observability and future analytical continuity in mind.'
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
            'CRM, IoT and PetFlow are explained by their workflows, contracts and platform posture.'
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
      title: 'A public space prepared for applied studies, postgraduate continuity and future dissertation work.',
      description:
        'PhaifferTech is also part of a technical-academic trajectory. The website needs to show that the platform is not only a commercial artifact; it is also a living basis for investigation around data engineering, architecture and operational systems.',
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
          title: 'Industrial and clinical operational software',
          description:
            'IoT System and PetFlow provide concrete product contexts that can support comparative analysis and applied architecture narratives.'
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
            'CRM, PetFlow and IoT create different domain pressures on the same platform foundation.'
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
      eyebrow: 'Articles / Insights',
      title: 'Technical writing prepared to grow from architecture notes into a public knowledge layer.',
      description:
        'This section is intentionally lightweight today. It gives PhaifferTech a place to publish architecture notes, platform thinking and applied research insights without building a full CMS upfront.',
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
                'Tenancy, IAM, auditing, feature gating and module access are shared because they are platform concerns. CRM, PetFlow and IoT stay vertical because their business rules should not be diluted into generic infrastructure layers.',
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
          slug: 'data-platform-thinking-for-industrial-iot',
          category: 'Data Engineering',
          readTime: '7 min read',
          title: 'Data platform thinking for industrial IoT operations',
          description:
            'How telemetry-heavy products benefit from being framed as data systems instead of only device dashboards.',
          highlight:
            'Industrial and field operations generate more than status screens. They produce operational data, escalation paths and architecture decisions that should be designed as a platform concern.',
          sections: [
            {
              title: 'From device inventory to operational data flow',
              paragraphs: [
                'An IoT product becomes strategically stronger when telemetry, alarms and maintenance narratives are treated as connected operational data flows rather than isolated screens.',
                'That framing influences how contracts are written, how capabilities are exposed and how executive dashboards can be explained.'
              ]
            },
            {
              title: 'Why platform posture matters',
              paragraphs: [
                'The platform foundation matters because industrial use cases eventually pressure identity, module access, tenant separation, auditing and reporting at the same time.',
                'Having those concerns already built into the shared layers makes the IoT module easier to extend without rewriting its foundations.'
              ]
            },
            {
              title: 'Applied research value',
              paragraphs: [
                'Telemetry-heavy products are fertile ground for future work in data engineering, platform design and operational analytics.',
                'That is one reason the public positioning of PhaifferTech needs to include both product delivery and research direction.'
              ]
            }
          ],
          closing:
            'The IoT story becomes more credible when it is explained as an operational data system living on a shared engineering platform.'
        },
        {
          slug: 'shared-foundations-for-clinical-and-commercial-operations',
          category: 'Products',
          readTime: '9 min read',
          title: 'Shared foundations for clinical and commercial operations',
          description:
            'What CRM and PetFlow reveal about building different workflows on top of one architectural base.',
          highlight:
            'Clinical operations and commercial coordination look very different on the surface, but they both benefit from explicit contracts, shared governance and progressive integration.',
          sections: [
            {
              title: 'Why CRM and PetFlow should not be forced into the same model',
              paragraphs: [
                'A transversal platform does not mean flattening every domain into a single abstract workflow. CRM and PetFlow need different language, different entities and different operational semantics.',
                'The platform value comes from shared governance and explicit integration points, not from pretending the domains are identical.'
              ]
            },
            {
              title: 'Where shared foundation actually helps',
              paragraphs: [
                'Canonical references, tenancy, permissions, dashboards and authenticated shell concerns are the kind of capabilities that compound value across both modules.',
                'That makes it possible to build cross-module visibility incrementally without violating ownership boundaries.'
              ]
            },
            {
              title: 'Why this matters to product and research',
              paragraphs: [
                'The same integration choices that help product evolution also create a clean basis for architecture discussion and future academic analysis.',
                'That is why PhaifferTech needs its public brand to explain both the systems and the reasoning behind them.'
              ]
            }
          ],
          closing:
            'The strongest portfolio story is not “many modules”. It is “many domains, one disciplined platform foundation”.'
        }
      ]
    },
    contact: {
      eyebrow: 'Contact',
      title: 'Open the right kind of conversation: platform, architecture, product or applied research.',
      description:
        'The contact surface is positioned around serious technical conversations rather than generic “say hello” copy. The goal is to help people understand how to approach PhaifferTech depending on the kind of work or collaboration they need.',
      lanesTitle: 'Where the conversation can start',
      lanesDescription:
        'Each lane reflects a credible entry point into the company narrative without pretending that every interaction is the same.',
      lanes: [
        {
          eyebrow: 'Commercial',
          title: 'Product and platform discovery',
          description:
            'For conversations about the operational value of CRM, IoT System, PetFlow and the shared platform posture.'
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
            'Some conversations start with product clarity, others with architecture review, and others with demo or platform access.'
        }
      ],
      cta: {
        eyebrow: 'Protected access',
        title: 'Use the platform login when the next step is an authenticated environment, not a public overview.',
        description:
          'The institutional website explains positioning. The protected platform is where contracted modules, permissions and operational flows actually live.',
        primaryCta: { label: 'Open platform access', href: '/login' },
        secondaryCta: { label: 'Review the platform first', href: '/platform' }
      }
    }
  },
  'pt-BR': {
    home: {
      hero: {
        eyebrow: 'Data engineering · cloud architecture · operational platforms',
        title:
          'A PhaifferTech constrói plataformas modulares para operação real, autoridade técnica e pesquisa aplicada.',
        description:
          'A empresa combina execução de produto, platform engineering e raciocínio orientado à pesquisa para desenhar fundações SaaS escaláveis, sistemas operacionais industriais e clínicos, e arquiteturas intensivas em dados sem perder disciplina arquitetural.',
        primaryCta: { label: 'Explorar a plataforma', href: '/platform' },
        secondaryCta: { label: 'Ver direção de engineering', href: '/engineering' }
      },
      signalTitle: 'Uma narrativa pública compatível com o código real',
      signalDescription:
        'A camada pública agora reflete a maturidade real do repositório: produtos modulares, fronteiras arquiteturais explícitas e uma direção séria de engenharia.',
      signals: [
        {
          value: '3',
          label: 'Produtos na mesma fundação',
          description:
            'CRM, IoT System e PetFlow compartilham capabilities transversais em vez de stacks isoladas.'
        },
        {
          value: 'Dados',
          label: 'Posicionamento orientado à engenharia',
          description:
            'Sistemas operacionais são tratados como ativos produtores de dados, integráveis e guiados por arquitetura.'
        },
        {
          value: 'Aplicado',
          label: 'Pesquisa ancorada em entrega',
          description:
            'A plataforma suporta produto comercial, pós-graduação e continuidade futura de pesquisa.'
        }
      ],
      productsTitle: 'Produtos com escopos operacionais diferentes, uma plataforma compartilhada',
      productsDescription:
        'A PhaifferTech não apresenta experimentos desconectados. Cada linha de produto estende a mesma postura de plataforma: governança compartilhada, habilitação modular e fronteiras arquiteturais explícitas.',
      products: [
        {
          eyebrow: 'Controle comercial',
          title: 'CRM / Operational Hub',
          description:
            'Estrutura comercial, coordenação operacional e futura camada transversal de acompanhamento sobre um núcleo compartilhado de CRM.',
          bullets: ['Companies, contacts, leads e deals', 'Tasks, notes e activity', 'Preparado para referências canônicas entre produtos']
        },
        {
          eyebrow: 'Operação clínica',
          title: 'PetFlow',
          description:
            'Agenda, continuidade de atendimento, inventory e medical workflow para operações veterinárias e pet-service.',
          bullets: ['Appointments conectados ao medical workflow', 'Timeline clínica por pet e appointment', 'Contratos operacionais já alinhados entre backend e frontend']
        },
        {
          eyebrow: 'Operação industrial / de campo',
          title: 'IoT System',
          description:
            'Telemetria, device management, alarmes, dashboards e narrativa operacional para contextos industriais e de infraestrutura.',
          bullets: ['Módulos de devices, telemetry e reports', 'Dashboard executivo por capabilities', 'Fluxo operacional validado e pronto para demo']
        }
      ],
      expertiseTitle: 'Autoridade construída sobre profundidade técnica, não sobre buzzwords',
      expertiseDescription:
        'O site posiciona a PhaifferTech como uma marca técnica de software architecture, data engineering e cloud systems capaz de sustentar produtos operacionais reais.',
      expertise: [
        {
          eyebrow: 'Data Engineering',
          title: 'Fluxos operacionais de dados e primitivas reutilizáveis de plataforma',
          description:
            'Estruturas de dados, ingestão, tenancy e contratos modulares são tratados como restrições centrais de design.'
        },
        {
          eyebrow: 'Cloud Architecture',
          title: 'Pensamento de infraestrutura sem perder clareza de produto',
          description:
            'Postura em cloud é conectada a mantenabilidade, realidade de deploy, observabilidade e fronteiras modulares.'
        },
        {
          eyebrow: 'Platform Engineering',
          title: 'Capabilities compartilhadas que acumulam valor entre produtos',
          description:
            'Feature flags, module access, dashboard capabilities e referências canônicas reduzem fragmentação e risco futuro de integração.'
        },
        {
          eyebrow: 'Applied Research',
          title: 'Investigação técnica ligada à entrega e à evidência',
          description:
            'A plataforma também é um veículo para notas de arquitetura, estudos técnicos, pós-graduação e material futuro de dissertação.'
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
        eyebrow: 'Posicionamento com substância',
        title: 'Use a camada pública para explicar a plataforma antes de abrir a operação protegida.',
        description:
          'O site agora está estruturado para sustentar conversas sobre arquitetura, direção de produto, pesquisa aplicada e acesso à plataforma sem fingir uma escala que não existe.',
        primaryCta: { label: 'Ler visão da plataforma', href: '/platform' },
        secondaryCta: { label: 'Abrir acesso à plataforma', href: '/login' }
      }
    },
    about: {
      eyebrow: 'Sobre a PhaifferTech',
      title: 'Uma empresa de tecnologia moldada por platform thinking, software architecture e engenharia aplicada.',
      description:
        'A PhaifferTech combina posicionamento institucional, desenvolvimento de produto SaaS e trabalho técnico orientado à pesquisa em uma mesma direção. O objetivo não é parecer grande por fora; é ser tecnicamente coerente o suficiente para que produto, arquitetura e pesquisa evoluam da mesma base.',
      principlesTitle: 'O que define a marca',
      principlesDescription:
        'A PhaifferTech é posicionada como uma empresa que consegue explicar e construir a arquitetura por trás do software operacional, e não apenas entregar interfaces isoladas.',
      principles: [
        {
          eyebrow: 'Seriedade',
          title: 'Software operacional com disciplina arquitetural',
          description:
            'A marca pública se alinha a um codebase que já impõe fronteiras modulares, contratos e governança de plataforma.'
        },
        {
          eyebrow: 'Clareza',
          title: 'Comunicação legível para negócio e defensável tecnicamente',
          description:
            'A mesma narrativa precisa fazer sentido para clientes, pares, avaliadores e orientadores acadêmicos.'
        },
        {
          eyebrow: 'Continuidade',
          title: 'Produto, arquitetura e pesquisa não são trilhas separadas',
          description:
            'Cada uma informa a outra: produtos geram perguntas, pesquisa afia enquadramento e arquitetura mantém a plataforma coerente.'
        },
        {
          eyebrow: 'Sobriedade',
          title: 'Sem escala falsa e sem linguagem inflada',
          description:
            'O posicionamento mira credibilidade: linguagem forte de engenharia, maturidade honesta do produto e direção visível de longo prazo.'
        }
      ],
      directionTitle: 'Direção de longo prazo',
      directionDescription:
        'A direção da empresa é intencionalmente em camadas para suportar crescimento comercial e continuidade acadêmica sem trocar seu centro de gravidade técnico.',
      direction: [
        {
          eyebrow: 'Produto',
          title: 'Expandir produtos SaaS modulares a partir de um núcleo de plataforma',
          description:
            'CRM, PetFlow e IoT System evoluem como produtos reais com fronteiras explícitas e serviços compartilhados.'
        },
        {
          eyebrow: 'Engineering',
          title: 'Aprofundar capabilities de plataforma e dados',
          description:
            'Cloud architecture, integração modular e fluxos operacionais de dados são centrais para a maturidade técnica futura.'
        },
        {
          eyebrow: 'Pesquisa',
          title: 'Transformar entrega e arquitetura em evidência e publicação',
          description:
            'A plataforma sustenta estudos técnicos, visibilidade de pós-graduação e investigação futura em nível de dissertação.'
        }
      ],
      identityTitle: 'Identidade na prática',
      identityDescription:
        'A marca deve ajudar a entender onde a PhaifferTech se posiciona: não como agência genérica e não como landing page rasa de startup.',
      identity: [
        {
          value: 'Empresa',
          label: 'Marca de tecnologia',
          description:
            'Pública, comercialmente crível e alinhada à execução de produto.'
        },
        {
          value: 'Plataforma',
          label: 'Fundação SaaS modular',
          description:
            'Capabilities compartilhadas, arquitetura reutilizável e módulos reais de aplicação.'
        },
        {
          value: 'Pesquisa',
          label: 'Direção técnica aplicada',
          description:
            'Preparada para suportar saídas acadêmicas, notas de arquitetura e continuidade de investigação.'
        }
      ]
    },
    platform: {
      eyebrow: 'Plataforma',
      title: 'Uma plataforma SaaS modular desenhada para hospedar produtos operacionais diferentes sem colapsar suas fronteiras.',
      description:
        'A PhaifferTech Platform é a fundação operacional compartilhada por CRM, PetFlow e IoT System. A intenção é reutilizar governança e contratos onde faz sentido, preservando ownership explícito de cada domínio de negócio.',
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
            'Auth, tenancy, IAM, module access, feature flags e contratos técnicos reutilizáveis ficam fora das regras de CRM, Pet e IoT.'
        },
        {
          eyebrow: 'Módulos verticais',
          title: 'CRM, Pet e IoT donos dos seus domínios',
          description:
            'Cada módulo mantém seus services, DTOs, mappers e controllers, com integração cruzada feita por contracts explícitos.'
        }
      ],
      modulesTitle: 'Produtos sobre a mesma fundação',
      modulesDescription:
        'O valor da plataforma não é fazer tudo igual. É permitir evolução sob a mesma disciplina arquitetural.',
      modules: [
        {
          eyebrow: 'CRM',
          title: 'Estrutura comercial e futura coordenação transversal',
          description:
            'O CRM já cobre companies, contacts, leads, deals, tasks, notes e activity enquanto se prepara para coordenação cross-product.'
        },
        {
          eyebrow: 'PetFlow',
          title: 'Fluxos clínicos e operacionais para o setor pet',
          description:
            'O PetFlow já conecta appointments ao medical workflow, inventory e uma timeline clínica consolidada.'
        },
        {
          eyebrow: 'IoT System',
          title: 'Telemetria operacional e monitoramento industrial',
          description:
            'O IoT System suporta devices, telemetry, alarms, reporting e narrativa operacional sobre a mesma plataforma.'
        }
      ]
    },
    products: {
      eyebrow: 'Produtos',
      title: 'Linhas de produto construídas com clareza de negócio e realismo arquitetural.',
      description:
        'A PhaifferTech apresenta seus produtos como sistemas operacionais com escopo real, não como slogans inflados. Cada um é posicionado por valor, aderência ao domínio e maturidade arquitetural.',
      products: [
        {
          eyebrow: 'Industrial / infraestrutura',
          title: 'IoT System',
          description:
            'Visibilidade operacional para ambientes guiados por telemetria com devices, alarmes, reports e narrativas de dashboard úteis para demo e evolução.',
          bullets: [
            'Fluxos de devices, telemetry e alarms',
            'Scripts de validação operacional e narrativa de demo',
            'Dashboards e guards alinhados à plataforma'
          ],
          footer: 'Melhor aderência: monitoramento industrial, ativos de campo, infraestrutura e contextos de telemetria intensa.'
        },
        {
          eyebrow: 'Clínico / serviços',
          title: 'PetFlow',
          description:
            'Módulo operacional veterinário e pet-service cobrindo intake, agenda, contexto clínico, inventory e continuidade de atendimento.',
          bullets: [
            'Appointments conectados ao medical workflow',
            'Timeline clínica por pet e appointment',
            'Contratos operacionais já endurecidos entre backend e frontend'
          ],
          footer: 'Melhor aderência: clínicas, operações pet-service e ambientes em que agenda e atendimento precisam coexistir.'
        },
        {
          eyebrow: 'Comercial / coordenação',
          title: 'CRM / Operational Hub',
          description:
            'O CRM cobre hoje a estrutura comercial central e está sendo preparado para virar camada transversal de relacionamento e acompanhamento do ecossistema.',
          bullets: [
            'Companies, contacts, leads e deals',
            'Tasks, notes e activity com referências canônicas',
            'Preparado para futuras integrações CRM ↔ produtos'
          ],
          footer: 'Melhor aderência: operação comercial, follow-up, coordenação pós-venda e visibilidade de contas entre produtos.'
        }
      ],
      fitTitle: 'Por que o portfólio faz sentido junto',
      fitDescription:
        'A história do portfólio fica mais forte quando o site explica como a plataforma compartilhada reduz duplicação sem diluir ownership dos domínios.',
      fit: [
        {
          eyebrow: 'Governança compartilhada',
          title: 'Uma base para acesso, tenancy e enablement modular',
          description:
            'Os produtos não reinventam do zero os elementos centrais de governança SaaS a cada expansão de domínio.'
        },
        {
          eyebrow: 'Fronteiras explícitas',
          title: 'Produtos diferentes sem acoplamento escondido',
          description:
            'A integração cross-module é orientada por capabilities, o que mantém o portfólio escalável e tecnicamente explicável.'
        },
        {
          eyebrow: 'Crescimento futuro',
          title: 'Preparado para evolução comercial, operacional e acadêmica',
          description:
            'O portfólio pode crescer sem exigir uma reinvenção da narrativa da plataforma a cada novo passo.'
        }
      ]
    },
    engineering: {
      eyebrow: 'Engineering',
      title: 'Platform engineering, pensamento em dados e cloud architecture aplicados a produtos operacionais reais.',
      description:
        'A PhaifferTech se posiciona em torno de autoridade de engenharia capaz de sustentar desenvolvimento de produto, discussão técnica e futura publicação. O foco não é linguagem superficial de consultoria, mas systems thinking ligado a implementação real.',
      expertiseTitle: 'Áreas de especialidade',
      expertiseDescription:
        'Estas são as áreas técnicas que o site precisa comunicar claramente porque explicam por que a plataforma existe do jeito que existe.',
      expertise: [
        {
          eyebrow: 'Data Engineering',
          title: 'Fluxos operacionais de dados, eventos e postura de integração',
          description:
            'Os sistemas são pensados com ciclos de vida de dados, observabilidade e continuidade analítica futura.'
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
            'CRM, IoT e PetFlow são explicados por fluxos, contratos e postura de plataforma.'
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
      title: 'Um espaço público preparado para estudos aplicados, continuidade de pós-graduação e futura dissertação.',
      description:
        'A PhaifferTech também faz parte de uma trajetória técnico-acadêmica. O site precisa mostrar que a plataforma não é apenas um artefato comercial; ela também é base viva para investigação em data engineering, arquitetura e sistemas operacionais.',
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
          title: 'Software operacional clínico e industrial',
          description:
            'IoT System e PetFlow fornecem contextos concretos de produto que podem sustentar análise comparativa e narrativa arquitetural aplicada.'
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
            'CRM, PetFlow e IoT criam pressões de domínio diferentes sobre a mesma fundação de plataforma.'
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
      eyebrow: 'Artigos / Insights',
      title: 'Escrita técnica preparada para crescer de notas de arquitetura para uma camada pública de conhecimento.',
      description:
        'Esta seção é intencionalmente leve agora. Ela dá à PhaifferTech um lugar para publicar notas de arquitetura, visão de plataforma e insights de pesquisa aplicada sem construir um CMS completo antes da hora.',
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
                'Tenancy, IAM, auditing, feature gating e module access são compartilhados porque são concerns de plataforma. CRM, PetFlow e IoT continuam verticais porque suas regras de negócio não devem ser diluídas em camadas genéricas.',
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
          slug: 'data-platform-thinking-for-industrial-iot',
          category: 'Data Engineering',
          readTime: '7 min read',
          title: 'Data platform thinking for industrial IoT operations',
          description:
            'Como produtos orientados a telemetria ganham força quando são tratados como sistemas de dados e não apenas como dashboards de devices.',
          highlight:
            'Operações industriais e de campo geram mais do que telas de status. Elas produzem dados operacionais, fluxos de escalonamento e decisões de arquitetura que devem ser pensadas como preocupação de plataforma.',
          sections: [
            {
              title: 'De inventário de devices a fluxo operacional de dados',
              paragraphs: [
                'Um produto IoT fica estrategicamente mais forte quando telemetry, alarms e narrativas de maintenance são tratados como fluxos operacionais conectados em vez de telas isoladas.',
                'Esse enquadramento influencia como contratos são escritos, como capabilities são expostas e como dashboards executivos podem ser explicados.'
              ]
            },
            {
              title: 'Por que a postura de plataforma importa',
              paragraphs: [
                'A fundação de plataforma importa porque casos de uso industriais pressionam identity, module access, separação por tenant, auditing e reporting ao mesmo tempo.',
                'Ter essas concerns já construídas nas camadas compartilhadas torna o módulo IoT mais fácil de expandir sem reescrever sua base.'
              ]
            },
            {
              title: 'Valor para pesquisa aplicada',
              paragraphs: [
                'Produtos intensivos em telemetria são terreno fértil para trabalho futuro em data engineering, platform design e analytics operacional.',
                'Essa é uma das razões pelas quais o posicionamento público da PhaifferTech precisa incluir tanto entrega de produto quanto direção de pesquisa.'
              ]
            }
          ],
          closing:
            'A narrativa de IoT fica mais crível quando é explicada como sistema operacional de dados vivendo sobre uma plataforma de engenharia compartilhada.'
        },
        {
          slug: 'shared-foundations-for-clinical-and-commercial-operations',
          category: 'Products',
          readTime: '9 min read',
          title: 'Shared foundations for clinical and commercial operations',
          description:
            'O que CRM e PetFlow revelam sobre construir workflows diferentes sobre a mesma base arquitetural.',
          highlight:
            'Operações clínicas e coordenação comercial parecem muito diferentes na superfície, mas ambas se beneficiam de contratos explícitos, governança compartilhada e integração progressiva.',
          sections: [
            {
              title: 'Por que CRM e PetFlow não devem ser forçados ao mesmo modelo',
              paragraphs: [
                'Uma plataforma transversal não significa achatar todos os domínios num único workflow abstrato. CRM e PetFlow precisam de linguagem, entidades e semântica operacional diferentes.',
                'O valor da plataforma vem da governança compartilhada e dos pontos de integração explícitos, e não de fingir que os domínios são idênticos.'
              ]
            },
            {
              title: 'Onde a fundação compartilhada realmente ajuda',
              paragraphs: [
                'Referências canônicas, tenancy, permissions, dashboards e concerns do shell autenticado são o tipo de capability que acumula valor nos dois módulos.',
                'Isso permite construir visibilidade cross-module de forma incremental sem violar ownership.'
              ]
            },
            {
              title: 'Por que isso importa para produto e pesquisa',
              paragraphs: [
                'As mesmas escolhas de integração que ajudam a evolução do produto também criam uma base limpa para discussão arquitetural e análise acadêmica futura.',
                'É por isso que a marca pública da PhaifferTech precisa explicar os sistemas e o raciocínio por trás deles.'
              ]
            }
          ],
          closing:
            'A história mais forte do portfólio não é “muitos módulos”. É “muitos domínios, uma fundação disciplinada de plataforma”.'
        }
      ]
    },
    contact: {
      eyebrow: 'Contato',
      title: 'Abra a conversa certa: plataforma, arquitetura, produto ou pesquisa aplicada.',
      description:
        'A superfície de contato é posicionada em torno de conversas técnicas sérias, e não de copy genérica de “fale conosco”. O objetivo é ajudar a entender como abordar a PhaifferTech dependendo do tipo de trabalho ou colaboração necessário.',
      lanesTitle: 'Onde a conversa pode começar',
      lanesDescription:
        'Cada trilha reflete um ponto de entrada crível para a narrativa da empresa sem fingir que toda interação é igual.',
      lanes: [
        {
          eyebrow: 'Comercial',
          title: 'Descoberta de produto e plataforma',
          description:
            'Para conversas sobre valor operacional de CRM, IoT System, PetFlow e a postura compartilhada da plataforma.'
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
            'Algumas conversas começam por clareza de produto, outras por revisão arquitetural e outras por demo ou acesso à plataforma.'
        }
      ],
      cta: {
        eyebrow: 'Acesso protegido',
        title: 'Use o login da plataforma quando o próximo passo for um ambiente autenticado e não apenas uma visão pública.',
        description:
          'O website institucional explica posicionamento. A plataforma protegida é onde módulos contratados, permissões e workflows operacionais realmente vivem.',
        primaryCta: { label: 'Abrir acesso à plataforma', href: '/login' },
        secondaryCta: { label: 'Rever a plataforma antes', href: '/platform' }
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
