'use client';

import { useAppI18n } from '@/shared/i18n/app-i18n-provider';
import type { AppMessages } from '@/shared/i18n/messages/pt-br';

type StatusBadgeProps = {
  status?: string | null;
};

const toneMap: Record<string, string> = {
  ok: 'border-success/30 bg-success-muted text-success',
  active: 'border-success/30 bg-success-muted text-success',
  ativo: 'border-success/30 bg-success-muted text-success',
  completed: 'border-success/30 bg-success-muted text-success',
  paid: 'border-success/30 bg-success-muted text-success',
  won: 'border-success/30 bg-success-muted text-success',
  resolved: 'border-success/30 bg-success-muted text-success',
  resolvido: 'border-success/30 bg-success-muted text-success',
  online: 'border-success/30 bg-success-muted text-success',
  info: 'border-info/30 bg-info-muted text-info',
  confirmed: 'border-info/30 bg-info-muted text-info',
  confirmado: 'border-info/30 bg-info-muted text-info',
  'platform owner': 'border-info/30 bg-info-muted text-info',
  'platform admin': 'border-info/30 bg-info-muted text-info',
  neutral: 'border-border bg-surface-inset text-muted',
  restricted: 'border-border bg-surface-inset text-muted',
  restrito: 'border-border bg-surface-inset text-muted',
  locked: 'border-border bg-surface-inset text-muted',
  unavailable: 'border-border bg-surface-inset text-muted',
  indisponivel: 'border-border bg-surface-inset text-muted',
  'no permission': 'border-border bg-surface-inset text-muted',
  'sem permissao': 'border-border bg-surface-inset text-muted',
  'feature disabled': 'border-border bg-surface-inset text-muted',
  'recurso desativado': 'border-border bg-surface-inset text-muted',
  inactive: 'border-border bg-surface-inset text-muted',
  draft: 'border-border bg-surface-inset text-muted',
  inativo: 'border-border bg-surface-inset text-muted',
  'customer tenant': 'border-border bg-surface-inset text-muted',
  viewer: 'border-border bg-surface-inset text-muted',
  operator: 'border-border bg-surface-inset text-muted',
  manager: 'border-border bg-surface-inset text-muted',
  'tenant owner': 'border-border bg-surface-inset text-muted',
  'tenant admin': 'border-border bg-surface-inset text-muted',
  'customer portal user': 'border-border bg-surface-inset text-muted',
  open: 'border-info/30 bg-info-muted text-info',
  'no data': 'border-info/30 bg-info-muted text-info',
  'sem dados': 'border-info/30 bg-info-muted text-info',
  issued: 'border-info/30 bg-info-muted text-info',
  warn: 'border-warning/30 bg-warning-muted text-warning',
  pending: 'border-warning/30 bg-warning-muted text-warning',
  pendente: 'border-warning/30 bg-warning-muted text-warning',
  scheduled: 'border-warning/30 bg-warning-muted text-warning',
  agendada: 'border-warning/30 bg-warning-muted text-warning',
  'setup required': 'border-warning/30 bg-warning-muted text-warning',
  'configuracao necessaria': 'border-warning/30 bg-warning-muted text-warning',
  overdue: 'border-warning/30 bg-warning-muted text-warning',
  maintenance: 'border-warning/30 bg-warning-muted text-warning',
  'em manutenção': 'border-warning/30 bg-warning-muted text-warning',
  acknowledged: 'border-warning/30 bg-warning-muted text-warning',
  reconhecido: 'border-warning/30 bg-warning-muted text-warning',
  'in progress': 'border-warning/30 bg-warning-muted text-warning',
  'em progresso': 'border-warning/30 bg-warning-muted text-warning',
  baixa: 'border-success/30 bg-success-muted text-success',
  média: 'border-warning/30 bg-warning-muted text-warning',
  media: 'border-warning/30 bg-warning-muted text-warning',
  alta: 'border-destructive/30 bg-destructive-muted text-destructive',
  alert: 'border-destructive/30 bg-destructive-muted text-destructive',
  'em alerta': 'border-destructive/30 bg-destructive-muted text-destructive',
  offline: 'border-destructive/30 bg-destructive-muted text-destructive',
  critical: 'border-destructive/30 bg-destructive-muted text-destructive',
  crítica: 'border-destructive/30 bg-destructive-muted text-destructive',
  critica: 'border-destructive/30 bg-destructive-muted text-destructive',
  lost: 'border-destructive/30 bg-destructive-muted text-destructive',
  error: 'border-destructive/30 bg-destructive-muted text-destructive',
  canceled: 'border-destructive/30 bg-destructive-muted text-destructive',
  cancelled: 'border-destructive/30 bg-destructive-muted text-destructive',
  'no show': 'border-destructive/30 bg-destructive-muted text-destructive',
};

