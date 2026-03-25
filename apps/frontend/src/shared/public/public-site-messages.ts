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
      description: 'Entre com o workspace e suas credenciais para abrir a plataforma.',
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
      passwordResetNotice: 'Senha redefinida com sucesso. Entre novamente com a nova credencial.'
    },
    forgotPassword: {
      title: 'Redefinir senha',
      description: 'Informe o workspace e o e-mail da conta para solicitar um link de redefinição.',
      tenantCodeLabel: 'Empresa ou workspace',
      emailLabel: 'E-mail',
      submitLabel: 'Enviar link de redefinição',
      loadingLabel: 'Enviando...',
      successNotice: 'Se existir uma conta compatível com este workspace e e-mail, enviaremos um link de redefinição em instantes.',
      errorFallback: 'Falha inesperada ao solicitar a redefinição de senha.',
      backToLoginLabel: 'Voltar para o login'
    },
    resetPassword: {
      title: 'Definir nova senha',
      description: 'Escolha a nova senha para concluir a redefinição de acesso.',
      newPasswordLabel: 'Nova senha',
      confirmNewPasswordLabel: 'Confirmar nova senha',
      submitLabel: 'Atualizar senha',
      loadingLabel: 'Atualizando...',
      passwordMismatchError: 'A confirmação da nova senha não corresponde.',
      errorFallback: 'Falha inesperada ao redefinir a senha.',
      invalidTitle: 'Link de redefinição indisponível',
      invalidDescription: 'Este link é inválido, expirou ou já foi utilizado. Solicite um novo link para continuar.',
      requestNewLinkLabel: 'Solicitar novo link',
      backToLoginLabel: 'Voltar para o login'
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
      description: 'Sign in with your workspace and credentials to enter the platform.',
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
      passwordResetNotice: 'Password reset successfully. Sign in again with the new credential.'
    },
    forgotPassword: {
      title: 'Reset password',
      description: 'Enter the workspace code and account email to request a password reset link.',
      tenantCodeLabel: 'Company or workspace',
      emailLabel: 'Email',
      submitLabel: 'Send reset link',
      loadingLabel: 'Sending...',
      successNotice: 'If an account matches this workspace and email, we will send a reset link shortly.',
      errorFallback: 'Unexpected failure while requesting a password reset.',
      backToLoginLabel: 'Back to login'
    },
    resetPassword: {
      title: 'Set a new password',
      description: 'Choose a new password to complete the password reset flow.',
      newPasswordLabel: 'New password',
      confirmNewPasswordLabel: 'Confirm new password',
      submitLabel: 'Update password',
      loadingLabel: 'Updating...',
      passwordMismatchError: 'The new password confirmation does not match.',
      errorFallback: 'Unexpected failure while resetting the password.',
      invalidTitle: 'Reset link unavailable',
      invalidDescription: 'This link is invalid, expired or has already been used. Request a new link to continue.',
      requestNewLinkLabel: 'Request a new link',
      backToLoginLabel: 'Back to login'
    }
  }
} as const;

export function getPublicSiteMessages(locale: PublicLocale) {
  return publicSiteMessages[locale];
}
