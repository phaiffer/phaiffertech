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
        eyebrow: 'PetFlow · grooming · clinics · pet shops',
        title:
          'PetFlow for pet operations that need clarity.',
        description:
          'Appointments, packages, inventory, and billing in one system for grooming, clinics, and hybrid pet businesses.',
        primaryCta: { label: 'Request a demo', href: '/contact' },
        secondaryCta: { label: 'Platform access', href: '/login' }
      },
      signalTitle: 'A clearer operating system for pet businesses.',
      signalDescription:
        'PetFlow keeps appointments, packages, inventory, and billing on the same workflow so the business can operate without fragmented tools.',
      signals: [
        {
          value: 'Scheduling',
          label: 'Appointments & scheduling',
          description:
            'Clients, pets, appointments, professionals, and services in a single system. No notebook, no spreadsheet.'
        },
        {
          value: 'Inventory',
          label: 'Inventory & billing',
          description:
            'Manage products, stock movements, and monthly invoices. The system calculates what each client owes, including extras like pet taxi.'
        },
        {
          value: 'Plans',
          label: 'Monthly plans',
          description:
            'Register plans with a set number of sessions, track usage, and receive automatic alerts when a client is on their second-to-last session.'
        }
      ],
      productsTitle: 'One visible product. Three operating contexts.',
      productsDescription:
        'PetFlow is the commercial product today. It adapts to grooming, clinical, and hybrid pet operations on the same platform foundation.',
      products: [
        {
          eyebrow: 'For grooming services',
          title: 'PetFlow',
          description:
            'Service scheduling, monthly plan management, per-appointment professional tracking, and complete pet history.',
          bullets: ['Scheduling with responsible professional', 'Monthly packages with session tracking', 'Service history per pet']
        },
        {
          eyebrow: 'For veterinary clinics',
          title: 'PetFlow Clinical',
          description:
            'Electronic health records, vaccines, prescriptions, and clinical timeline integrated with scheduling and billing.',
          bullets: ['Health records and vaccines per pet', 'Prescriptions and clinical notes', 'Appointment timeline']
        },
        {
          eyebrow: 'For hybrid pet shops',
          title: 'PetFlow Complete',
          description:
            'Combine services, products, and clinical care in a single system with integrated inventory and billing.',
          bullets: ['Inventory with reorder alerts', 'Billing with pet taxi and extras', 'Report by professional']
        }
      ],
      expertiseTitle: 'Authority built on engineering depth, not on generic buzzwords',
      expertiseDescription:
        'The site positions PhaifferTech as a technical brand for software architecture, data engineering and cloud systems that can support real operational products.',
      expertise: [
        {
          eyebrow: 'Data Engineering & Analytics',
          title: 'Operational data flows, business insights, and reusable platform primitives',
          description:
            'Data structures, analytical aggregations, tenancy concerns and modular contracts are treated as first-class design constraints. PetFlow surfaces insights directly from operational data.'
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
        eyebrow: 'PetFlow available now',
        title: 'Start organizing your pet business today.',
        description:
          'Scheduling, monthly plans, inventory, professionals, and billing in a single system. Get in touch to learn about PetFlow.',
        primaryCta: { label: 'Get in touch', href: '/contact' },
        secondaryCta: { label: 'See the platform', href: '/platform' }
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
          title: 'CRM and commercial coordination',
          description:
            'The CRM module already covers companies, contacts, leads, deals and pipeline. It is being prepared for cross-product coordination as the customer base grows.'
        },
        {
          eyebrow: 'Future phase',
          title: 'IoT System for industrial and field operations',
          description:
            'Telemetry, device management, alarms and dashboards for industrial contexts. Preserved in the platform for future commercial activation.'
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
          value: '3',
          label: 'Vertical modules',
          description:
            'Pet, CRM and IoT — independent in architecture, integrated in the platform.'
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
      title: 'The technical foundation behind PetFlow — and the next products.',
      description:
        'PhaifferTech Platform is the shared core of authentication, multi-tenancy, permissions and modules that powers PetFlow today and the next products tomorrow. Each vertical module evolves independently on the same foundation.',
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
          eyebrow: 'PetFlow · primary product',
          title: 'Clinical and operational workflows for pet care environments',
          description:
            'PetFlow connects appointments with medical workflow, inventory and a consolidated clinical timeline — the current commercial focus of the platform.'
        },
        {
          eyebrow: 'CRM',
          title: 'Commercial structure and future transversal coordination',
          description:
            'CRM handles companies, contacts, leads, deals, tasks, notes and activity while preparing for future cross-product coordination.'
        },
        {
          eyebrow: 'IoT System · future phase',
          title: 'Operational telemetry and industrial monitoring',
          description:
            'IoT System supports devices, telemetry, alarms, reporting and operational storytelling on top of the shared platform — preserved for future commercial deployment.'
        }
      ]
    },
    products: {
      eyebrow: 'Products',
      title: 'PetFlow is available now. The platform is built for more.',
      description:
        'PhaifferTech currently focuses its commercial execution on PetFlow — operational software for veterinary and pet-service environments. CRM and IoT System are part of the same platform foundation, ready for their own phases.',
      products: [
        {
          eyebrow: 'Pet business management · now available',
          title: 'PetFlow',
          description:
            'Scheduling, monthly plans, inventory, professionals and billing in one system. For clinics, grooming services and pet shops.'
        },
        {
          eyebrow: 'Commercial · maturing phase',
          title: 'CRM / Operational Hub',
          description:
            'Commercial structure with companies, contacts, leads, deals and pipeline. Being prepared for cross-product coordination.'
        },
        {
          eyebrow: 'Industrial / infrastructure · future phase',
          title: 'IoT System',
          description:
            'Telemetry, devices, alarms and dashboards for industrial operations. Preserved in the platform for future commercial activation.'
        }
      ],
      fitTitle: 'Built for the way pet businesses actually work',
      fitDescription:
        'Whether you run a clinic, a grooming salon, a pet shop, or a hybrid operation, PetFlow adapts to your workflow without requiring a separate system for each business type.',
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
      title: 'Interested in PetFlow? Let\'s talk.',
      description:
        'Get in touch to learn about the system, schedule a demo or understand how PetFlow fits your pet business.',
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
        eyebrow: 'Contact',
        title: 'Interested in PetFlow? Let\'s talk.',
        description:
          'Get in touch to learn about the system, schedule a demo or understand how PetFlow fits your pet business.',
        primaryCta: { label: 'Send a message', href: 'mailto:contato@phaiffertech.com.br' },
        secondaryCta: { label: 'See the system', href: '/platform' }
      }
    }
  },
  'pt-BR': {
    home: {
      hero: {
        eyebrow: 'PetFlow · grooming · clinicas · pet shops',
        title:
          'PetFlow para operacoes pet que precisam de clareza.',
        description:
          'Agenda, pacotes, estoque e faturamento em um unico sistema para banho e tosa, clinicas e operacoes pet hibridas.',
        primaryCta: { label: 'Solicitar demo', href: '/contact' },
        secondaryCta: { label: 'Acessar a plataforma', href: '/login' }
      },
      signalTitle: 'Uma operacao mais clara para o seu pet business.',
      signalDescription:
        'O PetFlow conecta agenda, atendimentos, pacotes, estoque e cobranca no mesmo fluxo para evitar operacao fragmentada.',
      signals: [
        {
          value: 'Agenda e atendimentos',
          label: 'Tudo que acontece no seu pet shop, registrado e organizado',
          description:
            'Clientes, pets, agendamentos, profissionais e serviços em um único sistema. Sem caderno, sem planilha.'
        },
        {
          value: 'Estoque e faturamento',
          label: 'Controle de produtos e cobranças sem trabalho duplicado',
          description:
            'Gerencie produtos, movimentações de estoque e faturas mensais. O sistema calcula o que cada cliente deve, incluindo extras como pet taxi.'
        },
        {
          value: 'Planos mensais',
          label: 'Controle de pacotes por cliente sem perder nenhuma sessão',
          description:
            'Cadastre planos com número de sessões, acompanhe o uso e receba aviso automático quando o cliente estiver na penúltima sessão do pacote.'
        }
      ],
      productsTitle: 'Um produto visivel. Tres contextos de operacao.',
      productsDescription:
        'O PetFlow e o produto comercial hoje. Ele se adapta a grooming, clinicas e operacoes hibridas sobre a mesma base de plataforma.',
      products: [
        {
          eyebrow: 'Para banho e tosa',
          title: 'PetFlow',
          description:
            'Agenda de serviços, controle de planos mensais, registro de profissionais por atendimento e histórico completo de cada pet.',
          bullets: ['Agendamento com profissional responsável', 'Pacotes mensais com controle de sessões', 'Histórico de serviços por pet']
        },
        {
          eyebrow: 'Para clínicas veterinárias',
          title: 'PetFlow Clínico',
          description:
            'Prontuário eletrônico, vacinas, prescrições e timeline clínica integrados ao agendamento e faturamento.',
          bullets: ['Prontuário e vacinas por pet', 'Prescrições e anotações clínicas', 'Timeline de atendimentos']
        },
        {
          eyebrow: 'Para pet shops híbridos',
          title: 'PetFlow Completo',
          description:
            'Combine serviços, produtos e atendimento clínico em um único sistema com controle de estoque e faturamento integrado.',
          bullets: ['Estoque com alerta de reposição', 'Faturamento com pet taxi e extras', 'Relatório por profissional']
        }
      ],
      expertiseTitle: 'Autoridade construída sobre profundidade técnica, não sobre buzzwords',
      expertiseDescription:
        'O site posiciona a PhaifferTech como uma marca técnica de software architecture, data engineering e cloud systems capaz de sustentar produtos operacionais reais.',
      expertise: [
        {
          eyebrow: 'Data Engineering & Analytics',
          title: 'Fluxos operacionais de dados, análise e primitivas reutilizáveis de plataforma',
          description:
            'Estruturas de dados, agregações analíticas, tenancy e contratos modulares são tratados como restrições centrais de design. O PetFlow expõe suporte à decisão diretamente da operação.'
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
        eyebrow: 'PetFlow disponível agora',
        title: 'Comece a organizar seu pet business hoje.',
        description:
          'Agenda, planos mensais, estoque, profissionais e faturamento em um único sistema. Entre em contato para conhecer o PetFlow.',
        primaryCta: { label: 'Entrar em contato', href: '/contact' },
        secondaryCta: { label: 'Ver o sistema', href: '/platform' }
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
          title: 'CRM e coordenação comercial',
          description:
            'O módulo de CRM já cobre empresas, contatos, leads, negócios e pipeline. Está sendo preparado para coordenação entre produtos à medida que a base de clientes cresce.'
        },
        {
          eyebrow: 'Fase futura',
          title: 'IoT System para operações industriais e de campo',
          description:
            'Telemetria, gerenciamento de dispositivos, alarmes e dashboards para contextos industriais. Preservado na plataforma para ativação comercial futura.'
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
          value: '3',
          label: 'Módulos verticais',
          description:
            'Pet, CRM e IoT — independentes na arquitetura, integrados na plataforma.'
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
      title: 'A fundação técnica por trás do PetFlow — e dos próximos produtos.',
      description:
        'A PhaifferTech Platform é o núcleo compartilhado de autenticação, multi-tenancy, permissões e módulos que sustenta o PetFlow hoje e os próximos produtos amanhã. Cada módulo vertical evolui de forma independente sobre a mesma base.',
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
          eyebrow: 'PetFlow · produto principal',
          title: 'Fluxos clínicos e operacionais para o setor pet',
          description:
            'O PetFlow conecta appointments ao medical workflow, inventory e uma timeline clínica consolidada — foco comercial atual da plataforma.'
        },
        {
          eyebrow: 'CRM',
          title: 'Estrutura comercial e futura coordenação transversal',
          description:
            'O CRM já cobre companies, contacts, leads, deals, tasks, notes e activity enquanto se prepara para coordenação cross-product.'
        },
        {
          eyebrow: 'IoT System · fase futura',
          title: 'Telemetria operacional e monitoramento industrial',
          description:
            'O IoT System suporta devices, telemetry, alarms, reporting e narrativa operacional sobre a mesma plataforma — preservado para ativação comercial futura.'
        }
      ]
    },
    products: {
      eyebrow: 'Produtos',
      title: 'PetFlow disponível agora. A plataforma está pronta para mais.',
      description:
        'A PhaifferTech concentra sua execução comercial no PetFlow — sistema de gestão para pet businesses: clínicas, grooming, pet shops e operações híbridas. CRM e IoT System fazem parte da mesma fundação de plataforma, prontos para suas próprias fases.',
      products: [
        {
          eyebrow: 'Gestão de pet business · disponível agora',
          title: 'PetFlow',
          description:
            'Agenda, planos mensais, estoque, profissionais e faturamento em um único sistema. Para clínicas, grooming e pet shops.'
        },
        {
          eyebrow: 'Comercial · fase de maturação',
          title: 'CRM / Operational Hub',
          description:
            'Estrutura comercial com empresas, contatos, leads, deals e pipeline. Preparado para coordenação entre produtos.'
        },
        {
          eyebrow: 'Industrial / infraestrutura · fase futura',
          title: 'IoT System',
          description:
            'Telemetria, dispositivos, alarmes e dashboards para operações industriais. Preservado na plataforma para ativação futura.'
        }
      ],
      fitTitle: 'Feito para o jeito que negócios pet realmente funcionam',
      fitDescription:
        'Seja uma clínica, um pet shop, um salão de banho e tosa ou uma operação híbrida, o PetFlow adapta ao seu fluxo sem precisar de um sistema diferente para cada modelo.',
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
      title: 'Interessado no PetFlow? Vamos conversar.',
      description:
        'Entre em contato para conhecer o sistema, agendar uma demonstração ou entender como o PetFlow se encaixa no seu pet business.',
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
        eyebrow: 'Contato',
        title: 'Interessado no PetFlow? Vamos conversar.',
        description:
          'Entre em contato para conhecer o sistema, agendar uma demonstração ou entender como o PetFlow se encaixa no seu pet business.',
        primaryCta: { label: 'Enviar mensagem', href: 'mailto:contato@phaiffertech.com.br' },
        secondaryCta: { label: 'Ver o sistema', href: '/platform' }
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
