import { ptBRScreens } from '@/shared/i18n/messages/screens-pt-br';

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
  moduleCapability: {
    openWorkspaceFlow: 'Abrir fluxo do ambiente',
    unavailableInWorkspace: 'Indisponível neste ambiente',
    unavailableForRole: 'Indisponível para este perfil',
    unavailableGenericTitle: 'Indisponível no ambiente atual',
    openSetupFlow: 'Abrir fluxo de configuração',
    openNextStep: 'Abrir próximo passo',
    guidedWorkspaceStep: 'Etapa guiada do ambiente',
    featureDisabledAction: 'Recurso desativado neste ambiente',
    status: {
      noPermission: 'sem permissão',
      featureDisabled: 'recurso desativado',
      setupRequired: 'configuração necessária',
      noData: 'sem dados',
      unavailable: 'indisponível'
    },
    badge: {
      noPermission: 'Sem permissão',
      featureDisabled: 'Recurso desativado',
      setupRequired: 'Configuração necessária',
      noData: 'Sem dados',
      unavailable: 'Indisponível'
    },
    notContractedTitle: '{moduleCode} não está contratado neste ambiente',
    notContractedDescription: 'Este ambiente não expõe o módulo {moduleCode} no momento. Peça ao administrador para incluir o módulo no contrato do ambiente antes de tentar novamente.',
    featureDisabledTitle: '{moduleCode} está desativado no ambiente atual',
    featureDisabledDescription: 'O módulo está contratado, mas sua exposição está desativada neste ambiente. A navegação continua bloqueada até a feature ser reativada.',
    unavailableTitle: '{moduleCode} está indisponível no ambiente atual',
    unavailableDescription: 'O módulo está contratado, mas o contexto atual ainda não está pronto para abri-lo. O acesso segue bloqueado até a disponibilidade do ambiente ser restaurada.'
  },
  moduleGuard: {
    checkingTitle: 'Verificando o acesso ao ambiente {moduleCode}',
    checkingDescription: 'A aplicação está validando o contrato do ambiente e a exposição atual do módulo antes de abrir este espaço.',
    errorTitle: 'Não foi possível verificar a disponibilidade de {moduleCode}',
    errorDescription: 'Este ambiente não conseguiu confirmar o contrato do módulo. Tente novamente após a sincronização do catálogo.',
    unavailableTitle: '{moduleCode} está indisponível no ambiente atual',
    unavailableDescription: 'O módulo não pode ser aberto no contexto atual do ambiente.'
  },
  publicShell: {
    brandEyebrow: 'PhaifferTech',
    brandTitle: 'Gestão para operações pet reais',
    brandSubtitle:
      'Software para banho e tosa, recorrência mensal e operação de pet shop com base técnica sólida.',
    localeLabel: 'Alternar idioma do site',
    navHome: 'Início',
    navPlatform: 'Plataforma',
    navProducts: 'Produtos',
    navContact: 'Contato',
    navLogin: 'Acessar sistema',
    navLabel: 'Navegação',
    footerNarrativeText:
      'PhaifferTech apresenta sua plataforma principal para agenda, planos mensais, estoque e cobrança de operações pet.',
    footerProductsTitle: 'Produtos',
    footerAccessTitle: 'Acesso',
    footerPlatformLabel: 'Fundação da plataforma',
    footerDemoLabel: 'Solicitar demo',
    footerCopyright:
      'PhaifferTech · Gestão para banho e tosa, pet shop e operação recorrente, sustentado por fundação SaaS multi-tenant.'
  },
  publicHome: {
    framework: 'Soluções',
    productLanes: 'Frentes operacionais',
    expertiseEyebrow: 'Porque a demo convence'
  },
  publicHero: {
    panelEyebrow: 'Demo Operacional',
    panelTitle: 'Foco operacional',
    panelBadge: 'Pronto para apresentar',
    storyEyebrow: 'Roteiro da demo',
    storyText:
      'Mostre o ciclo completo na operação pet: atendimento, plano recorrente, pressão de estoque, cobrança e follow-up automatizado.'
  },
  login: {
    title: 'Acessar workspace',
    description: 'Entre com o workspace e suas credenciais para abrir a operação.',
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
      heroTitle: 'Operação pet pronta para abrir o dia.',
      heroDescription:
        'Agenda, planos, cobrança e follow-up continuam na mesma linguagem visual do produto, sem distração e sem uma landing pesada no meio do acesso.',
      laneQueueTitle: 'Fila',
      laneQueueDescription: 'Atendimentos e pets prontos com profissional responsável.',
      lanePlansTitle: 'Planos',
      lanePlansDescription: 'Recorrência mensal, penúltimo banho e renovação no radar.',
      laneBillingTitle: 'Cobrança',
      laneBillingDescription: 'Extras, estoque e comissão sem sair do fluxo comercial.',
      accessCardTitle: 'Acesso ao sistema',
      accessCardDescription:
        'O login mantém o foco no acesso enquanto preserva a atmosfera premium do produto e da demo.'
    }
  },
  appShell: {
    mobileOverview: 'Visão geral',
    mobilePetWorkspace: 'Gestão Pet',
    mobileSettings: 'Configurações',
    quickSearchWorkspace: 'Buscar no workspace',
    quickSearchPet: 'Buscar atendimentos, clientes ou cobrança',
    localeButtonLabel: 'Alternar idioma',
    header: {
      crmLabel: 'Relacionamento',
      crmDescription: 'Faixa de continuidade para follow-up, contexto comercial e histórico herdado integrado à operação pet.',
      petLabel: 'Gestão Pet',
      petDescription: 'Fila do dia, planos, estoque, cobrança e responsabilidade do time em uma única frente.',
      workspacesLabel: 'Workspaces',
      workspacesDescription: 'Gerencie a camada de workspaces sem expandir a superfície visível do produto.',
      usersLabel: 'Usuários',
      usersDescription: 'Mantenha o acesso interno e a alocação de papéis sob controle.',
      settingsLabel: 'Configurações',
      settingsDescription: 'Branding, acesso e configuração do workspace atual.',
      platformLabel: 'Plataforma',
      petOverviewLabel: 'Visão geral da operação',
      overviewLabel: 'Visão geral',
      petOverviewDescription:
        'Painel comercial da operação pet com contexto operacional no centro da leitura.',
      overviewDescription: 'Resumo compartilhado do workspace com a superfície visível atual.'
    }
  },
  sidebar: {
    overview: 'Visão geral',
    settings: 'Configurações',
    petWorkspace: 'Gestão Pet',
    focusLabel: 'Foco operacional',
    workspaceLabel: 'Workspace',
    signOut: 'Sair'
  },
  petSubnav: {
    workspace: 'Workspace',
    dashboard: 'Dashboard',
    clients: 'Clientes',
    pets: 'Pets',
    appointments: 'Atendimentos',
    services: 'Catálogo Banho e Tosa',
    followUp: 'Follow-up',
    commercial: 'Comercial',
    clinic: 'Clínica',
    pos: 'PDV',
    finance: 'Financeiro',
    plans: 'Planos',
    inventory: 'Estoque',
    invoices: 'Cobrança',
    professionals: 'Equipe',
    commissions: 'Fechamento'
  },
  dashboardRoutes: {
    mainEyebrow: 'Gestão Pet',
    mainTitle: 'Visão geral da operação',
    mainDescription:
      'Visão principal da demo com atendimentos do dia, planos perto do fim, estoque baixo, cobrança do próximo ciclo e comissão do time.',
    surfaceLabel: 'Superfície oficial da demo',
    petDashboardEyebrow: 'Dashboard Operacional',
    petDashboardTitle: 'Dashboard operacional',
    petDashboardDescription:
      'Acompanhe fila do dia, pets prontos, recorrência, estoque baixo, cobrança do próximo ciclo e comissão em uma única leitura operacional.'
  },
  petDashboard: {
    noPermission: 'Você não possui permissão para visualizar o dashboard operacional.',
    actions: {
      appointments: 'Agenda operacional',
      billing: 'Cobrança e próximo ciclo'
    },
    loading: 'Carregando o panorama operacional...',
    errors: {
      appointments: 'Não foi possível carregar os atendimentos do dia.',
      plans: 'Não foi possível carregar os planos do workspace.',
      inventory: 'Não foi possível carregar o estoque do workspace.',
      billing: 'Não foi possível carregar a cobrança do workspace.'
    },
    stats: {
      appointmentsDay: 'Atendimentos do dia',
      appointmentsDayDetail: 'em andamento e {ready} pets prontos para liberar.',
      recurringVsOneTime: 'Recorrentes vs avulsos',
      recurringVsOneTimeDetail: 'Separação visível entre clientes de plano e atendimentos pontuais.',
      pickupMessage: 'Mensagem de retirada',
      pickupMessageMissing: 'pets prontos ainda sem email do cliente para a mensagem de retirada.',
      pickupMessageReady: 'Todos os pets prontos desta lista já têm mensagem de retirada pronta para envio.',
      expiringPlans: 'Planos vencendo',
      expiringPlansDetail: 'planos expiram nas próximas duas semanas.',
      petTaxi: 'Pet taxi',
      petTaxiEmpty: 'Nenhum extra de pet taxi visível na agenda de hoje.',
      lowStock: 'Estoque baixo',
      lowStockDetail: 'Itens abaixo do ponto de reposição antes de comprometer a operação.',
      nextCycle: 'Próximo ciclo',
      nextCycleDetail: 'atendimentos do próximo ciclo já estão conectados a planos recorrentes.',
      commission: 'Comissão / produção',
      commissionDetail: 'atendimentos concluídos já geraram comissão neste mês.'
    },
    queue: {
      title: 'Fila operacional de hoje',
      description:
        'Use esta fila para contar a história do dia: cliente recorrente ou avulso, profissional responsável, pet taxi, plano ativo e valor previsto.',
      empty:
        'Nenhum atendimento está agendado para hoje neste workspace. Para a demo, vale montar pelo menos um recorrente, um avulso e um caso com pet taxi.',
      pendingProfessional: 'Responsável pendente',
      missingProfessional: 'Profissional não informado',
      extrasLabel: 'Extras',
      commissionLabel: 'Comissão'
    },
    billing: {
      title: 'Renovação e cobrança',
      description: 'Planos perto do fim, cobranças em aberto e o valor projetado para o próximo ciclo.',
      nextCycleLabel: 'Próximo ciclo',
      nextCycleDetail: 'atendimentos já entram como recorrentes no próximo ciclo.',
      remainingSessions: 'sessões restantes',
      expiresAt: 'expira em',
      dueAt: 'Vence em',
      balance: 'saldo',
      noAlerts: 'Sem alertas de plano ou cobrança neste momento.'
    },
    closing: {
      title: 'Fechamento operacional',
      description: 'Leitura compacta para a demo comercial: o que concluiu, o que gera comissão, o que precisa renovar e o que segue em aberto.',
      badge: 'Fechamento banho e tosa',
      completed: 'Atendimentos concluídos',
      completedDetail: 'Banhos e tosas finalizados no mês atual.',
      commission: 'Comissão para conferir',
      commissionDetail: 'Valor projetado a partir dos atendimentos concluídos.',
      plansNearEnd: 'Planos perto do fim',
      plansNearEndDetail: 'Clientes com uma ou duas sessões restantes para ação de renovação.',
      pendingCharges: 'Cobranças pendentes',
      pendingChargesDetail: 'Saldo de faturas em aberto que ainda precisa de follow-up da recepção.'
    },
    inventory: {
      title: 'Estoque abaixo do ponto',
      description: 'Mantenha shampoo, loja e consumo operacional visíveis antes de perder venda ou atrasar atendimento.',
      empty: 'Nenhum item está abaixo do ponto de reposição agora.',
      sku: 'SKU',
      minimum: 'Mínimo',
      reorder: 'reposição em'
    },
    production: {
      title: 'Produção por profissional',
      description: 'Mostre a produção do mês junto com a comissão prevista para reforçar a história operacional.',
      empty: 'Ainda não há atendimentos concluídos suficientes para resumir a produção deste mês.',
      completed: 'atendimentos concluídos neste mês'
    },
    pills: {
      recurring: 'Recorrente',
      oneTime: 'Avulso',
      activePlan: 'Plano ativo',
      penultimateBath: 'Penúltimo banho',
      petTaxi: 'Pet taxi',
      pickupSent: 'Mensagem pronta',
      pickupPending: 'Mensagem pendente',
      responsible: 'Responsável',
      commission: 'Comissão',
      cycleCharge: 'Cobrança do ciclo',
      overdue: 'Em atraso',
      belowMinimum: 'Abaixo do mínimo'
    }
  },
  petAppointments: {
    noPermission: 'Você não tem permissão para visualizar atendimentos.',
    title: 'Agenda de Banho e Tosa',
    description:
      'Organize a fila de banho e tosa com recorrentes e avulsos, pacotes de serviços, pet taxi, profissional responsável, consumo de estoque e follow-up de retirada.',
    actions: {
      switchToList: 'Ver lista',
      switchToCalendar: 'Ver calendário',
      book: 'Agendar atendimento'
    },
    filters: {
      title: 'Filtros',
      description: 'Refine a agenda de banho e tosa por status, cliente, pacote de serviços e profissional.',
      searchPlaceholder: 'Banho, tosa, status ou observações',
      status: 'Status',
      client: 'Cliente',
      pet: 'Pet',
      service: 'Pacote de serviços',
      professional: 'Profissional',
      activeCountSuffix: 'filtro(s) moldando a visão da agenda.',
      noActive: 'Nenhum filtro ativo na visão de atendimentos.'
    },
    focus: {
      title: 'Foco operacional',
      description: 'Mantenha a história da demo clara antes de abrir a fila completa: recorrência, pet taxi, penúltimo banho, retirada e comissão.',
      recurring: 'Recorrentes',
      recurringDetail: 'Visitas já vinculadas a um plano ativo.',
      oneTime: 'Avulsos',
      oneTimeDetail: 'Checkouts fora da base recorrente.',
      ready: 'Prontos',
      readyDetailSuffix: 'com cobertura de mensagem de retirada.',
      planAlerts: 'Alertas de plano',
      planAlertsDetail: 'Penúltimo banho ou sessões finais visíveis neste recorte.',
      petTaxi: 'Pet taxi',
      petTaxiDetail: 'Atendimentos com extra de coleta ou entrega.',
      commission: 'Comissão',
      commissionDetail: 'Projetada sobre os atendimentos visíveis agora.',
      pickupRule:
        'Atendimentos concluídos preparam a mensagem de retirada quando o cliente tem e-mail cadastrado. A recepção revisa e envia, o que deixa a regra de "pet pronto / mensagem pronta" explicita na demo.'
    },
    table: {
      loadingTitle: 'Carregando atendimentos',
      loadingDescription: 'Preparando a agenda com contexto de cliente, pet e profissional.',
      emptyTitle: 'Nenhum atendimento ainda',
      emptyDescription:
        'Cadastre um recorrente, um avulso, um profissional responsável e um extra opcional de pet taxi para deixar a fila comercialmente convincente.',
      firstAppointment: 'Agendar primeiro atendimento'
    },
    drawer: {
      createTitle: 'Agendar atendimento',
      editTitle: 'Editar atendimento',
      description:
        'Selecione cliente e pet, monte o pacote de serviços, atribua o profissional responsável e confirme pagamento avulso ou por plano com extras e execução conectada ao estoque.'
    },
    dialog: {
      deleteTitle: 'Remover atendimento?',
      deleteDescription: 'O atendimento de "{service}" será removido.',
      confirmDelete: 'Remover'
    },
    formOptions: {
      all: 'Todos',
      selectClient: 'Selecione um cliente',
      selectPet: 'Selecione um pet',
      selectService: 'Selecione banho ou tosa',
      selectProfessional: 'Selecione um profissional',
      unassignedProfessional: 'Deixar sem atribuição por enquanto',
      selectClientFirst: 'Selecione um cliente primeiro',
      loadingPlans: 'Carregando planos...',
      oneTime: 'Sem plano — pagamento avulso',
      noActivePlan: 'Nenhum plano ativo para este cliente',
      sessionsLeftSuffix: 'sessões restantes'
    },
    notices: {
      clients: 'Clientes',
      pets: 'Pets',
      services: 'Serviços',
      professionals: 'Profissionais'
    },
    errors: {
      load: 'Não foi possível carregar os atendimentos.',
      missingReferences: 'Selecione cliente, pet, serviço e profissional para agendar o atendimento.',
      missingDate: 'Informe a data e a hora do atendimento.',
      save: 'Não foi possível salvar o atendimento.',
      delete: 'Não foi possível excluir o atendimento.'
    },
    success: {
      updated: 'Atendimento atualizado.',
      created: 'Atendimento agendado.',
      deleted: 'Atendimento removido.'
    },
    calendar: {
      previous: 'Anterior',
      today: 'Hoje',
      next: 'Próximo'
    },
    preparedPickup: {
      title: 'Pronto para retirada',
      description: 'Mensagem de envio manual preparada para o canal que a recepção já usa.',
      label: 'Mensagem de retirada preparada',
      preparedPill: 'Mensagem preparada',
      preparing: 'Preparando...',
      reviewTitle: 'Revise antes de enviar',
      reviewDescription: 'Use este texto como fallback manual quando o canal oficial de WhatsApp estiver indisponível ou o envio falhar.',
      success: 'Mensagem de retirada preparada e copiada para envio manual.',
      needsReview: 'Mensagem de retirada preparada; confirme se o atendimento foi concluído antes de enviar.',
      error: 'Não foi possível preparar a mensagem de retirada.',
      officialSend: 'Enviar WhatsApp',
      officialSending: 'Enviando...',
      officialSent: 'WhatsApp enviado',
      officialSuccess: 'Envio oficial por WhatsApp realizado. Dispatch: {id}.',
      officialFailure: 'Não foi possível enviar o WhatsApp oficial. Use o fallback manual preparado.'
    },
    appointmentInvoice: {
      generate: 'Gerar cobrança',
      generating: 'Gerando...',
      open: 'Abrir cobrança',
      success: 'Cobrança de {amount} gerada para {client}. Registre o pagamento em Cobrança.',
      error: 'Não foi possível gerar a cobrança deste atendimento.'
    },
    statuses: {
      all: 'Todos os status',
      scheduled: 'Agendado',
      confirmed: 'Confirmado',
      inProgress: 'Em andamento',
      completed: 'Concluído',
      canceled: 'Cancelado',
      noShow: 'Não compareceu'
    },
    form: {
      bookingTitle: 'Agendamento de banho e tosa',
      bookingDescription: 'Cliente, pet, pacote de serviços, profissional responsável e horário em uma etapa operacional.',
      packageTitle: 'Plano e checkout',
      packageDescription:
        'Vincule um plano recorrente para cobrir o serviço base ou deixe vazio para pagamento avulso. Adicione pet taxi, adicionais ou extras do dia.',
      notes: 'Observações',
      notesPlaceholder: 'Observações da visita, como pele sensível ou primeiro atendimento',
      dateTime: 'Data e hora',
      defaultProfessionalHint: 'Usado como âncora de compatibilidade e como profissional padrão para novas linhas de serviço.',
      serviceLineProfessional: 'Profissional responsável',
      serviceLineProfessionalHint: 'Sobrescreva o profissional padrão nesta linha quando outra pessoa assumir a execução.',
      serviceLineProfessionalPending: 'Nenhum profissional atribuído a esta linha ainda.',
      packageLabel: 'Plano (opcional)',
      packageServiceRequiredTitle: 'Selecione o serviço base coberto pelo plano.',
      packageServiceRequiredDescription:
        'O plano não substitui o serviço do atendimento; ele cobre o checkout do serviço elegível.',
      packageSelectedTitle: 'Plano selecionado',
      packageRemainingSessions: '{count} sessões restantes.',
      packageSelectClient: 'Selecione um cliente primeiro para ver os planos disponíveis.',
      packageUnavailable: 'Nenhum plano ativo para este cliente. O atendimento será cobrado de forma avulsa.',
      extrasAmount: 'Extras (R$)',
      extrasDescription: 'Descrição dos extras',
      extrasPlaceholder: 'Ex.: Pet taxi, corte de unhas, perfume',
      packageCoverageIntro: '1 sessão será consumida quando o atendimento for concluído.',
      packageCoverageExtras: 'Extras de R$ {amount} serão cobrados separadamente.',
      packageCoverageFull: 'O serviço base ficará totalmente coberto pelo plano.',
      referencesRequired:
        'Antes de agendar, cadastre pelo menos um cliente, um pet, um serviço de banho e tosa e um profissional. Depois volte aqui.',
      save: 'Salvando...',
      update: 'Atualizar atendimento',
      create: 'Agendar atendimento',
      cancel: 'Cancelar'
    },
    columns: {
      service: 'Pacote',
      scheduled: 'Agendado',
      status: 'Status',
      plan: 'Plano',
      payment: 'Pagamento',
      care: 'Clínico',
      client: 'Cliente',
      professional: 'Profissional',
      actions: 'Ações',
      responsible: 'Responsável',
      petTaxi: 'Pet taxi',
      petReady: 'Pet pronto para retirada.',
      checkoutAfterSlot: 'Checkout e consumo de plano acompanham este horário.',
      pickupSent: 'Mensagem de retirada pronta para envio',
      pickupSkipped: 'Mensagem de retirada ignorada: cliente sem e-mail',
      inProgressDetail: 'O profissional responsável está atuando neste atendimento.',
      oneTime: 'Avulso',
      chargeCheckout: 'Cobre o serviço completo e os extras no checkout.',
      activePlan: 'Plano ativo',
      linkedPlan: 'Este atendimento já está vinculado a um plano ativo.',
      allUsed: 'Todas usadas',
      leftSuffix: 'restantes',
      coveredByPlan: 'Serviço base coberto pelo plano',
      sessionUsed: 'Sessão consumida do plano',
      renewalTriggered: 'Alerta de renovação disparado',
      serviceAmount: 'Serviço',
      petTaxiAmount: 'Pet taxi',
      extras: 'Extras',
      totalDue: 'Total previsto',
      fullyCovered: 'Totalmente coberto',
      records: 'registros',
      vaccines: 'vacinas',
      prescriptions: 'rx',
      recurring: 'Recorrente',
      serviceLines: 'linhas estruturadas',
      commissionLines: 'elegíveis para comissão',
      lineAssignments: 'Responsabilidade por linha',
      pendingProfessional: 'Profissional pendente',
      professionalDetail: 'Responsável pelo atendimento e pelo resultado da comissão.',
      commission: 'Comissão',
      commissionExcluded: 'excluída pela regra do serviço',
      pendingSetup: 'configuração pendente',
      careNotes: 'Notas do atendimento',
      continueCare: 'Continuar atendimento'
    }
  },
  petPlans: {
    noPermission: 'Você não tem permissão para visualizar planos de clientes.',
    eyebrow: 'Gestão Pet · Banho e tosa',
    title: 'Planos mensais',
    description:
      'Gerencie clientes recorrentes, visitas restantes, alertas de penúltimo banho e uso dos planos ao longo dos atendimentos.',
    createPlan: 'Criar plano',
    watchTitle: 'Radar de renovação',
    watchDescription: 'Mantenha a base recorrente visível antes de o plano acabar ou o cliente perder o próximo ciclo.',
    activePlans: 'Planos ativos',
    activePlansDetail: 'Clientes recorrentes ainda cobertos para os próximos atendimentos.',
    renewSoon: 'Renovar em breve',
    renewSoonDetail: 'Planos com duas ou menos sessões restantes.',
    penultimateBath: 'Penúltimo banho',
    penultimateBathDetail: 'Este é o principal momento de renovação na demo.',
    renewalEmailMissing: 'E-mail de renovação faltando',
    renewalEmailMissingDetail: 'Planos em penúltimo banho sem e-mail cadastrado.',
    exhaustedWarning: 'plano(s) esgotado(s) já precisa(m) de nova venda ou renovação antes do próximo banho.',
    loadingTitle: 'Carregando planos de clientes',
    loadingDescription: 'Buscando pacotes de sessões deste workspace.',
    emptyTitle: 'Nenhum plano de cliente ainda',
    emptyDescription:
      'Crie um pacote recorrente depois da venda do plano. A melhor demo mostra um cliente ativo no penúltimo banho com caminho claro de renovação.',
    firstPlan: 'Criar primeiro plano',
    filters: {
      allClients: 'Todos os clientes',
      selectClient: 'Selecione um cliente',
      noExpiry: 'Sem vencimento'
    },
    validation: {
      selectClient: 'Selecione um cliente para criar o plano.',
      positiveSessions: 'O total de sessões deve ser maior que zero.'
    },
    feedback: {
      saveError: 'Não foi possível salvar o plano.',
      removeError: 'Não foi possível remover o plano.'
    },
    messageSetup: {
      title: 'Cobrança e mensagens preparadas',
      description: 'Configure mensagens de renovação e retirada para envio manual na operação de banho e tosa. Isto não conecta gateway de pagamento nem chatbot.',
      pixKey: 'Chave PIX',
      billingDisplayName: 'Nome de cobrança',
      renewalTemplate: 'Modelo de lembrete de renovação',
      pickupTemplate: 'Modelo de pet pronto para retirada',
      saving: 'Salvando...',
      save: 'Salvar mensagens',
      manualNotice: 'As mensagens geradas são revisadas e enviadas manualmente nesta primeira etapa segura.',
      pendingTitle: 'Cobrança de renovação pendente',
      pendingDescription: 'Fluxo manual assistido: copie a mensagem, revise os dados de cobrança e envie pelo canal combinado com o cliente.',
      preparedRenewalLabel: 'Mensagem de renovação preparada',
      copyMessage: 'Copiar mensagem',
      copyPix: 'Copiar chave PIX',
      messageCopied: 'Mensagem de renovação copiada.',
      pixCopied: 'Chave PIX copiada.',
      settingsUpdated: 'Configuração de mensagens preparadas atualizada.',
      settingsError: 'Não foi possível salvar a configuração de mensagens preparadas.',
      renewalPrepared: 'Mensagem de renovação preparada, cobrada e copiada para envio manual.',
      renewalNeedsBilling: 'Mensagem de renovação preparada com dados de cobrança pendentes; revise os campos do tenant antes de enviar.',
      prepareError: 'Não foi possível preparar o lembrete de renovação.',
      prepareRenewal: 'Preparar lembrete PIX',
      preparingRenewal: 'Preparando...',
      officialRenewalSend: 'Enviar renovação WhatsApp',
      officialRenewalSending: 'Enviando...',
      officialRenewalSent: 'Renovação WhatsApp enviada',
      officialRenewalSuccess: 'Envio oficial de renovação por WhatsApp realizado. Dispatch: {id}.',
      officialRenewalFailure: 'Não foi possível enviar a renovação por WhatsApp oficial. Use o fallback manual preparado.'
    },
    columns: {
      noRenewalEmail: 'Sem e-mail para a mensagem de renovação',
      activeLinked: 'Plano ativo vinculado a visitas recorrentes.',
      noSessionsLeft: 'Plano sem sessões restantes.',
      used: 'utilizadas',
      penultimateAlert: 'Alerta de penúltimo banho',
      finalSession: 'Última sessão antes da renovação',
      renewBeforeNextVisit: 'Renove ou crie um novo plano antes da próxima visita.',
      status: 'Status',
      renewalSent: 'Mensagem de renovação pronta para envio',
      renewalNeedsEmail: 'Renovação depende de e-mail do cliente',
      lastVisitHint: 'O próximo atendimento concluído encerra o plano atual.',
      activeCycleHint: 'Plano ativo e ainda cobre o ciclo recorrente.',
      renewalStates: {
        HEALTHY: 'Em dia',
        PENULTIMATE_USE: 'Penúltimo uso',
        LAST_USE: 'Último uso',
        EXHAUSTED: 'Sessões esgotadas'
      },
      expiryAlign: 'Alinhe esta data com o próximo ciclo de cobrança.',
      sessionTrigger: 'O volume de sessões segue como gatilho principal de renovação.',
      actions: 'Ações',
      planNamePlaceholder: 'ex: 10 banhos e tosa'
    },
    form: {
      editTitle: 'Editar plano',
      createTitle: 'Criar novo plano',
      editDescription: 'Atualize nome, quantidade de sessões ou data de vencimento.',
      createDescription: 'Vincule um pacote recorrente a um cliente. Exemplo: "10 banho e tosa" válido por 6 meses.',
      client: 'Cliente',
      planName: 'Nome do plano',
      totalSessions: 'Total de sessões',
      expiresOn: 'Vence em (opcional)',
      save: 'Salvando...',
      update: 'Atualizar plano',
      create: 'Criar plano',
      cancel: 'Cancelar'
    },
    dialog: {
      title: 'Remover este plano?',
      description: '"{name}" será removido. Esta ação não pode ser desfeita.',
      confirm: 'Remover'
    }
  },
  petInventory: {
    noPermission: 'Você não tem permissão para visualizar o estoque.',
    eyebrow: 'Operação Pet',
    title: 'Estoque e reposição',
    description:
      'Mantenha banho, tosa e varejo visíveis com alertas abaixo do mínimo, contexto de reposição e histórico de movimentação confiável.',
    openProducts: 'Abrir produtos',
    recordMovement: 'Registrar movimento',
    watchTitle: 'Radar de saúde do estoque',
    watchDescription:
      'Mantenha os riscos mais importantes de reposição visíveis antes de virar atraso de atendimento, perda de add-on ou compra emergencial.',
    movementTypes: {
      all: 'Todos os tipos',
      inbound: 'Entrada',
      outbound: 'Saída'
    },
    sourceTypes: {
      manual: 'Ajuste manual',
      retailSale: 'Venda no varejo',
      clinicalConsumption: 'Consumo de banho e tosa',
      productSync: 'Sincronização de catálogo',
      maintenanceConsumption: 'Consumo interno',
      stockReplacement: 'Reposição de estoque',
      catalogSync: 'Sincronização de catálogo',
      unknown: 'Origem não identificada'
    },
    health: {
      belowMinimum: 'Abaixo do mínimo',
      reorderNow: 'Repor agora',
      healthy: 'Estoque saudável',
      belowMinimumDetail: 'Abaixo do mínimo de {value} {unit}.',
      reorderNowDetail: 'No ponto de reposição de {value} {unit} ou abaixo dele.',
      healthyDetail: 'O estoque está acima do limite de reposição.'
    },
    summary: {
      trackedLabel: 'Produtos monitorados',
      trackedDetail: 'Catálogo visível para consumo de banho e tosa, recepção e apoio ao varejo.',
      belowMinimumLabel: 'Abaixo do mínimo',
      belowMinimumDetail: 'Esses itens já podem pressionar o próximo ciclo de banho e tosa ou a venda no balcão.',
      belowMinimumSafe: 'Nenhum item está abaixo da quantidade mínima agora.',
      reorderLabel: 'Reposição imediata',
      reorderDetail: 'Esses produtos estão no ponto de reposição e não devem esperar a próxima contagem.',
      reorderSafe: 'Nenhum item está no ponto de reposição neste momento.',
      outboundLabel: 'Saídas visíveis',
      filteredDetail: 'A contagem reflete o recorte operacional filtrado.',
      visibleQuantityDetail: 'Quantidade movimentada nesta página: {value} unidade(s).'
    },
    lookup: {
      productsLabel: 'Produtos',
      healthWarning: 'A leitura da saúde do estoque depende do acesso ao catálogo de produtos.',
      movementWarning: 'E necessário acessar o catálogo de produtos antes de registrar uma movimentação com segurança.'
    },
    validation: {
      selectProduct: 'Selecione um produto e informe uma quantidade válida.'
    },
    feedback: {
      loadError: 'Não foi possível carregar as movimentações de estoque.',
      saveError: 'Não foi possível salvar a movimentação de estoque.',
      deleteError: 'Não foi possível excluir a movimentação selecionada.',
      created: 'Movimentação de estoque registrada com sucesso.',
      updated: 'Movimentação de estoque atualizada com sucesso.',
      removed: 'Movimentação de estoque removida com sucesso.',
      healthy: 'Nenhum produto está abaixo do ponto de reposição agora. O catálogo compartilhado parece saudável neste momento.',
      criticalWarning: '{count} produto(s) já caíram abaixo da quantidade mínima e devem ser repostos antes do próximo dia forte.'
    },
    filters: {
      title: 'Filtros de estoque',
      description: 'Recorte o histórico por produto ou direção sem perder o contexto operacional de cada ajuste.',
      searchLabel: 'Busca',
      searchPlaceholder: 'Motivo, nota, origem ou produto',
      productLabel: 'Produto',
      directionLabel: 'Direção',
      apply: 'Aplicar filtros',
      clear: 'Limpar filtros',
      allProducts: 'Todos os produtos',
      selectProduct: 'Selecione um produto'
    },
    form: {
      createTitle: 'Registrar movimentação de estoque',
      editTitle: 'Ajustar movimentação de estoque',
      description: 'Registre o motivo operacional de cada variação para que estoque, recepção e cobrança contem a mesma história.',
      productLabel: 'Produto',
      directionLabel: 'Direção',
      quantityLabel: 'Quantidade',
      noteLabel: 'Nota operacional',
      notePlaceholder: 'Shampoo usado no banho, venda no varejo, ajuste manual de contagem...',
      reminderTitle: 'Lembrete do operador',
      reminderDescription: 'Deixe o motivo explicito para alinhar recepção, execução do banho, estoque e cobrança durante a demo.',
      saving: 'Salvando movimentação...',
      update: 'Atualizar movimentação',
      create: 'Criar movimentação',
      cancel: 'Cancelar edição'
    },
    ledger: {
      title: 'Razão de estoque',
      description: 'Revise o que mudou, por que mudou e qual foi o efeito no saldo visível do produto.',
      loadingTitle: 'Carregando operações de estoque',
      loadingDescription: 'Preparando o histórico mais recente de movimentação deste workspace.',
      emptyTitle: 'Nenhuma movimentação registrada',
      emptyDescription: 'Registre a primeira venda, consumo de banho e tosa, ajuste manual ou reposição para tornar o estoque operacional na demo.',
      firstMovement: 'Registrar primeira movimentação'
    },
    columns: {
      recorded: 'Registrado em',
      updated: 'Atualizado em',
      product: 'Produto',
      movement: 'Movimento',
      source: 'Origem',
      balanceImpact: 'Impacto no saldo',
      actions: 'Ações',
      stockLine: 'Estoque {quantity} {unit} · Repor em {reorder}',
      returnedLine: 'O estoque voltou para a prateleira ou foi reabastecido.',
      outboundLine: 'O estoque saiu da prateleira por venda, uso ou ajuste.',
      noOperationalNote: 'Nenhuma nota operacional registrada.',
      reasonDetail: 'Mantenha o motivo explicito para que estoque, cobrança e operação leiam a mesma história.',
      balanceChanged: 'O saldo visível mudou {quantity} unidade(s).',
      unit: 'unidade',
      units: 'unidades'
    },
    dialog: {
      title: 'Excluir movimentação?',
      description: 'O saldo do produto será recalculado automaticamente depois que esta movimentação for removida.'
    }
  },
  petProfessionals: {
    noPermission: 'Você não tem permissão para visualizar a equipe.',
    eyebrow: 'Gestão Pet',
    title: 'Profissionais e comissão',
    description:
      'Mantenha groomers e atendentes visíveis com responsabilidade operacional, regra de comissão e contexto de fechamento do mês.',
    openSummary: 'Abrir resumo de comissão',
    snapshotTitle: 'Panorama de comissão',
    snapshotDescription:
      'Use este resumo para explicar quem está configurado, quem já gerou comissão e o que está projetado para o mês.',
    feedback: {
      loadError: 'Não foi possível carregar os profissionais.',
      saveError: 'Não foi possível salvar o profissional.',
      deleteError: 'Não foi possível excluir o profissional.',
      created: 'Profissional adicionado.',
      updated: 'Profissional atualizado.',
      removed: 'Profissional removido.'
    },
    metrics: {
      professionals: 'Profissionais',
      configured: 'Comissão configurada',
      projected: 'Projetado no mês',
      projectedDetail: 'Comissão dos atendimentos concluídos neste mês.',
      needSetup: 'Pendente de setup',
      loading: 'Carregando...'
    },
    warnings: {
      pendingSetup: '{count} profissional(is) ainda precisa(m) de regra de comissão antes da demo contar a história completa de produção.'
    },
    search: {
      placeholder: 'Nome, especialidade, telefone ou e-mail',
      apply: 'Buscar',
      clear: 'Limpar'
    },
    columns: {
      professional: 'Profissional',
      contact: 'Contato',
      commission: 'Comissão',
      status: 'Status operacional',
      actions: 'Ações',
      defaultSpecialty: 'Banho, tosa e suporte de recepção',
      noEmail: 'Sem e-mail cadastrado',
      noPhone: 'Sem telefone cadastrado',
      noCompletedServices: 'Nenhum atendimento concluído neste mês',
      ruleVisible: 'Regra de comissão já visível para a demo.',
      defineRate: 'Defina a taxa antes do próximo atendimento concluído.',
      needsSetup: 'Precisa configurar comissão',
      alreadyGenerating: 'Já está gerando comissão neste mês',
      readyForNextVisit: 'Pronto para o próximo atendimento concluído'
    },
    form: {
      name: 'Nome',
      specialty: 'Especialidade',
      licenseNumber: 'Registro',
      phone: 'Telefone',
      email: 'E-mail',
      commissionRate: 'Taxa de comissão (%)',
      commissionRatePlaceholder: 'ex: 15',
      reminderTitle: 'Lembrete de comissão',
      reminderDescription: 'Use a taxa para mostrar quem executou o serviço, quem responde pelo resultado e como a comissão aparece após a conclusão.',
      saving: 'Salvando...',
      update: 'Atualizar profissional',
      create: 'Adicionar profissional',
      cancel: 'Cancelar'
    },
    table: {
      emptyTitle: 'Nenhum profissional encontrado',
      emptyDescription: 'Cadastre o primeiro groomer ou atendente para mostrar responsável e comissão projetada na agenda.',
      addFirst: 'Adicionar primeiro profissional'
    },
    dialog: {
      title: 'Remover profissional?',
      description: '"{name}" será removido deste workspace.'
    }
  },
  petFinance: {
    eyebrow: 'Gestão Financeira',
    title: 'Caixa e Financeiro',
    description: 'Acompanhe entradas, saídas, pagamentos e o fluxo de caixa do seu petshop.',
    noPermission: 'Você não possui permissão para acessar o módulo financeiro.',
    loading: 'Carregando dados financeiros...',
    actions: {
      newMovement: 'Nova movimentação',
      newInvoice: 'Nova fatura',
      viewReport: 'Ver relatório',
      exportData: 'Exportar'
    },
    stats: {
      todayBalance: 'Saldo do dia',
      todayIncome: 'Entradas hoje',
      todayExpenses: 'Saídas hoje',
      pendingPayments: 'Pagamentos pendentes',
      monthRevenue: 'Receita do mês',
      openInvoices: 'Faturas em aberto'
    },
    cashMovements: {
      title: 'Movimentações de caixa',
      description: 'Histórico de entradas e saídas do caixa.',
      empty: 'Nenhuma movimentação registrada hoje.',
      emptyDescription: 'Registre a primeira entrada ou saída para iniciar o controle.',
      inbound: 'Entrada',
      outbound: 'Saída',
      categories: {
        sale: 'Venda',
        service: 'Serviço',
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
      description: 'Últimos pagamentos recebidos.',
      empty: 'Nenhum pagamento registrado.',
      methods: {
        cash: 'Dinheiro',
        credit: 'Crédito',
        debit: 'Débito',
        pix: 'PIX',
        transfer: 'Transferência',
        check: 'Cheque',
        other: 'Outros'
      }
    },
    form: {
      direction: 'Direção',
      category: 'Categoria',
      amount: 'Valor',
      description: 'Descrição',
      descriptionPlaceholder: 'Descreva a movimentação...',
      date: 'Data',
      save: 'Salvar',
      cancel: 'Cancelar'
    },
    filters: {
      title: 'Filtros',
      period: 'Período',
      direction: 'Direção',
      category: 'Categoria',
      today: 'Hoje',
      thisWeek: 'Esta semana',
      thisMonth: 'Este mês',
      lastMonth: 'Mês passado',
      allDirections: 'Todas as direções',
      allCategories: 'Todas as categorias'
    }
  },
  petTimeline: {
    eyebrow: 'Histórico Clínico',
    title: 'Timeline do Pet',
    description: 'Histórico completo de atendimentos, vacinas, prontuários e prescrições.',
    noPermission: 'Você não possui permissão para visualizar o histórico clínico.',
    loading: 'Carregando histórico clínico...',
    petNotFound: 'Pet não encontrado.',
    backToPets: 'Voltar para pets',
    filters: {
      title: 'Filtros',
      allTypes: 'Todos os tipos',
      period: 'Período',
      allTime: 'Todo o período',
      lastWeek: 'Última semana',
      lastMonth: 'Último mês',
      last3Months: 'Últimos 3 meses',
      lastYear: 'Último ano'
    },
    events: {
      empty: 'Nenhum evento clínico registrado para este pet.',
      emptyDescription: 'Registre prontuários, vacinas ou prescrições para construir o histórico clínico.',
      medicalRecord: 'Prontuário Médico',
      vaccination: 'Vacinação',
      prescription: 'Prescrição',
      appointment: 'Atendimento'
    },
    sections: {
      summary: 'Resumo clínico',
      vaccinations: 'Carteira de vacinação',
      prescriptions: 'Prescrições recentes',
      records: 'Prontuários'
    },
    stats: {
      totalEvents: 'Total de eventos',
      vaccinations: 'Vacinas aplicadas',
      records: 'Prontuários',
      prescriptions: 'Prescrições',
      lastVisit: 'Última visita'
    },
    actions: {
      addRecord: 'Novo prontuário',
      addVaccine: 'Registrar vacina',
      addPrescription: 'Nova prescrição',
      viewDetails: 'Ver detalhes',
      printHistory: 'Imprimir histórico'
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
    noPermission: 'Você não tem permissão para visualizar as cobranças.',
    title: 'Cobrança e próximo ciclo',
    description:
      'Mostre como os serviços viram faturas, pagamentos e uma previsão clara do próximo ciclo mensal.',
    filtersTitle: 'Filtros de cobrança',
    filtersDescription:
      'Refine a lista financeira por cliente ou ciclo sem perder a história comercial por trás de cada documento.',
    nextCycleTitle: 'Previsão de cobrança do próximo ciclo',
    pipelineTitle: 'Pipeline de cobrança',
    pipelineDescription: 'Revise status, saldo em aberto e o registro financeiro por trás de cada cobrança.'
  },
  workspaceSettings: {
    eyebrow: 'Configurações',
    title: 'Configurações do ambiente',
    editAction: 'Editar ambiente',
    planSectionTitle: 'Plano e situação',
    planSectionDescription: 'Veja o plano contratado, a situação do ambiente e o que fica visível para a equipe.',
    brandingSectionTitle: 'Prévia da identidade visual',
    brandingPreviewEyebrow: 'Prévia das cores',
    accentChip: 'Destaque',
    primaryChip: 'Cor principal',
    sampleAction: 'Ação de exemplo',
    logoAlt: 'Logo de {name}',
    themeSectionTitle: 'Tema',
    modulesSectionTitle: 'Módulos contratados',
    modulesLoading: 'Carregando os módulos contratados...',
    editor: {
      title: 'Editar ambiente',
      description: 'Atualize o nome, o logo e as cores do ambiente.',
      close: 'Fechar',
      nameLabel: 'Nome do ambiente',
      namePlaceholder: 'Ex.: Pet Shop Patas Felizes',
      logoLabel: 'URL do logo',
      logoPlaceholder: 'https://exemplo.com.br/logo.png',
      primaryLabel: 'Cor principal',
      accentLabel: 'Cor de destaque',
      themeLabel: 'Tema padrão',
      themeSystem: 'Seguir o sistema',
      themeLight: 'Sempre claro',
      themeDark: 'Sempre escuro',
      save: 'Salvar alterações',
      saving: 'Salvando...',
      cancel: 'Cancelar',
      saveError: 'Não foi possível salvar as alterações agora.'
    },
    overview: {
      pageDescription: {
        platformOwner:
          'Revise a identidade, as cores, o tema, os módulos contratados e a situação do ambiente da plataforma.',
        internalSupport:
          'Revise a configuração do ambiente do cliente em modo de suporte, sem acesso à administração da plataforma.',
        customer: 'Revise a identidade, as cores, o tema, os módulos contratados e a situação de {name}.'
      },
      identityEyebrow: {
        platformOwner: 'Administração da plataforma',
        internalSupport: 'Modo de suporte',
        customer: 'Seu ambiente'
      },
      identityDescription: {
        platformOwner:
          'Esta sessão está no ambiente dono da plataforma, onde ficam a administração compartilhada e a gestão dos clientes.',
        internalSupport:
          'Esta sessão é de um usuário interno de suporte dentro do ambiente de um cliente. O acesso continua restrito a esse cliente.',
        customer: 'Esta sessão mostra apenas o contrato, as cores e os módulos do seu ambiente.'
      },
      fields: {
        workspaceLabel: 'Tipo de ambiente',
        workspaceLabelDescription: 'Como este ambiente é apresentado na navegação.',
        accessScope: 'Escopo de acesso',
        accessScopeDescription: 'O que esta sessão alcança depois de aplicados o ambiente e o perfil.',
        tenantCode: 'Código do ambiente',
        tenantCodeDescription: 'Identificador fixo usado para entrar neste ambiente.',
        notAssigned: 'Não definido',
        sessionRole: 'Perfil da sessão',
        sessionUser: 'Usuário conectado: {name}.',
        sessionUserUnknown: 'Os dados do usuário não estão disponíveis nesta sessão.',
        unknownRole: 'Perfil desconhecido'
      },
      workspaceLabels: {
        support: 'Sessão de suporte',
        controlPlane: 'Painel da plataforma',
        workspace: 'Ambiente do cliente'
      },
      accessLabels: {
        impersonation: 'Acesso como suporte',
        platformOwner: 'Ambiente dono da plataforma',
        internalSupport: 'Suporte interno no contrato do cliente',
        contracted: 'Ambiente contratado'
      },
      roles: {
        PLATFORM_ADMIN: 'Admin da plataforma',
        SYS_ADMIN: 'Admin do sistema',
        TENANT_OWNER: 'Dono do ambiente',
        TENANT_ADMIN: 'Admin do ambiente',
        MANAGER: 'Gestor',
        OPERATOR: 'Operador',
        VIEWER: 'Leitura',
        CUSTOMER_PORTAL_USER: 'Usuário do portal'
      },
      plan: {
        label: 'Plano',
        platformOwner: {
          value: 'Ambiente da plataforma',
          description: 'Este ambiente pertence à PhaifferTech e concentra a administração da plataforma.'
        },
        internalSupport: {
          value: 'Sessão de suporte interno',
          description: 'O suporte está ativo, mas o acesso continua limitado ao ambiente deste cliente.'
        },
        multiProduct: {
          value: 'Vários produtos',
          description: '{count} produtos contratados estão ativos neste ambiente.'
        },
        singleProduct: {
          value: 'Um produto',
          description: 'Um produto contratado está ativo neste ambiente, junto com os serviços básicos.'
        },
        core: {
          value: 'Somente serviços básicos',
          description: 'Nenhum produto foi contratado ainda; só os serviços básicos estão ativos.'
        }
      },
      status: {
        label: 'Situação',
        error: {
          value: 'Requer atenção',
          description: 'Não foi possível confirmar os módulos contratados deste ambiente.'
        },
        loading: {
          value: 'Sincronizando',
          description: 'Os módulos contratados ainda estão carregando.'
        },
        coreOnly: {
          value: 'Somente básico',
          description: 'Nenhum módulo contratado; o ambiente usa apenas os serviços básicos.'
        },
        provisioning: {
          value: 'Em liberação',
          description: 'Pelo menos um módulo contratado ainda não foi liberado para a equipe.'
        },
        active: {
          value: 'Ativo',
          description: 'Todos os módulos contratados estão disponíveis.'
        }
      },
      visibility: {
        label: 'Visibilidade',
        platformOwner: {
          value: 'Visão completa da plataforma',
          description: 'Só o ambiente dono da plataforma pode ver a administração compartilhada.'
        },
        internalSupport: {
          value: 'Limitado ao cliente',
          description: 'O modo de suporte não transforma este cliente em ambiente da plataforma.'
        },
        customer: {
          value: 'Limitado ao seu ambiente',
          description: 'A equipe vê apenas o contrato, as permissões e os módulos deste ambiente.'
        }
      },
      branding: {
        description: {
          platformOwner: '{name} é o ambiente da plataforma. As cores próprias aparecem só nos pontos de destaque.',
          internalSupport: '{name} está sendo visto em modo de suporte, mantendo a identidade do cliente.',
          customer: '{name} usa suas cores nos pontos de destaque do sistema.'
        },
        policy:
          'As cores do ambiente aparecem nos destaques. O layout, os painéis neutros e o restante do visual seguem o padrão do sistema.',
        primaryLabel: 'Cor principal',
        primaryDescription: 'Usada em realces e fundos suaves com a marca.',
        accentLabel: 'Cor de destaque',
        accentDescription: 'Usada em botões principais, ênfases e avisos leves.',
        logoLabel: 'Logo',
        logoCustom: 'Logo próprio ativo',
        logoMonogram: 'Usando as iniciais',
        logoCustomDescription: 'O logo enviado aparece no cabeçalho e nos destaques.',
        logoMonogramDescription: 'Sem logo cadastrado, o sistema mostra as iniciais do ambiente.'
      },
      theme: {
        description: {
          platformOwner: 'Padrão de tema do ambiente da plataforma e a regra aplicada aos usuários.',
          internalSupport: 'O tema vem do ambiente do cliente que está sendo atendido.',
          customer: 'O tema segue o padrão do ambiente e a regra de personalização liberada para a equipe.'
        },
        modes: {
          light: 'Claro',
          dark: 'Escuro',
          system: 'Sistema'
        },
        currentLabel: 'Tema atual',
        currentDescription: 'Tema em uso neste navegador.',
        tenantDefaultLabel: 'Tema padrão do ambiente',
        tenantDefaultOverridable: 'Aplicado quando o usuário não escolheu um tema próprio.',
        tenantDefaultEnforced: 'Aplicado a todos, porque a personalização está desativada.',
        overrideLabel: 'Personalização',
        overrideEnabled: 'Liberada para o usuário',
        overrideManaged: 'Definida pelo ambiente',
        overrideEnabledDescription: 'Cada usuário pode escolher o próprio tema sem mudar o padrão do ambiente.',
        overrideManagedDescription: 'O tema é definido de forma central pelo ambiente.'
      },
      modules: {
        description: {
          platformOwner:
            'Mostra separadamente o contrato, a liberação de recursos e a disponibilidade final de cada módulo.',
          other: 'Aparecem aqui apenas os módulos do contrato deste ambiente, com a disponibilidade de cada um.'
        },
        catalog: {
          PET: {
            name: 'Gestão Pet',
            description: 'Agenda de banho e tosa, clientes, pets, planos, estoque e cobrança.'
          }
        },
        empty: 'Nenhum módulo contratado está disponível neste ambiente. Os serviços básicos continuam ativos.',
        available: 'Disponível no ambiente',
        availableDescription: 'O módulo contratado já está liberado para a equipe.',
        pending: 'Aguardando liberação',
        pendingDescription: 'O contrato está ativo, mas o módulo ainda não foi liberado para a equipe.',
        exposureEnabled: 'Recursos liberados',
        exposureEnabledDescription: 'As telas deste módulo já aparecem no menu.',
        exposurePending: 'Recursos pendentes',
        exposurePendingDescription: 'Algumas telas deste módulo ainda estão bloqueadas.',
        coreAccessNote:
          'Os serviços básicos (login, usuários e configurações) fazem parte de todo ambiente e não são contratados à parte.'
      }
    },
    security: {
      title: 'Segurança da conta',
      description: 'Troque sua senha sem sair do sistema.',
      activeAccount: 'Conta conectada',
      tenant: 'Ambiente',
      signOutWarning:
        'Ao trocar a senha, este navegador é desconectado, qualquer sessão de suporte salva é apagada e as demais sessões do usuário são encerradas.',
      forgotPasswordHint:
        'Se você não tiver mais acesso a esta sessão, use "Esqueci minha senha" na tela de login para receber um link de redefinição.',
      currentPassword: 'Senha atual',
      currentPasswordDescription: 'Confirme a senha atual antes de trocá-la.',
      newPassword: 'Nova senha',
      newPasswordDescription: 'Use uma senha diferente da atual.',
      confirmNewPassword: 'Confirme a nova senha',
      submit: 'Atualizar senha',
      submitting: 'Atualizando senha...',
      mismatch: 'A confirmação precisa ser igual à nova senha.',
      sameAsCurrent: 'A nova senha precisa ser diferente da atual.',
      genericError: 'Não foi possível atualizar a senha agora.'
    }
  },
  screens: ptBRScreens
} as const;

export type AppMessages = DeepWiden<typeof ptBRMessages>;

export { ptBRMessages };
