'use client';

import { useAppI18n } from '@/shared/i18n/app-i18n-provider';
import type { AppMessages } from '@/shared/i18n/messages/pt-br';

type StatusBadgeProps = {
  status?: string | null;
};

// Comanda v2: status is a 7px dot + text (never a pastel pill). Tones map to
// `.ui-status-dot[data-status]` in globals.css.
type StatusTone = 'waiting' | 'in-progress' | 'done' | 'warn' | 'danger';

const toneMap: Record<string, StatusTone> = {
  ok: 'done',
  active: 'done',
  ativo: 'done',
  completed: 'done',
  paid: 'done',
  won: 'done',
  resolved: 'done',
  resolvido: 'done',
  online: 'done',
  info: 'in-progress',
  confirmed: 'waiting',
  confirmado: 'waiting',
  'platform owner': 'in-progress',
  'platform admin': 'in-progress',
  neutral: 'waiting',
  restricted: 'waiting',
  restrito: 'waiting',
  locked: 'waiting',
  unavailable: 'waiting',
  indisponivel: 'waiting',
  'no permission': 'waiting',
  'sem permissao': 'waiting',
  'feature disabled': 'waiting',
  'recurso desativado': 'waiting',
  inactive: 'waiting',
  draft: 'waiting',
  inativo: 'waiting',
  'customer tenant': 'waiting',
  viewer: 'waiting',
  operator: 'waiting',
  manager: 'waiting',
  'tenant owner': 'waiting',
  'tenant admin': 'waiting',
  'customer portal user': 'waiting',
  open: 'in-progress',
  'no data': 'in-progress',
  'sem dados': 'in-progress',
  issued: 'in-progress',
  warn: 'warn',
  pending: 'waiting',
  pendente: 'waiting',
  scheduled: 'waiting',
  agendada: 'waiting',
  'setup required': 'warn',
  'configuracao necessaria': 'warn',
  overdue: 'warn',
  maintenance: 'warn',
  'em manutenção': 'warn',
  acknowledged: 'warn',
  reconhecido: 'warn',
  'in progress': 'in-progress',
  'em progresso': 'in-progress',
  baixa: 'done',
  média: 'warn',
  media: 'warn',
  alta: 'danger',
  alert: 'danger',
  'em alerta': 'danger',
  offline: 'danger',
  critical: 'danger',
  crítica: 'danger',
  critica: 'danger',
  lost: 'danger',
  error: 'danger',
  canceled: 'danger',
  cancelled: 'danger',
  'no show': 'danger',
  done: 'done',
  documented: 'done',
  low: 'done',
  medium: 'warn',
  high: 'danger',
};

const labelMap: Record<string, string> = {
  ok: 'Ok',
  active: 'Ativo',
  ativo: 'Ativo',
  completed: 'Concluído',
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
  unavailable: 'Indisponível',
  indisponivel: 'Indisponível',
  'no permission': 'Sem permissão',
  'sem permissao': 'Sem permissão',
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
  'customer portal user': 'Usuário do portal',
  open: 'Em aberto',
  'no data': 'Sem dados',
  'sem dados': 'Sem dados',
  issued: 'Emitida',
  warn: 'Atenção',
  pending: 'Pendente',
  pendente: 'Pendente',
  scheduled: 'Agendada',
  agendada: 'Agendada',
  'setup required': 'Configuração necessária',
  'configuracao necessaria': 'Configuração necessária',
  overdue: 'Vencida',
  maintenance: 'Em manutenção',
  'em manutenção': 'Em manutenção',
  acknowledged: 'Reconhecido',
  reconhecido: 'Reconhecido',
  'in progress': 'Em progresso',
  'em progresso': 'Em progresso',
  baixa: 'Baixa',
  média: 'Média',
  media: 'Média',
  alta: 'Alta',
  alert: 'Alerta',
  'em alerta': 'Em alerta',
  offline: 'Offline',
  critical: 'Crítico',
  crítica: 'Crítico',
  critica: 'Crítico',
  lost: 'Perdido',
  error: 'Erro',
  canceled: 'Cancelada',
  cancelled: 'Cancelada',
  'no show': 'Não compareceu',
  done: 'Concluída',
  documented: 'Documentado',
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
};

// Backend enums arrive as IN_PROGRESS / NO_SHOW, while the maps are keyed by spaced words.
function normalizeStatus(status: string): string {
  return status.trim().toLowerCase().replace(/[_-]+/g, ' ');
}

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
  const normalized = normalizeStatus(status);
  if (locale === 'en-US' && capabilityStatusKeys[normalized]) {
    return badgeCopy[capabilityStatusKeys[normalized]];
  }
  // The label map is Portuguese; English shows the backend token itself ("in progress" -> "In Progress").
  if (locale !== 'en-US' && labelMap[normalized]) {
    return labelMap[normalized];
  }

  return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { locale, messages } = useAppI18n();
  if (!status) {
    return null;
  }

  const tone = toneMap[normalizeStatus(status)] ?? 'waiting';

  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[13px] text-slate-700">
      <span className="ui-status-dot" data-status={tone} aria-hidden="true" />
      {prettify(status, locale, messages.moduleCapability.badge)}
    </span>
  );
}
