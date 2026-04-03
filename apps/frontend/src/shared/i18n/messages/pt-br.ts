type DeepWiden<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? readonly DeepWiden<U>[]
    : T extends object
      ? { [K in keyof T]: DeepWiden<T[K]> }
      : T;

const ptBRMessages = {
  common: {
    localeLabel: 'Idioma',
    buttons: {
      search: 'Buscar',
      clear: 'Limpar',
      edit: 'Editar',
      delete: 'Excluir',
      cancel: 'Cancelar',
      create: 'Criar',
      update: 'Atualizar',
      save: 'Salvar',
      remove: 'Remover',
      open: 'Abrir'
    }
  },
  publicShell: {
    brandEyebrow: 'PhaifferTech',
    brandTitle: 'PetFlow para operacoes pet reais',
    brandSubtitle:
      'Software para banho e tosa, recorrencia mensal e operacao de pet shop com base tecnica solida.',
    localeLabel: 'Alternar idioma do site',
    navHome: 'Início',
    navPlatform: 'Plataforma',
    navProducts: 'Produtos',
    navContact: 'Contato',
    navLogin: 'Acesso PetFlow',
    navLabel: 'Navegação',
    footerNarrativeText:
      'PhaifferTech apresenta o PetFlow como produto principal para agenda, planos mensais, estoque e cobranca de operacoes pet.',
    footerProductsTitle: 'Produtos',
    footerAccessTitle: 'Acesso',
    footerPlatformLabel: 'Fundação da plataforma',
    footerDemoLabel: 'Solicitar demo',
    footerCopyright:
      'PhaifferTech · PetFlow para banho e tosa, pet shop e operacao recorrente, sustentado por fundacao SaaS multi-tenant.'
  },
  publicHome: {
    framework: 'Soluções',
    productLanes: 'Frentes operacionais',
    expertiseEyebrow: 'Porque a demo convence'
  },
  publicHero: {
    panelEyebrow: 'Demo PetFlow',
    panelTitle: 'Foco operacional',
    panelBadge: 'Pronto para apresentar',
    storyEyebrow: 'Roteiro da demo',
    storyText:
      'Mostre o ciclo completo com o PetFlow no centro: atendimento, plano recorrente, pressão de estoque, cobrança e follow-up automatizado.'
  },
  login: {
    title: 'Acessar workspace',
    description: 'Entre com o workspace e suas credenciais para abrir o PetFlow.',
    tenantCodeLabel: 'Empresa ou workspace',
    emailLabel: 'E-mail',
    passwordLabel: 'Senha',
    submitLabel: 'Entrar',
    loadingLabel: 'Entrando...',
    errorFallback: 'Falha inesperada ao autenticar.',
    forgotPasswordLabel: 'Esqueci minha senha',
    demoActionLabel: 'Usar demo',
    signedOutNotice: 'Sua sessão foi encerrada com sucesso.',
    sessionExpiredNotice: 'Sua sessão expirou. Entre novamente para continuar.',
    tenantMismatchNotice: 'A sessão ativa ficou inconsistente com o workspace atual. Entre novamente para restaurar o contexto.',
    passwordChangedNotice: 'Senha atualizada com sucesso. Entre novamente com a nova credencial.',
    passwordResetNotice: 'Senha redefinida com sucesso. Entre novamente com a nova credencial.',
    support: {
      eyebrow: 'Acesso ao produto',
      title: 'Entre no seu workspace.',
      description:
        'Use o código do workspace e suas credenciais para abrir a operação sem sair da linguagem visual do produto.',
      backLabel: 'Voltar ao site',
      contactLabel: 'Solicitar demo',
      heroTitle: 'PetFlow pronto para abrir a operacao do dia.',
      heroDescription:
        'Agenda, planos, cobranca e follow-up continuam na mesma linguagem visual do produto, sem distracao e sem uma landing pesada no meio do acesso.',
      laneQueueTitle: 'Fila',
      laneQueueDescription: 'Atendimentos e pets prontos com profissional responsavel.',
      lanePlansTitle: 'Planos',
      lanePlansDescription: 'Recorrencia mensal, penultimo banho e renovacao no radar.',
      laneBillingTitle: 'Cobranca',
      laneBillingDescription: 'Extras, estoque e comissao sem sair do fluxo comercial.',
      accessCardTitle: 'Acesso PetFlow',
      accessCardDescription:
        'O login mantém o foco no acesso enquanto preserva a atmosfera premium do produto e da demo.'
    }
  },
  appShell: {
    mobileOverview: 'Visão geral',
    mobilePetFlow: 'PetFlow',
    mobileSettings: 'Configurações',
    quickSearchWorkspace: 'Buscar no workspace',
    quickSearchPet: 'Buscar atendimentos, clientes ou cobrança',
    localeButtonLabel: 'Alternar idioma',
    header: {
      crmLabel: 'Relacionamento',
      crmDescription: 'Faixa de continuidade para follow-up, contexto comercial e histórico herdado enquanto o PetFlow absorve a operação.',
      petLabel: 'PetFlow',
      petDescription: 'Fila do dia, planos, estoque, cobrança e responsabilidade do time em uma única frente.',
      workspacesLabel: 'Workspaces',
      workspacesDescription: 'Gerencie a camada de workspaces sem expandir a superfície visível do produto.',
      usersLabel: 'Usuários',
      usersDescription: 'Mantenha o acesso interno e a alocação de papéis sob controle.',
      settingsLabel: 'Configurações',
      settingsDescription: 'Branding, acesso e configuração do workspace atual.',
      platformLabel: 'Plataforma',
      petOverviewLabel: 'Visão geral do PetFlow',
      overviewLabel: 'Visão geral',
      petOverviewDescription:
        'Plataforma comercial da demo PetFlow com contexto operacional no centro da leitura.',
      overviewDescription: 'Resumo compartilhado do workspace com a superfície visível atual.'
    }
  },
  sidebar: {
    overview: 'Visão geral',
    settings: 'Configurações',
    petFlow: 'PetFlow',
    focusLabel: 'Foco PetFlow',
    workspaceLabel: 'Workspace',
    signOut: 'Sair'
  },
  petSubnav: {
    workspace: 'Workspace',
    dashboard: 'Dashboard',
    clients: 'Clientes',
    pets: 'Pets',
    appointments: 'Atendimentos',
    followUp: 'Follow-up',
    clinic: 'Clínica',
    pos: 'PDV',
    finance: 'Financeiro',
    plans: 'Planos',
    inventory: 'Estoque',
    invoices: 'Cobranca',
    professionals: 'Equipe'
  },
  dashboardRoutes: {
    mainEyebrow: 'PetFlow',
    mainTitle: 'Visão geral do PetFlow',
    mainDescription:
      'Visão principal da demo com atendimentos do dia, planos perto do fim, estoque baixo, cobrança do próximo ciclo e comissão do time.',
    surfaceLabel: 'Superfície oficial da demo',
    petDashboardEyebrow: 'Dashboard PetFlow',
    petDashboardTitle: 'Dashboard operacional',
    petDashboardDescription:
      'Acompanhe fila do dia, pets prontos, recorrencia, estoque baixo, cobranca do proximo ciclo e comissao em uma unica leitura operacional.'
  },
  petDashboard: {
    noPermission: 'Você não possui permissão para visualizar o dashboard do PetFlow.',
    actions: {
      appointments: 'Agenda operacional',
      billing: 'Cobranca e proximo ciclo'
    },
    loading: 'Carregando o panorama operacional do PetFlow...',
    errors: {
      appointments: 'Nao foi possivel carregar os atendimentos do dia.',
      plans: 'Nao foi possivel carregar os planos do workspace.',
      inventory: 'Nao foi possivel carregar o estoque do workspace.',
      billing: 'Nao foi possivel carregar a cobranca do workspace.'
    },
    stats: {
      appointmentsDay: 'Atendimentos do dia',
      appointmentsDayDetail: 'em andamento e {ready} pets prontos para liberar.',
      recurringVsOneTime: 'Recorrentes vs avulsos',
      recurringVsOneTimeDetail: 'Separacao visivel entre clientes de plano e atendimentos pontuais.',
      pickupMessage: 'Mensagem de retirada',
      pickupMessageMissing: 'pets prontos ainda sem email do cliente para o envio automatico.',
      pickupMessageReady: 'Todos os pets prontos desta lista ja entram com mensagem automatica.',
      penultimateBath: 'Penultimo banho',
      penultimateBathDetail: 'planos expiram nas proximas duas semanas.',
      petTaxi: 'Pet taxi',
      petTaxiEmpty: 'Nenhum extra de pet taxi visivel na agenda de hoje.',
      lowStock: 'Estoque baixo',
      lowStockDetail: 'Itens abaixo do ponto de reposicao antes de comprometer a operacao.',
      nextCycle: 'Proximo ciclo',
      nextCycleDetail: 'atendimentos do proximo ciclo ja estao conectados a planos recorrentes.',
      commission: 'Comissao / producao',
      commissionDetail: 'atendimentos concluidos ja geraram comissao neste mes.'
    },
    queue: {
      title: 'Fila operacional de hoje',
      description:
        'Use esta fila para contar a historia do dia: cliente recorrente ou avulso, profissional responsavel, pet taxi, plano ativo e valor previsto.',
      empty:
        'Nenhum atendimento esta agendado para hoje neste workspace. Para a demo, vale montar pelo menos um recorrente, um avulso e um caso com pet taxi.',
      pendingProfessional: 'Responsavel pendente',
      missingProfessional: 'Profissional nao informado',
      extrasLabel: 'Extras',
      commissionLabel: 'Comissao'
    },
    billing: {
      title: 'Renovacao e cobranca',
      description: 'Planos perto do fim, cobrancas em aberto e o valor projetado para o proximo ciclo.',
      nextCycleLabel: 'Proximo ciclo',
      nextCycleDetail: 'atendimentos ja entram como recorrentes no proximo ciclo.',
      remainingSessions: 'sessoes restantes',
      expiresAt: 'expira em',
      dueAt: 'Vence em',
      balance: 'saldo',
      noAlerts: 'Sem alertas de plano ou cobranca neste momento.'
    },
    inventory: {
      title: 'Estoque abaixo do ponto',
      description: 'Mantenha shampoo, loja e consumo operacional visiveis antes de perder venda ou atrasar atendimento.',
      empty: 'Nenhum item esta abaixo do ponto de reposicao agora.',
      sku: 'SKU',
      minimum: 'Minimo',
      reorder: 'reposicao em'
    },
    production: {
      title: 'Producao por profissional',
      description: 'Mostre a producao do mes junto com a comissao prevista para reforcar a historia operacional.',
      empty: 'Ainda nao ha atendimentos concluidos suficientes para resumir a producao deste mes.',
      completed: 'atendimentos concluidos neste mes'
    },
    pills: {
      recurring: 'Recorrente',
      oneTime: 'Avulso',
      activePlan: 'Plano ativo',
      penultimateBath: 'Penultimo banho',
      petTaxi: 'Pet taxi',
      pickupSent: 'Mensagem enviada',
      pickupPending: 'Mensagem pendente',
      responsible: 'Responsavel',
      commission: 'Comissao',
      cycleCharge: 'Cobranca do ciclo',
      overdue: 'Em atraso',
      belowMinimum: 'Abaixo do minimo'
    }
  },
  petAppointments: {
    noPermission: 'Você não tem permissão para visualizar atendimentos.',
    title: 'Atendimentos',
    description:
      'Organize a fila de banho e tosa com visibilidade de recorrentes e avulsos, extras de pet taxi, responsável e follow-up de retirada.',
    actions: {
      switchToList: 'Ver lista',
      switchToCalendar: 'Ver calendario',
      book: 'Agendar atendimento'
    },
    filters: {
      title: 'Filtros',
      description: 'Refine a agenda por status, cliente, servico e profissional.',
      searchPlaceholder: 'Servico, status ou observacoes',
      status: 'Status',
      client: 'Cliente',
      pet: 'Pet',
      service: 'Servico',
      professional: 'Profissional',
      activeCountSuffix: 'filtro(s) moldando a visao da agenda.',
      noActive: 'Nenhum filtro ativo na visao de atendimentos.'
    },
    focus: {
      title: 'Foco operacional',
      description: 'Mantenha a historia da demo clara antes de abrir a fila completa: recorrencia, pet taxi, penultimo banho, retirada e comissao.',
      recurring: 'Recorrentes',
      recurringDetail: 'Visitas ja vinculadas a um plano ativo.',
      oneTime: 'Avulsos',
      oneTimeDetail: 'Checkouts fora da base recorrente.',
      ready: 'Prontos',
      readyDetailSuffix: 'com cobertura de mensagem de retirada.',
      planAlerts: 'Alertas de plano',
      planAlertsDetail: 'Penultimo banho ou sessoes finais visiveis neste recorte.',
      petTaxi: 'Pet taxi',
      petTaxiDetail: 'Atendimentos com extra de coleta ou entrega.',
      commission: 'Comissao',
      commissionDetail: 'Projetada sobre os atendimentos visiveis agora.',
      pickupRule:
        'Atendimentos concluidos disparam a mensagem de retirada quando o cliente tem e-mail cadastrado. Isso deixa a regra de "pet pronto / mensagem enviada" explicita na demo.'
    },
    table: {
      loadingTitle: 'Carregando atendimentos',
      loadingDescription: 'Preparando a agenda com contexto de cliente, pet e profissional.',
      emptyTitle: 'Nenhum atendimento ainda',
      emptyDescription:
        'Cadastre um recorrente, um avulso, um profissional responsavel e um extra opcional de pet taxi para deixar a fila comercialmente convincente.',
      firstAppointment: 'Agendar primeiro atendimento'
    },
    drawer: {
      createTitle: 'Agendar atendimento',
      editTitle: 'Editar atendimento',
      description:
        'Selecione cliente e pet, escolha servico e profissional e depois defina pagamento avulso ou por plano com os extras do dia.'
    },
    dialog: {
      deleteTitle: 'Remover atendimento?',
      deleteDescription: 'O atendimento de "{service}" sera removido.',
      confirmDelete: 'Remover'
    },
    formOptions: {
      all: 'Todos',
      selectClient: 'Selecione um cliente',
      selectPet: 'Selecione um pet',
      selectService: 'Selecione um servico',
      selectProfessional: 'Selecione um profissional',
      selectClientFirst: 'Selecione um cliente primeiro',
      loadingPlans: 'Carregando planos...',
      oneTime: 'Sem plano — pagamento avulso',
      noActivePlan: 'Nenhum plano ativo para este cliente',
      sessionsLeftSuffix: 'sessoes restantes'
    },
    notices: {
      clients: 'Clientes',
      pets: 'Pets',
      services: 'Servicos',
      professionals: 'Profissionais'
    },
    errors: {
      load: 'Nao foi possivel carregar os atendimentos.',
      missingReferences: 'Selecione cliente, pet, servico e profissional para agendar o atendimento.',
      missingDate: 'Informe a data e a hora do atendimento.',
      save: 'Nao foi possivel salvar o atendimento.',
      delete: 'Nao foi possivel excluir o atendimento.'
    },
    success: {
      updated: 'Atendimento atualizado.',
      created: 'Atendimento agendado.',
      deleted: 'Atendimento removido.'
    },
    statuses: {
      all: 'Todos os status',
      scheduled: 'Agendado',
      confirmed: 'Confirmado',
      inProgress: 'Em andamento',
      completed: 'Concluido',
      canceled: 'Cancelado',
      noShow: 'Nao compareceu'
    },
    form: {
      bookingTitle: 'Agendamento',
      bookingDescription: 'Quem, o que e quando: o nucleo do atendimento.',
      packageTitle: 'Plano e checkout',
      packageDescription:
        'Vincule um plano para cobrir o servico base ou deixe vazio para um pagamento avulso. Adicione extras cobrados hoje.',
      notes: 'Observacoes',
      notesPlaceholder: 'Observacoes da visita, como pele sensivel ou primeiro atendimento',
      dateTime: 'Data e hora',
      packageLabel: 'Plano (opcional)',
      packageSelectClient: 'Selecione um cliente primeiro para ver os planos disponiveis.',
      packageUnavailable: 'Nenhum plano ativo para este cliente. O atendimento sera cobrado de forma avulsa.',
      extrasAmount: 'Extras (R$)',
      extrasDescription: 'Descricao dos extras',
      extrasPlaceholder: 'Ex.: Pet taxi, corte de unhas, perfume',
      packageCoverageIntro: '1 sessao sera consumida deste plano quando o atendimento for marcado como Concluido.',
      packageCoverageExtras: 'Extras de R$ {amount} serao cobrados separadamente.',
      packageCoverageFull: 'O servico base ficara totalmente coberto pelo plano.',
      referencesRequired:
        'Antes de agendar, cadastre pelo menos um cliente, um pet, um servico e um profissional. Depois volte aqui.',
      save: 'Salvando...',
      update: 'Atualizar atendimento',
      create: 'Agendar atendimento',
      cancel: 'Cancelar'
    },
    columns: {
      service: 'Servico',
      scheduled: 'Agendado',
      status: 'Status',
      plan: 'Plano',
      payment: 'Pagamento',
      care: 'Atendimento',
      client: 'Cliente',
      professional: 'Profissional',
      actions: 'Acoes',
      responsible: 'Responsavel',
      petTaxi: 'Pet taxi',
      petReady: 'Pet pronto para retirada.',
      checkoutAfterSlot: 'Checkout e consumo de plano acompanham este horario.',
      pickupSent: 'Mensagem de retirada enviada automaticamente',
      pickupSkipped: 'Mensagem de retirada ignorada: cliente sem e-mail',
      inProgressDetail: 'O profissional responsavel esta atuando neste atendimento.',
      oneTime: 'Avulso',
      chargeCheckout: 'Cobre o servico completo e os extras no checkout.',
      activePlan: 'Plano ativo',
      linkedPlan: 'Este atendimento ja esta vinculado a um plano ativo.',
      allUsed: 'Todas usadas',
      leftSuffix: 'restantes',
      coveredByPlan: 'Servico base coberto pelo plano',
      sessionUsed: 'Sessao consumida do plano',
      renewalTriggered: 'Alerta de renovacao disparado',
      serviceAmount: 'Servico',
      petTaxiAmount: 'Pet taxi',
      extras: 'Extras',
      totalDue: 'Total previsto',
      fullyCovered: 'Totalmente coberto',
      records: 'registros',
      vaccines: 'vacinas',
      prescriptions: 'rx',
      recurring: 'Recorrente',
      professionalDetail: 'Responsavel pelo atendimento e pelo resultado da comissao.',
      commission: 'Comissao',
      pendingSetup: 'configuracao pendente',
      careNotes: 'Notas do atendimento',
      continueCare: 'Continuar atendimento'
    }
  },
  petPlans: {
    noPermission: 'Você não tem permissão para visualizar planos de clientes.',
    eyebrow: 'PetFlow · Banho e tosa',
    title: 'Planos mensais',
    description:
      'Gerencie clientes recorrentes, visitas restantes, alertas de penultimo banho e uso dos planos ao longo dos atendimentos.',
    createPlan: 'Criar plano',
    watchTitle: 'Radar de renovacao',
    watchDescription: 'Mantenha a base recorrente visivel antes de o plano acabar ou o cliente perder o proximo ciclo.',
    activePlans: 'Planos ativos',
    activePlansDetail: 'Clientes recorrentes ainda cobertos para os proximos atendimentos.',
    renewSoon: 'Renovar em breve',
    renewSoonDetail: 'Planos com duas ou menos sessoes restantes.',
    penultimateBath: 'Penultimo banho',
    penultimateBathDetail: 'Este e o principal momento de renovacao na demo.',
    renewalEmailMissing: 'E-mail de renovacao faltando',
    renewalEmailMissingDetail: 'Planos em penultimo banho sem e-mail cadastrado.',
    exhaustedWarning: 'plano(s) esgotado(s) ja precisa(m) de nova venda ou renovacao antes do proximo banho.',
    loadingTitle: 'Carregando planos de clientes',
    loadingDescription: 'Buscando pacotes de sessoes deste workspace.',
    emptyTitle: 'Nenhum plano de cliente ainda',
    emptyDescription:
      'Crie um pacote recorrente depois da venda do plano. A melhor demo mostra um cliente ativo no penultimo banho com caminho claro de renovacao.',
    firstPlan: 'Criar primeiro plano',
    filters: {
      allClients: 'Todos os clientes',
      selectClient: 'Selecione um cliente',
      noExpiry: 'Sem vencimento'
    },
    validation: {
      selectClient: 'Selecione um cliente para criar o plano.',
      positiveSessions: 'O total de sessoes deve ser maior que zero.'
    },
    feedback: {
      saveError: 'Nao foi possivel salvar o plano.',
      removeError: 'Nao foi possivel remover o plano.'
    },
    columns: {
      noRenewalEmail: 'Sem e-mail para renovacao automatica',
      activeLinked: 'Plano ativo vinculado a visitas recorrentes.',
      noSessionsLeft: 'Plano sem sessoes restantes.',
      used: 'utilizadas',
      penultimateAlert: 'Alerta de penultimo banho',
      finalSession: 'Ultima sessao antes da renovacao',
      renewBeforeNextVisit: 'Renove ou crie um novo plano antes da proxima visita.',
      status: 'Status',
      renewalSent: 'E-mail de renovacao pode ser enviado automaticamente',
      renewalNeedsEmail: 'Renovacao depende de e-mail do cliente',
      expiryAlign: 'Alinhe esta data com o proximo ciclo de cobranca.',
      sessionTrigger: 'O volume de sessoes segue como gatilho principal de renovacao.',
      actions: 'Acoes',
      planNamePlaceholder: 'ex: 10 banhos e tosa'
    },
    form: {
      editTitle: 'Editar plano',
      createTitle: 'Criar novo plano',
      editDescription: 'Atualize nome, quantidade de sessoes ou data de vencimento.',
      createDescription: 'Vincule um pacote recorrente a um cliente. Exemplo: "10 banho e tosa" valido por 6 meses.',
      client: 'Cliente',
      planName: 'Nome do plano',
      totalSessions: 'Total de sessoes',
      expiresOn: 'Vence em (opcional)',
      save: 'Salvando...',
      update: 'Atualizar plano',
      create: 'Criar plano',
      cancel: 'Cancelar'
    },
    dialog: {
      title: 'Remover este plano?',
      description: '"{name}" sera removido. Esta acao nao pode ser desfeita.',
      confirm: 'Remover'
    }
  },
  petInventory: {
    noPermission: 'Você não tem permissão para visualizar o estoque do PetFlow.',
    eyebrow: 'Operacao PetFlow',
    title: 'Estoque e reposicao',
    description:
      'Mantenha banho, tosa e varejo visiveis com alertas abaixo do minimo, contexto de reposicao e historico de movimentacao confiavel.',
    openProducts: 'Abrir produtos',
    recordMovement: 'Registrar movimento',
    watchTitle: 'Radar de saude do estoque',
    watchDescription:
      'Mantenha os riscos mais importantes de reposicao visiveis antes de virar atraso de atendimento, perda de add-on ou compra emergencial.',
    movementTypes: {
      all: 'Todos os tipos',
      inbound: 'Entrada',
      outbound: 'Saida'
    },
    sourceTypes: {
      manual: 'Ajuste manual',
      retailSale: 'Venda no varejo',
      clinicalConsumption: 'Consumo operacional',
      productSync: 'Sincronizacao de catalogo',
      maintenanceConsumption: 'Consumo interno',
      stockReplacement: 'Reposicao de estoque',
      catalogSync: 'Sincronizacao de catalogo',
      unknown: 'Origem nao identificada'
    },
    health: {
      belowMinimum: 'Abaixo do minimo',
      reorderNow: 'Repor agora',
      healthy: 'Estoque saudavel',
      belowMinimumDetail: 'Abaixo do minimo de {value} {unit}.',
      reorderNowDetail: 'No ponto de reposicao de {value} {unit} ou abaixo dele.',
      healthyDetail: 'O estoque esta acima do limite de reposicao.'
    },
    summary: {
      trackedLabel: 'Produtos monitorados',
      trackedDetail: 'Catalogo visivel para consumo de banho e tosa, recepcao e apoio ao varejo.',
      belowMinimumLabel: 'Abaixo do minimo',
      belowMinimumDetail: 'Esses itens ja podem pressionar o proximo ciclo de banho e tosa ou a venda no balcao.',
      belowMinimumSafe: 'Nenhum item esta abaixo da quantidade minima agora.',
      reorderLabel: 'Reposicao imediata',
      reorderDetail: 'Esses produtos estao no ponto de reposicao e nao devem esperar a proxima contagem.',
      reorderSafe: 'Nenhum item esta no ponto de reposicao neste momento.',
      outboundLabel: 'Saidas visiveis',
      filteredDetail: 'A contagem reflete o recorte operacional filtrado.',
      visibleQuantityDetail: 'Quantidade movimentada nesta pagina: {value} unidade(s).'
    },
    lookup: {
      productsLabel: 'Produtos',
      healthWarning: 'A leitura da saude do estoque depende do acesso ao catalogo de produtos.',
      movementWarning: 'E necessario acessar o catalogo de produtos antes de registrar uma movimentacao com seguranca.'
    },
    validation: {
      selectProduct: 'Selecione um produto e informe uma quantidade valida.'
    },
    feedback: {
      loadError: 'Nao foi possivel carregar as movimentacoes de estoque.',
      saveError: 'Nao foi possivel salvar a movimentacao de estoque.',
      deleteError: 'Nao foi possivel excluir a movimentacao selecionada.',
      created: 'Movimentacao de estoque registrada com sucesso.',
      updated: 'Movimentacao de estoque atualizada com sucesso.',
      removed: 'Movimentacao de estoque removida com sucesso.',
      healthy: 'Nenhum produto esta abaixo do ponto de reposicao agora. O catalogo compartilhado parece saudavel neste momento.',
      criticalWarning: '{count} produto(s) ja cairam abaixo da quantidade minima e devem ser repostos antes do proximo dia forte.'
    },
    filters: {
      title: 'Filtros de estoque',
      description: 'Recorte o historico por produto ou direcao sem perder o contexto operacional de cada ajuste.',
      searchLabel: 'Busca',
      searchPlaceholder: 'Motivo, nota, origem ou produto',
      productLabel: 'Produto',
      directionLabel: 'Direcao',
      apply: 'Aplicar filtros',
      clear: 'Limpar filtros',
      allProducts: 'Todos os produtos',
      selectProduct: 'Selecione um produto'
    },
    form: {
      createTitle: 'Registrar movimentacao de estoque',
      editTitle: 'Ajustar movimentacao de estoque',
      description: 'Registre o motivo operacional de cada variacao para que estoque, recepcao e cobranca contem a mesma historia.',
      productLabel: 'Produto',
      directionLabel: 'Direcao',
      quantityLabel: 'Quantidade',
      noteLabel: 'Nota operacional',
      notePlaceholder: 'Venda no varejo, uso no banho, ajuste manual de contagem...',
      reminderTitle: 'Lembrete do operador',
      reminderDescription: 'Deixe o motivo explicito para alinhar recepcao, estoque e cobranca durante a demo.',
      saving: 'Salvando movimentacao...',
      update: 'Atualizar movimentacao',
      create: 'Criar movimentacao',
      cancel: 'Cancelar edicao'
    },
    ledger: {
      title: 'Razao de estoque',
      description: 'Revise o que mudou, por que mudou e qual foi o efeito no saldo visivel do produto.',
      loadingTitle: 'Carregando operacoes de estoque',
      loadingDescription: 'Preparando o historico mais recente de movimentacao deste workspace PetFlow.',
      emptyTitle: 'Nenhuma movimentacao registrada',
      emptyDescription: 'Registre a primeira venda, consumo de banho e tosa, ajuste manual ou reposicao para tornar o estoque operacional na demo.',
      firstMovement: 'Registrar primeira movimentacao'
    },
    columns: {
      recorded: 'Registrado em',
      updated: 'Atualizado em',
      product: 'Produto',
      movement: 'Movimento',
      source: 'Origem',
      balanceImpact: 'Impacto no saldo',
      actions: 'Acoes',
      stockLine: 'Estoque {quantity} {unit} · Repor em {reorder}',
      returnedLine: 'O estoque voltou para a prateleira ou foi reabastecido.',
      outboundLine: 'O estoque saiu da prateleira por venda, uso ou ajuste.',
      noOperationalNote: 'Nenhuma nota operacional registrada.',
      reasonDetail: 'Mantenha o motivo explicito para que estoque, cobranca e operacao leiam a mesma historia.',
      balanceChanged: 'O saldo visivel mudou {quantity} unidade(s).',
      unit: 'unidade',
      units: 'unidades'
    },
    dialog: {
      title: 'Excluir movimentacao?',
      description: 'O saldo do produto sera recalculado automaticamente depois que esta movimentacao for removida.'
    }
  },
  petProfessionals: {
    noPermission: 'Você não tem permissão para visualizar a equipe.',
    eyebrow: 'Workspace PetFlow',
    title: 'Profissionais e comissao',
    description:
      'Mantenha groomers e atendentes visiveis com responsabilidade operacional, regra de comissao e contexto de fechamento do mes.',
    openSummary: 'Abrir resumo de comissao',
    snapshotTitle: 'Panorama de comissao',
    snapshotDescription:
      'Use este resumo para explicar quem esta configurado, quem ja gerou comissao e o que esta projetado para o mes.',
    feedback: {
      loadError: 'Nao foi possivel carregar os profissionais.',
      saveError: 'Nao foi possivel salvar o profissional.',
      deleteError: 'Nao foi possivel excluir o profissional.',
      created: 'Profissional adicionado.',
      updated: 'Profissional atualizado.',
      removed: 'Profissional removido.'
    },
    metrics: {
      professionals: 'Profissionais',
      configured: 'Comissao configurada',
      projected: 'Projetado no mes',
      needSetup: 'Pendente de setup',
      loading: 'Carregando...'
    },
    warnings: {
      pendingSetup: '{count} profissional(is) ainda precisa(m) de regra de comissao antes da demo contar a historia completa de producao.'
    },
    search: {
      placeholder: 'Nome, especialidade, telefone ou e-mail',
      apply: 'Buscar',
      clear: 'Limpar'
    },
    columns: {
      professional: 'Profissional',
      contact: 'Contato',
      commission: 'Comissao',
      status: 'Status operacional',
      actions: 'Acoes',
      defaultSpecialty: 'Banho, tosa e suporte de recepcao',
      noEmail: 'Sem e-mail cadastrado',
      noPhone: 'Sem telefone cadastrado',
      noCompletedServices: 'Nenhum atendimento concluido neste mes',
      ruleVisible: 'Regra de comissao ja visivel para a demo.',
      defineRate: 'Defina a taxa antes do proximo atendimento concluido.',
      needsSetup: 'Precisa configurar comissao',
      alreadyGenerating: 'Ja esta gerando comissao neste mes',
      readyForNextVisit: 'Pronto para o proximo atendimento concluido'
    },
    form: {
      name: 'Nome',
      specialty: 'Especialidade',
      licenseNumber: 'Registro',
      phone: 'Telefone',
      email: 'E-mail',
      commissionRate: 'Taxa de comissao (%)',
      commissionRatePlaceholder: 'ex: 15',
      reminderTitle: 'Lembrete de comissao',
      reminderDescription: 'Use a taxa para mostrar quem executou o servico, quem responde pelo resultado e como a comissao aparece apos a conclusao.',
      saving: 'Salvando...',
      update: 'Atualizar profissional',
      create: 'Adicionar profissional',
      cancel: 'Cancelar'
    },
    table: {
      emptyTitle: 'Nenhum profissional encontrado',
      emptyDescription: 'Cadastre o primeiro groomer ou atendente para mostrar responsavel e comissao projetada na agenda.',
      addFirst: 'Adicionar primeiro profissional'
    },
    dialog: {
      title: 'Remover profissional?',
      description: '"{name}" sera removido deste workspace.'
    }
  },
  petFinance: {
    eyebrow: 'Gestao Financeira',
    title: 'Caixa e Financeiro',
    description: 'Acompanhe entradas, saidas, pagamentos e o fluxo de caixa do seu petshop.',
    noPermission: 'Voce nao possui permissao para acessar o modulo financeiro.',
    loading: 'Carregando dados financeiros...',
    actions: {
      newMovement: 'Nova movimentacao',
      newInvoice: 'Nova fatura',
      viewReport: 'Ver relatorio',
      exportData: 'Exportar'
    },
    stats: {
      todayBalance: 'Saldo do dia',
      todayIncome: 'Entradas hoje',
      todayExpenses: 'Saidas hoje',
      pendingPayments: 'Pagamentos pendentes',
      monthRevenue: 'Receita do mes',
      openInvoices: 'Faturas em aberto'
    },
    cashMovements: {
      title: 'Movimentacoes de caixa',
      description: 'Historico de entradas e saidas do caixa.',
      empty: 'Nenhuma movimentacao registrada hoje.',
      emptyDescription: 'Registre a primeira entrada ou saida para iniciar o controle.',
      inbound: 'Entrada',
      outbound: 'Saida',
      categories: {
        sale: 'Venda',
        service: 'Servico',
        refund: 'Reembolso',
        expense: 'Despesa',
        withdrawal: 'Retirada',
        deposit: 'Deposito',
        adjustment: 'Ajuste',
        other: 'Outros'
      }
    },
    invoices: {
      title: 'Faturas recentes',
      description: 'Acompanhe o status das faturas emitidas.',
      empty: 'Nenhuma fatura encontrada.',
      status: {
        draft: 'Rascunho',
        issued: 'Emitida',
        paid: 'Paga',
        partiallyPaid: 'Parcialmente paga',
        overdue: 'Vencida',
        canceled: 'Cancelada'
      }
    },
    payments: {
      title: 'Pagamentos recentes',
      description: 'Ultimos pagamentos recebidos.',
      empty: 'Nenhum pagamento registrado.',
      methods: {
        cash: 'Dinheiro',
        credit: 'Credito',
        debit: 'Debito',
        pix: 'PIX',
        transfer: 'Transferencia',
        check: 'Cheque',
        other: 'Outros'
      }
    },
    form: {
      direction: 'Direcao',
      category: 'Categoria',
      amount: 'Valor',
      description: 'Descricao',
      descriptionPlaceholder: 'Descreva a movimentacao...',
      date: 'Data',
      save: 'Salvar',
      cancel: 'Cancelar'
    },
    filters: {
      title: 'Filtros',
      period: 'Periodo',
      direction: 'Direcao',
      category: 'Categoria',
      today: 'Hoje',
      thisWeek: 'Esta semana',
      thisMonth: 'Este mes',
      lastMonth: 'Mes passado',
      allDirections: 'Todas as direcoes',
      allCategories: 'Todas as categorias'
    }
  },
  petTimeline: {
    eyebrow: 'Historico Clinico',
    title: 'Timeline do Pet',
    description: 'Historico completo de atendimentos, vacinas, prontuarios e prescricoes.',
    noPermission: 'Voce nao possui permissao para visualizar o historico clinico.',
    loading: 'Carregando historico clinico...',
    petNotFound: 'Pet nao encontrado.',
    backToPets: 'Voltar para pets',
    filters: {
      title: 'Filtros',
      allTypes: 'Todos os tipos',
      period: 'Periodo',
      allTime: 'Todo o periodo',
      lastWeek: 'Ultima semana',
      lastMonth: 'Ultimo mes',
      last3Months: 'Ultimos 3 meses',
      lastYear: 'Ultimo ano'
    },
    events: {
      empty: 'Nenhum evento clinico registrado para este pet.',
      emptyDescription: 'Registre prontuarios, vacinas ou prescricoes para construir o historico clinico.',
      medicalRecord: 'Prontuario Medico',
      vaccination: 'Vacinacao',
      prescription: 'Prescricao',
      appointment: 'Atendimento'
    },
    sections: {
      summary: 'Resumo clinico',
      vaccinations: 'Carteira de vacinacao',
      prescriptions: 'Prescricoes recentes',
      records: 'Prontuarios'
    },
    stats: {
      totalEvents: 'Total de eventos',
      vaccinations: 'Vacinas aplicadas',
      records: 'Prontuarios',
      prescriptions: 'Prescricoes',
      lastVisit: 'Ultima visita'
    },
    actions: {
      addRecord: 'Novo prontuario',
      addVaccine: 'Registrar vacina',
      addPrescription: 'Nova prescricao',
      viewDetails: 'Ver detalhes',
      printHistory: 'Imprimir historico'
    }
  },
  petPOS: {
    eyebrow: 'Ponto de Venda',
    title: 'PDV - Vendas',
    description: 'Interface rápida para vendas de produtos e serviços no balcão do petshop.',
    noPermission: 'Você não possui permissão para acessar o PDV.',
    loading: 'Carregando produtos...',
    actions: {
      newSale: 'Nova venda',
      checkout: 'Finalizar venda',
      cancel: 'Cancelar',
      addItem: 'Adicionar',
      removeItem: 'Remover',
      clearCart: 'Limpar carrinho'
    },
    cart: {
      title: 'Carrinho',
      empty: 'Carrinho vazio',
      emptyDescription: 'Adicione produtos ou serviços para iniciar uma venda.',
      items: 'itens',
      subtotal: 'Subtotal',
      discount: 'Desconto',
      total: 'Total',
      quantity: 'Qtd'
    },
    products: {
      title: 'Produtos',
      search: 'Buscar produto...',
      category: 'Categoria',
      allCategories: 'Todas as categorias',
      empty: 'Nenhum produto encontrado.',
      inStock: 'Em estoque',
      outOfStock: 'Sem estoque',
      lowStock: 'Estoque baixo'
    },
    services: {
      title: 'Serviços',
      empty: 'Nenhum serviço cadastrado.'
    },
    client: {
      title: 'Cliente',
      select: 'Selecionar cliente',
      search: 'Buscar cliente...',
      noClient: 'Venda sem cliente',
      selected: 'Cliente selecionado'
    },
    payment: {
      title: 'Pagamento',
      method: 'Forma de pagamento',
      methods: {
        cash: 'Dinheiro',
        credit: 'Crédito',
        debit: 'Débito',
        pix: 'PIX',
        transfer: 'Transferência'
      },
      received: 'Valor recebido',
      change: 'Troco'
    },
    checkout: {
      title: 'Finalizar venda',
      description: 'Revise os itens e selecione a forma de pagamento.',
      confirm: 'Confirmar venda',
      processing: 'Processando...',
      success: 'Venda realizada com sucesso!',
      error: 'Erro ao processar a venda.',
      printReceipt: 'Imprimir comprovante'
    },
    stats: {
      todaySales: 'Vendas hoje',
      todayRevenue: 'Faturamento hoje',
      avgTicket: 'Ticket médio',
      itemsSold: 'Itens vendidos'
    }
  },
  petClinic: {
    eyebrow: 'Clínica Veterinária',
    title: 'Dashboard Clínico',
    description: 'Acompanhe atendimentos clínicos, vacinas pendentes, prontuários e prescrições em uma única visão operacional.',
    noPermission: 'Você não possui permissão para visualizar o dashboard clínico.',
    loading: 'Carregando o panorama clínico...',
    actions: {
      viewTimeline: 'Ver timeline',
      newRecord: 'Novo prontuário',
      newVaccination: 'Registrar vacina',
      newPrescription: 'Nova prescrição'
    },
    stats: {
      clinicalAppointments: 'Atendimentos clínicos',
      clinicalAppointmentsDetail: 'consultas e procedimentos hoje',
      pendingVaccinations: 'Vacinas pendentes',
      pendingVaccinationsDetail: 'próximos 14 dias',
      todayRecords: 'Prontuários hoje',
      todayRecordsDetail: 'registros clínicos criados',
      activePrescriptions: 'Prescrições ativas',
      activePrescriptionsDetail: 'últimos 30 dias'
    },
    vaccinations: {
      title: 'Vacinas pendentes',
      description: 'Pets com vacinas próximas do vencimento ou já vencidas',
      empty: 'Nenhuma vacina pendente nos próximos 14 dias.',
      dueIn: 'Vence em {days} dias',
      dueToday: 'Vence hoje',
      overdue: 'Vencida há {days} dias',
      scheduleAction: 'Agendar',
      viewPet: 'Ver pet'
    },
    timeline: {
      title: 'Timeline clínica recente',
      description: 'Últimos eventos clínicos registrados',
      viewAll: 'Ver timeline completa',
      empty: 'Nenhum evento clínico registrado.',
      types: {
        medicalRecord: 'Prontuário',
        vaccination: 'Vacinação',
        prescription: 'Prescrição'
      }
    },
    appointments: {
      title: 'Atendimentos clínicos hoje',
      description: 'Consultas e procedimentos veterinários agendados',
      empty: 'Nenhum atendimento clínico agendado para hoje.'
    },
    errors: {
      timeline: 'Não foi possível carregar a timeline clínica.',
      vaccinations: 'Não foi possível carregar as vacinas pendentes.',
      records: 'Não foi possível carregar os prontuários.',
      prescriptions: 'Não foi possível carregar as prescrições.'
    }
  },
  petInvoices: {
    noPermission: 'Você não tem permissão para visualizar as cobrancas do PetFlow.',
    title: 'Cobranca e proximo ciclo',
    description:
      'Mostre como os servicos do PetFlow viram faturas, pagamentos e uma previsao clara do proximo ciclo mensal.',
    filtersTitle: 'Filtros de cobranca',
    filtersDescription:
      'Refine a lista financeira por cliente ou ciclo sem perder a historia comercial por tras de cada documento.',
    nextCycleTitle: 'Previsao de cobranca do proximo ciclo',
    pipelineTitle: 'Pipeline de cobranca',
    pipelineDescription: 'Revise status, saldo em aberto e o registro financeiro por tras de cada cobranca do PetFlow.'
  }
} as const;

export type AppMessages = DeepWiden<typeof ptBRMessages>;

export { ptBRMessages };