const labelMap: Record<string, string> = {
  ok: 'Ok',
  active: 'Ativo',
  ativo: 'Ativo',
  completed: 'Concluido',
  paid: 'Pago',
  won: 'Ganho',
  resolved: 'Resolvido',
  resolvido: 'Resolvido',
  online: 'Online',
  info: 'Info',
  confirmed: 'Confirmado',
  confirmado: 'Confirmado',
  'platform owner': 'Dono da plataforma',
  'platform admin': 'Admin da plataforma',
  neutral: 'Neutro',
  restricted: 'Restrito',
  restrito: 'Restrito',
  locked: 'Bloqueado',
  unavailable: 'Indisponivel',
  indisponivel: 'Indisponivel',
  'no permission': 'Sem permissao',
  'sem permissao': 'Sem permissao',
  'feature disabled': 'Recurso desativado',
  'recurso desativado': 'Recurso desativado',
  inactive: 'Inativo',
  draft: 'Rascunho',
  inativo: 'Inativo',
  'customer tenant': 'Cliente',
  viewer: 'Leitura',
  operator: 'Operador',
  manager: 'Gestor',
  'tenant owner': 'Dono do ambiente',
  'tenant admin': 'Admin do ambiente',
  'customer portal user': 'Usuario do portal',
  open: 'Em aberto',
  'no data': 'Sem dados',
  'sem dados': 'Sem dados',
  issued: 'Emitida',
  warn: 'Atencao',
  pending: 'Pendente',
  pendente: 'Pendente',
  scheduled: 'Agendada',
  agendada: 'Agendada',
  'setup required': 'Configuracao necessaria',
  'configuracao necessaria': 'Configuracao necessaria',
  overdue: 'Vencida',
  maintenance: 'Em manutencao',
  'em manutenção': 'Em manutencao',
  acknowledged: 'Reconhecido',
  reconhecido: 'Reconhecido',
  'in progress': 'Em progresso',
  'em progresso': 'Em progresso',
  baixa: 'Baixa',
  média: 'Media',
  media: 'Media',
  alta: 'Alta',
  alert: 'Alerta',
  'em alerta': 'Em alerta',
  offline: 'Offline',
  critical: 'Critico',
  crítica: 'Critico',
  critica: 'Critico',
  lost: 'Perdido',
  error: 'Erro',
  canceled: 'Cancelada',
  cancelled: 'Cancelada',
  'no show': 'Nao compareceu',
};

const capabilityStatusKeys: Record<string, keyof AppMessages['moduleCapability']['badge']> = {
  'no permission': 'noPermission',
  'sem permissao': 'noPermission',
  'feature disabled': 'featureDisabled',
  'recurso desativado': 'featureDisabled',
  'setup required': 'setupRequired',
  'configuracao necessaria': 'setupRequired',
  'no data': 'noData',
  'sem dados': 'noData',
  unavailable: 'unavailable',
  indisponivel: 'unavailable'
};

function prettify(status: string, locale: string, badgeCopy: AppMessages['moduleCapability']['badge']) {
  const normalized = status.trim().toLowerCase();
  if (locale === 'en-US' && capabilityStatusKeys[normalized]) {
    return badgeCopy[capabilityStatusKeys[normalized]];
  }
  if (labelMap[normalized]) {
    return labelMap[normalized];
  }

  return normalized
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { locale, messages } = useAppI18n();
  if (!status) {
    return null;
  }

  const normalized = status.trim().toLowerCase();
  const classes = toneMap[normalized] ?? 'border-border bg-surface-inset text-muted';

  return (
    <span
      className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-2xs font-medium ${classes}`}
    >
      {prettify(status, locale, messages.moduleCapability.badge)}
    </span>
  );
}
