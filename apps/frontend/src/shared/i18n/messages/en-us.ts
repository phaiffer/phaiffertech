import type { AppMessages } from '@/shared/i18n/messages/pt-br';

export const enUSMessages: AppMessages = {
  common: {
    localeLabel: 'Language',
    buttons: {
      search: 'Search',
      clear: 'Clear',
      edit: 'Edit',
      delete: 'Delete',
      cancel: 'Cancel',
      create: 'Create',
      update: 'Update',
      save: 'Save',
      remove: 'Remove',
      open: 'Open'
    }
  },
  publicShell: {
    brandEyebrow: 'PhaifferTech',
    brandTitle: 'PetFlow for real pet operations',
    brandSubtitle:
      'Software for grooming, recurring plans, and pet shop operations on a solid technical foundation.',
    localeLabel: 'Switch site language',
    navHome: 'Home',
    navPlatform: 'Platform',
    navProducts: 'Products',
    navContact: 'Contact',
    navLogin: 'PetFlow access',
    navLabel: 'Navigation',
    footerNarrativeText:
      'PhaifferTech now presents PetFlow as the main product surface for scheduling, recurring plans, stock control, and billing in pet operations.',
    footerProductsTitle: 'Products',
    footerAccessTitle: 'Access',
    footerPlatformLabel: 'Platform foundation',
    footerDemoLabel: 'Request a demo',
    footerCopyright:
      'PhaifferTech · PetFlow for grooming, pet shops, and recurring service operations, powered by a multi-tenant SaaS foundation.'
  },
  publicHome: {
    framework: 'Solutions',
    productLanes: 'Operational lanes',
    expertiseEyebrow: 'Why the demo lands'
  },
  publicHero: {
    panelEyebrow: 'PetFlow demo',
    panelTitle: 'Operational focus',
    panelBadge: 'Demo-ready',
    storyEyebrow: 'Demo story',
    storyText:
      'Show the full cycle with PetFlow at the center: appointment, recurring plan, stock pressure, billing, and automated follow-through.'
  },
  login: {
    title: 'Access workspace',
    description: 'Sign in with your workspace and credentials to enter PetFlow.',
    tenantCodeLabel: 'Company or workspace',
    emailLabel: 'Email',
    passwordLabel: 'Password',
    submitLabel: 'Sign in',
    loadingLabel: 'Signing in...',
    errorFallback: 'Unexpected authentication failure.',
    forgotPasswordLabel: 'Forgot your password?',
    demoActionLabel: 'Use demo',
    signedOutNotice: 'You have signed out successfully.',
    sessionExpiredNotice: 'Your session expired. Sign in again to continue.',
    tenantMismatchNotice: 'The active session no longer matches the current workspace. Sign in again to restore it.',
    passwordChangedNotice: 'Password updated successfully. Sign in again with the new credential.',
    passwordResetNotice: 'Password reset successfully. Sign in again with the new credential.',
    support: {
      eyebrow: 'Product access',
      title: 'Sign in to your workspace.',
      description:
        'Use the workspace code and your credentials to open the operation without leaving the product visual language.',
      backLabel: 'Back to site',
      contactLabel: 'Request a demo',
      heroTitle: 'PetFlow ready to open the day.',
      heroDescription:
        'Scheduling, plans, billing, and follow-through stay in the same product language without distraction and without turning login into a heavy landing page.',
      laneQueueTitle: 'Queue',
      laneQueueDescription: 'Appointments and ready pets with the responsible staff member.',
      lanePlansTitle: 'Plans',
      lanePlansDescription: 'Monthly recurrence, penultimate bath, and renewal in view.',
      laneBillingTitle: 'Billing',
      laneBillingDescription: 'Extras, stock, and commission without leaving the commercial flow.',
      accessCardTitle: 'PetFlow access',
      accessCardDescription:
        'Login keeps the focus on access while preserving the premium atmosphere of the product and the demo.'
    }
  },
  appShell: {
    mobileOverview: 'Overview',
    mobilePetFlow: 'PetFlow',
    mobileSettings: 'Settings',
    quickSearchWorkspace: 'Search the workspace',
    quickSearchPet: 'Search appointments, clients, or billing',
    localeButtonLabel: 'Switch language',
    header: {
      crmLabel: 'Relationship ops',
      crmDescription: 'Continuity lane for follow-up, commercial context, and inherited history while PetFlow absorbs the workflow.',
      petLabel: 'PetFlow',
      petDescription: 'Daily queue, plans, stock, billing, and team accountability in one product lane.',
      workspacesLabel: 'Workspaces',
      workspacesDescription: 'Manage the workspace layer without expanding the visible product surface.',
      usersLabel: 'Users',
      usersDescription: 'Keep internal access and workspace role allocation under control.',
      settingsLabel: 'Settings',
      settingsDescription: 'Branding, access, and workspace setup for the current environment.',
      platformLabel: 'Platform',
      petOverviewLabel: 'PetFlow overview',
      overviewLabel: 'Overview',
      petOverviewDescription:
        'Commercial launchpad for the PetFlow demo with operational context front and center.',
      overviewDescription: 'Shared workspace summary with the current visible product surface.'
    }
  },
  sidebar: {
    overview: 'Overview',
    settings: 'Settings',
    petFlow: 'PetFlow',
    focusLabel: 'PetFlow focus',
    workspaceLabel: 'Workspace',
    signOut: 'Sign out'
  },
  petSubnav: {
    workspace: 'Workspace',
    dashboard: 'Dashboard',
    clients: 'Clients',
    pets: 'Pets',
    appointments: 'Appointments',
    services: 'Grooming catalog',
    followUp: 'Follow-up',
    commercial: 'Commercial',
    clinic: 'Clinic',
    pos: 'POS',
    finance: 'Finance',
    plans: 'Plans',
    inventory: 'Inventory',
    invoices: 'Billing',
    professionals: 'Team',
    commissions: 'Commission closing'
  },
  dashboardRoutes: {
    mainEyebrow: 'PetFlow',
    mainTitle: 'PetFlow overview',
    mainDescription:
      'Main demo view with today appointments, plans near the end, low stock, next-cycle billing, and team commission.',
    surfaceLabel: 'Official demo surface',
    petDashboardEyebrow: 'PetFlow dashboard',
    petDashboardTitle: 'Operations dashboard',
    petDashboardDescription:
      'Follow the daily queue, ready pets, recurrence, low stock, next-cycle billing, and commission in one operational read.'
  },
  petDashboard: {
    noPermission: 'You do not have permission to view the PetFlow dashboard.',
    actions: {
      appointments: 'Operational schedule',
      billing: 'Billing and next cycle'
    },
    loading: 'Loading the PetFlow operating overview...',
    errors: {
      appointments: 'Unable to load today appointments.',
      plans: 'Unable to load workspace plans.',
      inventory: 'Unable to load workspace inventory.',
      billing: 'Unable to load workspace billing.'
    },
    stats: {
      appointmentsDay: 'Today appointments',
      appointmentsDayDetail: 'in progress and {ready} ready pets to release.',
      recurringVsOneTime: 'Recurring vs one-time',
      recurringVsOneTimeDetail: 'Clear separation between plan clients and standalone visits.',
      pickupMessage: 'Pickup message',
      pickupMessageMissing: 'ready pets still missing client email for automated sending.',
      pickupMessageReady: 'Every ready pet in this list already qualifies for the automated message.',
      penultimateBath: 'Penultimate bath',
      penultimateBathDetail: 'plans expire in the next two weeks.',
      petTaxi: 'Pet taxi',
      petTaxiEmpty: 'No pet taxi extra is visible in today schedule.',
      lowStock: 'Low stock',
      lowStockDetail: 'Items below the reorder point before the operation is affected.',
      nextCycle: 'Next cycle',
      nextCycleDetail: 'next-cycle appointments are already tied to recurring plans.',
      commission: 'Commission / output',
      commissionDetail: 'completed appointments already generated commission this month.'
    },
    queue: {
      title: 'Today operating queue',
      description:
        'Use this queue to tell the daily story: recurring or one-time client, responsible professional, pet taxi, active plan, and projected charge.',
      empty:
        'No appointment is scheduled for today in this workspace. For the demo, it helps to keep at least one recurring, one one-time, and one pet taxi case.',
      pendingProfessional: 'Responsible pending',
      missingProfessional: 'Professional not informed',
      extrasLabel: 'Extras',
      commissionLabel: 'Commission'
    },
    billing: {
      title: 'Renewal and billing',
      description: 'Plans near the end, open charges, and the projected amount for the next cycle.',
      nextCycleLabel: 'Next cycle',
      nextCycleDetail: 'appointments already enter the next cycle as recurring.',
      remainingSessions: 'sessions left',
      expiresAt: 'expires on',
      dueAt: 'Due on',
      balance: 'balance',
      noAlerts: 'No plan or billing alerts right now.'
    },
    inventory: {
      title: 'Stock below threshold',
      description: 'Keep shampoo, retail, and operating consumption visible before losing sales or delaying service.',
      empty: 'No item is currently below the reorder point.',
      sku: 'SKU',
      minimum: 'Minimum',
      reorder: 'reorder at'
    },
    production: {
      title: 'Production by professional',
      description: 'Show monthly output together with projected commission to reinforce the operating story.',
      empty: 'There are not enough completed appointments yet to summarize this month output.',
      completed: 'completed appointments this month'
    },
    pills: {
      recurring: 'Recurring',
      oneTime: 'One-time',
      activePlan: 'Active plan',
      penultimateBath: 'Penultimate bath',
      petTaxi: 'Pet taxi',
      pickupSent: 'Message sent',
      pickupPending: 'Message pending',
      responsible: 'Responsible',
      commission: 'Commission',
      cycleCharge: 'Cycle billing',
      overdue: 'Overdue',
      belowMinimum: 'Below minimum'
    }
  },
  petAppointments: {
    noPermission: 'You do not have permission to view appointments.',
    title: 'Grooming schedule',
    description:
      'Run the banho e tosa queue with recurring versus one-time visibility, multi-service bundles, pet taxi extras, responsible staff, stock usage, and pickup follow-through.',
    actions: {
      switchToList: 'Switch to list',
      switchToCalendar: 'Switch to calendar',
      book: 'Book appointment'
    },
    filters: {
      title: 'Filters',
      description: 'Refine the banho e tosa agenda by status, client, service bundle, and professional.',
      searchPlaceholder: 'Bath, grooming service, status, or notes',
      status: 'Status',
      client: 'Client',
      pet: 'Pet',
      service: 'Service bundle',
      professional: 'Professional',
      activeCountSuffix: 'filter(s) shaping the schedule view.',
      noActive: 'No active filters in the appointment view.'
    },
    focus: {
      title: 'Operating focus',
      description: 'Keep the demo story readable before opening the full queue: recurrence, pet taxi, penultimate bath, pickup, and commission.',
      recurring: 'Recurring',
      recurringDetail: 'Visits already linked to an active plan.',
      oneTime: 'One-time',
      oneTimeDetail: 'Standalone checkouts outside the recurring base.',
      ready: 'Ready',
      readyDetailSuffix: 'with pickup message coverage.',
      planAlerts: 'Plan alerts',
      planAlertsDetail: 'Penultimate bath or final sessions visible in this slice.',
      petTaxi: 'Pet taxi',
      petTaxiDetail: 'Visits already carrying pickup or delivery extras.',
      commission: 'Commission',
      commissionDetail: 'Projected from the appointments visible right now.',
      pickupRule:
        'Completed services automatically trigger the pickup message when the client has an email on file. This makes the "pet ready / message sent" rule explicit in the demo.'
    },
    table: {
      loadingTitle: 'Loading appointments',
      loadingDescription: 'Preparing the schedule with client, pet, and professional context.',
      emptyTitle: 'No appointments yet',
      emptyDescription:
        'Add one recurring client, one one-time visit, a responsible staff member, and an optional pet taxi extra to make the queue commercially convincing.',
      firstAppointment: 'Book first appointment'
    },
    drawer: {
      createTitle: 'Book appointment',
      editTitle: 'Edit appointment',
      description:
        'Select the client and pet, build the service bundle, assign the responsible professional, then confirm one-time or plan-based payment with extras and stock-aware execution.'
    },
    dialog: {
      deleteTitle: 'Remove appointment?',
      deleteDescription: 'The appointment for "{service}" will be removed.',
      confirmDelete: 'Remove'
    },
    formOptions: {
      all: 'All',
      selectClient: 'Select a client',
      selectPet: 'Select a pet',
      selectService: 'Select a bath or grooming service',
      selectProfessional: 'Select a professional',
      selectClientFirst: 'Select a client first',
      loadingPlans: 'Loading plans...',
      oneTime: 'No plan — one-time payment',
      noActivePlan: 'No active plan for this client',
      sessionsLeftSuffix: 'sessions left'
    },
    notices: {
      clients: 'Clients',
      pets: 'Pets',
      services: 'Services',
      professionals: 'Professionals'
    },
    errors: {
      load: 'Unable to load appointments.',
      missingReferences: 'Select client, pet, service, and professional to book the appointment.',
      missingDate: 'Please provide the appointment date and time.',
      save: 'Unable to save appointment.',
      delete: 'Unable to delete appointment.'
    },
    success: {
      updated: 'Appointment updated.',
      created: 'Appointment booked.',
      deleted: 'Appointment removed.'
    },
    statuses: {
      all: 'All statuses',
      scheduled: 'Scheduled',
      confirmed: 'Confirmed',
      inProgress: 'In progress',
      completed: 'Completed',
      canceled: 'Canceled',
      noShow: 'No show'
    },
    form: {
      bookingTitle: 'Banho e tosa booking',
      bookingDescription: 'Client, pet, service bundle, responsible professional, and schedule in one operational step.',
      packageTitle: 'Plan and checkout',
      packageDescription:
        'Link a recurring plan to cover the base grooming service or leave it empty for one-time payment. Add pet taxi, add-ons, or same-day extras.',
      notes: 'Notes',
      notesPlaceholder: 'Visit notes such as sensitive skin or first visit',
      dateTime: 'Date and time',
      packageLabel: 'Plan (optional)',
      packageSelectClient: 'Select a client first to see available plans.',
      packageUnavailable: 'No active plan for this client. The appointment will be charged individually.',
      extrasAmount: 'Extras',
      extrasDescription: 'Extras description',
      extrasPlaceholder: 'E.g. Pet taxi, nail trim, perfume',
      packageCoverageIntro: '1 session will be consumed from this plan when the appointment is marked Completed.',
      packageCoverageExtras: 'Extras of R$ {amount} will be charged separately.',
      packageCoverageFull: 'The base service will be fully covered by the plan.',
      referencesRequired:
        'Before booking, add at least one client, pet, grooming service, and professional. Then return here.',
      save: 'Saving...',
      update: 'Update appointment',
      create: 'Book appointment',
      cancel: 'Cancel'
    },
    columns: {
      service: 'Service bundle',
      scheduled: 'Scheduled',
      status: 'Status',
      plan: 'Plan',
      payment: 'Payment',
      care: 'Clinical notes',
      client: 'Client',
      professional: 'Professional',
      actions: 'Actions',
      responsible: 'Responsible',
      petTaxi: 'Pet taxi',
      petReady: 'Pet ready for pickup.',
      checkoutAfterSlot: 'Checkout and plan consumption follow this slot.',
      pickupSent: 'Pickup message sent automatically',
      pickupSkipped: 'Pickup message skipped: client without email',
      inProgressDetail: 'The responsible professional is currently working on this visit.',
      oneTime: 'One-time',
      chargeCheckout: 'Charge the full service and any extras at checkout.',
      activePlan: 'Active plan',
      linkedPlan: 'This visit is already linked to an active plan.',
      allUsed: 'All used',
      leftSuffix: 'left',
      coveredByPlan: 'Base service covered by plan',
      sessionUsed: 'Session used from plan',
      renewalTriggered: 'Renewal alert triggered',
      serviceAmount: 'Service',
      petTaxiAmount: 'Pet taxi',
      extras: 'Extras',
      totalDue: 'Projected total',
      fullyCovered: 'Fully covered',
      records: 'records',
      vaccines: 'vaccines',
      prescriptions: 'rx',
      recurring: 'Recurring',
      professionalDetail: 'Responsible for the appointment and for the commission outcome.',
      commission: 'Commission',
      pendingSetup: 'pending setup',
      careNotes: 'Care notes',
      continueCare: 'Continue care'
    }
  },
  petPlans: {
    noPermission: 'You do not have permission to view client plans.',
    eyebrow: 'PetFlow · Grooming',
    title: 'Monthly plans',
    description:
      'Manage recurring clients, remaining visits, penultimate bath alerts, and plan usage across grooming appointments.',
    createPlan: 'Create plan',
    watchTitle: 'Renewal watch',
    watchDescription: 'Keep the recurring base visible before the plan runs out or the client misses the next cycle.',
    activePlans: 'Active plans',
    activePlansDetail: 'Recurring clients still covered for future visits.',
    renewSoon: 'Need renewal soon',
    renewSoonDetail: 'Plans with two or fewer sessions left.',
    penultimateBath: 'Penultimate bath',
    penultimateBathDetail: 'This is the key renewal moment in the demo.',
    renewalEmailMissing: 'Renewal email missing',
    renewalEmailMissingDetail: 'Penultimate plans without client email on file.',
    exhaustedWarning: 'exhausted plan(s) already need a new sale or renewal before the next grooming visit.',
    loadingTitle: 'Loading client plans',
    loadingDescription: 'Fetching session packages for this workspace.',
    emptyTitle: 'No client plans yet',
    emptyDescription:
      'Create a recurring package after the routine plan sale. The best demo shows one active client at the penultimate bath with a clear renewal path.',
    firstPlan: 'Create first plan',
    filters: {
      allClients: 'All clients',
      selectClient: 'Select a client',
      noExpiry: 'No expiry'
    },
    validation: {
      selectClient: 'Select a client to create the plan for.',
      positiveSessions: 'Total sessions must be a positive number.'
    },
    feedback: {
      saveError: 'Unable to save plan.',
      removeError: 'Unable to remove plan.'
    },
    columns: {
      noRenewalEmail: 'No email on file for automatic renewal',
      activeLinked: 'Active plan linked to recurring visits.',
      noSessionsLeft: 'Plan has no remaining sessions.',
      used: 'used',
      penultimateAlert: 'Penultimate bath alert',
      finalSession: 'Final session before renewal',
      renewBeforeNextVisit: 'Renew or create a new plan before the next visit.',
      status: 'Status',
      renewalSent: 'Renewal email can be sent automatically',
      renewalNeedsEmail: 'Renewal needs client email',
      expiryAlign: 'Keep this date aligned with the next billing cycle.',
      sessionTrigger: 'Session volume remains the main renewal trigger.',
      actions: 'Actions',
      planNamePlaceholder: 'e.g. 10 grooming sessions'
    },
    form: {
      editTitle: 'Edit plan',
      createTitle: 'Create new plan',
      editDescription: 'Update the plan name, session count, or expiry date.',
      createDescription: 'Link a recurring package to a client. Example: "10 grooming sessions" valid for 6 months.',
      client: 'Client',
      planName: 'Plan name',
      totalSessions: 'Total sessions',
      expiresOn: 'Expires on (optional)',
      save: 'Saving...',
      update: 'Update plan',
      create: 'Create plan',
      cancel: 'Cancel'
    },
    dialog: {
      title: 'Remove this plan?',
      description: '"{name}" will be removed. This cannot be undone.',
      confirm: 'Remove'
    }
  },
  petInventory: {
    noPermission: 'You do not have permission to view PetFlow inventory.',
    eyebrow: 'PetFlow operations',
    title: 'Stock and replenishment',
    description:
      'Keep bath, grooming, and retail stock visible with below-minimum alerts, replenishment context, and movement history the team can trust.',
    openProducts: 'Open products',
    recordMovement: 'Record movement',
    watchTitle: 'Stock health watchlist',
    watchDescription:
      'Keep the most important replenishment risks visible before they become service delays, lost add-on sales, or rushed purchases.',
    movementTypes: {
      all: 'All movement types',
      inbound: 'Inbound',
      outbound: 'Outbound'
    },
    sourceTypes: {
      manual: 'Manual adjustment',
      retailSale: 'Retail sale',
      clinicalConsumption: 'Bath and grooming consumption',
      productSync: 'Product catalog sync',
      maintenanceConsumption: 'Operational consumption',
      stockReplacement: 'Stock replacement',
      catalogSync: 'Catalog sync',
      unknown: 'Unknown source'
    },
    health: {
      belowMinimum: 'Below minimum',
      reorderNow: 'Reorder now',
      healthy: 'Healthy stock',
      belowMinimumDetail: 'Below minimum {value} {unit}.',
      reorderNowDetail: 'At or below reorder point {value} {unit}.',
      healthyDetail: 'Stock is currently above the replenishment threshold.'
    },
    summary: {
      trackedLabel: 'Products tracked',
      trackedDetail: 'Catalog items already visible for grooming consumption, reception, and retail support.',
      belowMinimumLabel: 'Below minimum',
      belowMinimumDetail: 'These items can already pressure the next grooming cycle or front-desk sale.',
      belowMinimumSafe: 'No product is currently below the minimum threshold.',
      reorderLabel: 'Reorder now',
      reorderDetail: 'These products are at or below the replenishment point and should not wait for the next count.',
      reorderSafe: 'No product is currently at the reorder point.',
      outboundLabel: 'Outbound movements',
      filteredDetail: 'Count reflects the filtered operational view.',
      visibleQuantityDetail: 'Visible stock movement quantity on this page: {value} unit(s).'
    },
    lookup: {
      productsLabel: 'Products',
      healthWarning: 'Product lookup access is required to calculate stock health and low-stock signals.',
      movementWarning: 'Product lookup access is required before recording stock movement safely.'
    },
    validation: {
      selectProduct: 'Select a product and enter a valid quantity.'
    },
    feedback: {
      loadError: 'Unable to load inventory movements.',
      saveError: 'Unable to save the inventory movement.',
      deleteError: 'Unable to delete the selected movement.',
      created: 'Inventory movement created successfully.',
      updated: 'Inventory movement updated successfully.',
      removed: 'Inventory movement removed successfully.',
      healthy: 'No product is currently below the reorder point. The shared inventory catalog looks operationally healthy right now.',
      criticalWarning: '{count} product(s) already fell below the minimum quantity threshold and should be replenished before the next busy day.'
    },
    filters: {
      title: 'Inventory filters',
      description: 'Slice the movement ledger by product or direction while keeping the operational context attached to each change.',
      searchLabel: 'Search',
      searchPlaceholder: 'Reason, note, source, or product',
      productLabel: 'Product',
      directionLabel: 'Direction',
      apply: 'Apply filters',
      clear: 'Clear filters',
      allProducts: 'All products',
      selectProduct: 'Select a product'
    },
    form: {
      createTitle: 'Record stock movement',
      editTitle: 'Adjust stock movement',
      description: 'Capture the operational reason behind each stock change so inventory discussions stay grounded in a real business event.',
      productLabel: 'Product',
      directionLabel: 'Direction',
      quantityLabel: 'Quantity',
      noteLabel: 'Operational note',
      notePlaceholder: 'Shampoo used in bath, retail sale, manual count correction...',
      reminderTitle: 'Operator reminder',
      reminderDescription: 'Keep the movement reason explicit so reception, grooming execution, stock control, and billing stay aligned during the demo.',
      saving: 'Saving movement...',
      update: 'Update movement',
      create: 'Create movement',
      cancel: 'Cancel edit'
    },
    ledger: {
      title: 'Inventory ledger',
      description: 'Review what changed, why it changed, and how it affected the visible on-hand balance for the selected product set.',
      loadingTitle: 'Loading inventory operations',
      loadingDescription: 'Preparing the most recent shared inventory movement history for this PetFlow workspace.',
      emptyTitle: 'No inventory movement recorded yet',
      emptyDescription: 'Record the first sale, grooming consumption, manual count correction, or replenishment so stock availability becomes operationally real in the demo.',
      firstMovement: 'Record first movement'
    },
    columns: {
      recorded: 'Recorded',
      updated: 'Updated',
      product: 'Product',
      movement: 'Movement',
      source: 'Source',
      balanceImpact: 'Balance impact',
      actions: 'Actions',
      stockLine: 'Stock {quantity} {unit} · Reorder at {reorder}',
      returnedLine: 'Stock returned to the shelf or was replenished.',
      outboundLine: 'Stock left the shelf for sale, use, or correction.',
      noOperationalNote: 'No operational note recorded.',
      reasonDetail: 'Keep this reason explicit so billing, stock, and service teams read the same story.',
      balanceChanged: 'Visible on-hand balance changed by {quantity} unit(s).',
      unit: 'unit',
      units: 'units'
    },
    dialog: {
      title: 'Delete movement?',
      description: 'The product stock will be recalculated automatically after this inventory movement is removed.'
    }
  },
  petProfessionals: {
    noPermission: 'You do not have permission to view team members.',
    eyebrow: 'PetFlow workspace',
    title: 'Professionals and commission',
    description:
      'Keep groomers and attendants visible with operational ownership, commission rules, and current-month payout context.',
    openSummary: 'Open commission summary',
    snapshotTitle: 'Commission snapshot',
    snapshotDescription:
      'Use this summary to explain who is configured, who already generated commission, and what is projected this month.',
    feedback: {
      loadError: 'Unable to load team members.',
      saveError: 'Unable to save professional.',
      deleteError: 'Unable to delete professional.',
      created: 'Professional added.',
      updated: 'Professional updated.',
      removed: 'Professional removed.'
    },
    metrics: {
      professionals: 'Professionals',
      configured: 'Commission configured',
      projected: 'Projected this month',
      needSetup: 'Need setup',
      loading: 'Loading...'
    },
    warnings: {
      pendingSetup: '{count} professional(s) still need a commission rule before the full production story is ready for the demo.'
    },
    search: {
      placeholder: 'Name, specialty, phone, or email',
      apply: 'Search',
      clear: 'Clear'
    },
    columns: {
      professional: 'Professional',
      contact: 'Contact',
      commission: 'Commission',
      status: 'Operational status',
      actions: 'Actions',
      defaultSpecialty: 'General grooming and front-desk support',
      noEmail: 'No email on file',
      noPhone: 'No phone on file',
      noCompletedServices: 'No completed services this month',
      ruleVisible: 'Commission rule already visible for the demo.',
      defineRate: 'Define the rate before the next completed appointment.',
      needsSetup: 'Needs commission setup',
      alreadyGenerating: 'Already generating commission this month',
      readyForNextVisit: 'Ready for the next completed visit'
    },
    form: {
      name: 'Name',
      specialty: 'Specialty',
      licenseNumber: 'License number',
      phone: 'Phone',
      email: 'Email',
      commissionRate: 'Commission rate (%)',
      commissionRatePlaceholder: 'e.g. 15',
      reminderTitle: 'Commission reminder',
      reminderDescription: 'Use this rate to explain who performed the service, who is responsible for the result, and how commission is projected after completion.',
      saving: 'Saving...',
      update: 'Update professional',
      create: 'Add professional',
      cancel: 'Cancel'
    },
    table: {
      emptyTitle: 'No team members found',
      emptyDescription: 'Add the first groomer or attendant so appointments can show a clear responsible professional and projected commission.',
      addFirst: 'Add first professional'
    },
    dialog: {
      title: 'Remove team member?',
      description: '"{name}" will be removed from this workspace.'
    }
  },
  petFinance: {
    eyebrow: 'Financial Management',
    title: 'Cash and Finance',
    description: 'Track income, expenses, payments, and the cash flow of your petshop.',
    noPermission: 'You do not have permission to access the financial module.',
    loading: 'Loading financial data...',
    actions: {
      newMovement: 'New movement',
      newInvoice: 'New invoice',
      viewReport: 'View report',
      exportData: 'Export'
    },
    stats: {
      todayBalance: 'Today balance',
      todayIncome: 'Today income',
      todayExpenses: 'Today expenses',
      pendingPayments: 'Pending payments',
      monthRevenue: 'Month revenue',
      openInvoices: 'Open invoices'
    },
    cashMovements: {
      title: 'Cash movements',
      description: 'History of cash inflows and outflows.',
      empty: 'No movements recorded today.',
      emptyDescription: 'Record the first inflow or outflow to start tracking.',
      inbound: 'Inbound',
      outbound: 'Outbound',
      categories: {
        sale: 'Sale',
        service: 'Service',
        refund: 'Refund',
        expense: 'Expense',
        withdrawal: 'Withdrawal',
        deposit: 'Deposit',
        adjustment: 'Adjustment',
        other: 'Other'
      }
    },
    invoices: {
      title: 'Recent invoices',
      description: 'Track the status of issued invoices.',
      empty: 'No invoices found.',
      status: {
        draft: 'Draft',
        issued: 'Issued',
        paid: 'Paid',
        partiallyPaid: 'Partially paid',
        overdue: 'Overdue',
        canceled: 'Canceled'
      }
    },
    payments: {
      title: 'Recent payments',
      description: 'Latest payments received.',
      empty: 'No payments recorded.',
      methods: {
        cash: 'Cash',
        credit: 'Credit',
        debit: 'Debit',
        pix: 'PIX',
        transfer: 'Transfer',
        check: 'Check',
        other: 'Other'
      }
    },
    form: {
      direction: 'Direction',
      category: 'Category',
      amount: 'Amount',
      description: 'Description',
      descriptionPlaceholder: 'Describe the movement...',
      date: 'Date',
      save: 'Save',
      cancel: 'Cancel'
    },
    filters: {
      title: 'Filters',
      period: 'Period',
      direction: 'Direction',
      category: 'Category',
      today: 'Today',
      thisWeek: 'This week',
      thisMonth: 'This month',
      lastMonth: 'Last month',
      allDirections: 'All directions',
      allCategories: 'All categories'
    }
  },
  petTimeline: {
    eyebrow: 'Clinical History',
    title: 'Pet Timeline',
    description: 'Complete history of appointments, vaccinations, medical records, and prescriptions.',
    noPermission: 'You do not have permission to view the clinical history.',
    loading: 'Loading clinical history...',
    petNotFound: 'Pet not found.',
    backToPets: 'Back to pets',
    filters: {
      title: 'Filters',
      allTypes: 'All types',
      period: 'Period',
      allTime: 'All time',
      lastWeek: 'Last week',
      lastMonth: 'Last month',
      last3Months: 'Last 3 months',
      lastYear: 'Last year'
    },
    events: {
      empty: 'No clinical events recorded for this pet.',
      emptyDescription: 'Register medical records, vaccinations, or prescriptions to build the clinical history.',
      medicalRecord: 'Medical Record',
      vaccination: 'Vaccination',
      prescription: 'Prescription',
      appointment: 'Appointment'
    },
    sections: {
      summary: 'Clinical summary',
      vaccinations: 'Vaccination card',
      prescriptions: 'Recent prescriptions',
      records: 'Medical records'
    },
    stats: {
      totalEvents: 'Total events',
      vaccinations: 'Vaccines applied',
      records: 'Medical records',
      prescriptions: 'Prescriptions',
      lastVisit: 'Last visit'
    },
    actions: {
      addRecord: 'New record',
      addVaccine: 'Add vaccine',
      addPrescription: 'New prescription',
      viewDetails: 'View details',
      printHistory: 'Print history'
    }
  },
  petPOS: {
    eyebrow: 'Point of Sale',
    title: 'POS - Sales',
    description: 'Quick interface for selling products and services at the petshop counter.',
    noPermission: 'You do not have permission to access the POS.',
    loading: 'Loading products...',
    actions: {
      newSale: 'New sale',
      checkout: 'Checkout',
      cancel: 'Cancel',
      addItem: 'Add',
      removeItem: 'Remove',
      clearCart: 'Clear cart'
    },
    cart: {
      title: 'Cart',
      empty: 'Cart is empty',
      emptyDescription: 'Add products or services to start a sale.',
      items: 'items',
      subtotal: 'Subtotal',
      discount: 'Discount',
      total: 'Total',
      quantity: 'Qty'
    },
    products: {
      title: 'Products',
      search: 'Search product...',
      category: 'Category',
      allCategories: 'All categories',
      empty: 'No products found.',
      inStock: 'In stock',
      outOfStock: 'Out of stock',
      lowStock: 'Low stock'
    },
    services: {
      title: 'Services',
      empty: 'No services registered.'
    },
    client: {
      title: 'Client',
      select: 'Select client',
      search: 'Search client...',
      noClient: 'Sale without client',
      selected: 'Client selected'
    },
    payment: {
      title: 'Payment',
      method: 'Payment method',
      methods: {
        cash: 'Cash',
        credit: 'Credit',
        debit: 'Debit',
        pix: 'PIX',
        transfer: 'Transfer'
      },
      received: 'Amount received',
      change: 'Change'
    },
    checkout: {
      title: 'Checkout',
      description: 'Review items and select payment method.',
      confirm: 'Confirm sale',
      processing: 'Processing...',
      success: 'Sale completed successfully!',
      error: 'Error processing sale.',
      printReceipt: 'Print receipt'
    },
    stats: {
      todaySales: 'Today sales',
      todayRevenue: 'Today revenue',
      avgTicket: 'Average ticket',
      itemsSold: 'Items sold'
    }
  },
  petClinic: {
    eyebrow: 'Veterinary Clinic',
    title: 'Clinical Dashboard',
    description: 'Track clinical appointments, pending vaccinations, medical records, and prescriptions in one operational view.',
    noPermission: 'You do not have permission to view the clinical dashboard.',
    loading: 'Loading the clinical overview...',
    actions: {
      viewTimeline: 'View timeline',
      newRecord: 'New record',
      newVaccination: 'Add vaccination',
      newPrescription: 'New prescription'
    },
    stats: {
      clinicalAppointments: 'Clinical appointments',
      clinicalAppointmentsDetail: 'consultations and procedures today',
      pendingVaccinations: 'Pending vaccinations',
      pendingVaccinationsDetail: 'next 14 days',
      todayRecords: 'Today records',
      todayRecordsDetail: 'clinical records created',
      activePrescriptions: 'Active prescriptions',
      activePrescriptionsDetail: 'last 30 days'
    },
    vaccinations: {
      title: 'Pending vaccinations',
      description: 'Pets with vaccinations due soon or already overdue',
      empty: 'No pending vaccinations in the next 14 days.',
      dueIn: 'Due in {days} days',
      dueToday: 'Due today',
      overdue: 'Overdue by {days} days',
      scheduleAction: 'Schedule',
      viewPet: 'View pet'
    },
    timeline: {
      title: 'Recent clinical timeline',
      description: 'Latest clinical events recorded',
      viewAll: 'View full timeline',
      empty: 'No clinical events recorded.',
      types: {
        medicalRecord: 'Medical Record',
        vaccination: 'Vaccination',
        prescription: 'Prescription'
      }
    },
    appointments: {
      title: 'Clinical appointments today',
      description: 'Scheduled veterinary consultations and procedures',
      empty: 'No clinical appointments scheduled for today.'
    },
    errors: {
      timeline: 'Unable to load the clinical timeline.',
      vaccinations: 'Unable to load pending vaccinations.',
      records: 'Unable to load medical records.',
      prescriptions: 'Unable to load prescriptions.'
    }
  },
  petInvoices: {
    noPermission: 'You do not have permission to view PetFlow invoices.',
    title: 'Billing and next cycle',
    description:
      'Show how PetFlow services become invoices, payments, and a clear preview of the next monthly cycle.',
    filtersTitle: 'Invoice filters',
    filtersDescription:
      'Refine the finance list by client or lifecycle without losing the commercial story behind each document.',
    nextCycleTitle: 'Next cycle billing preview',
    pipelineTitle: 'Billing pipeline',
    pipelineDescription: 'Review invoice status, open balance, and the finance record behind each PetFlow charge.'
  }
};
