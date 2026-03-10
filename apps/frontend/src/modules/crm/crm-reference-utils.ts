type CanonicalReferenceInput = {
  compatibilityType?: string;
  referenceType?: string;
  moduleCode?: string;
  entityType?: string;
  fallbackReferenceType?: string;
};

export type CanonicalReferenceContext = {
  compatibilityType: string | null;
  referenceType: string | null;
  moduleCode: string | null;
  entityType: string | null;
  moduleLabel: string;
  entityLabel: string;
};

const editableCrmEntityTypes = new Set(['COMPANY', 'CONTACT', 'LEAD', 'DEAL']);

const moduleLabels: Record<string, string> = {
  CRM: 'CRM',
  IOT: 'IoT',
  PET: 'Pet'
};

const entityLabels: Record<string, string> = {
  ACTIVITY: 'Activity',
  APPOINTMENT: 'Appointment',
  CLIENT: 'Client',
  COMPANY: 'Company',
  CONTACT: 'Contact',
  DEAL: 'Deal',
  DEVICE: 'Device',
  LEAD: 'Lead',
  MAINTENANCE: 'Maintenance',
  MEDICAL_RECORD: 'Medical Record',
  NOTE: 'Note',
  PRESCRIPTION: 'Prescription',
  PROFILE: 'Profile',
  SERVICE: 'Service',
  TASK: 'Task',
  VACCINATION: 'Vaccination'
};

function normalizeToken(value?: string | null) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed
    .toUpperCase()
    .replace(':', '.')
    .replace('-', '_')
    .replace(' ', '_');
}

function parseModuleEntity(referenceType?: string | null) {
  const normalized = normalizeToken(referenceType);
  if (!normalized) {
    return null;
  }

  if (!normalized.includes('.')) {
    return null;
  }

  const [moduleCode, entityType] = normalized.split('.', 2);
  if (!moduleCode || !entityType) {
    return null;
  }

  return { moduleCode, entityType };
}

function humanizeToken(value?: string | null) {
  const normalized = normalizeToken(value);
  if (!normalized) {
    return 'Reference';
  }

  return normalized
    .split('_')
    .map((segment) => segment.charAt(0) + segment.slice(1).toLowerCase())
    .join(' ');
}

export function resolveCanonicalReference(input: CanonicalReferenceInput): CanonicalReferenceContext {
  const compatibilityType = normalizeToken(input.compatibilityType);
  const canonicalReferenceType = normalizeToken(input.referenceType ?? input.fallbackReferenceType);

  let moduleCode = normalizeToken(input.moduleCode);
  let entityType = normalizeToken(input.entityType);

  const canonicalParts = parseModuleEntity(canonicalReferenceType);
  if (canonicalParts) {
    moduleCode = moduleCode ?? canonicalParts.moduleCode;
    entityType = entityType ?? canonicalParts.entityType;
  }

  const compatibilityParts = parseModuleEntity(compatibilityType);
  if (!moduleCode || !entityType) {
    if (compatibilityParts) {
      moduleCode = moduleCode ?? compatibilityParts.moduleCode;
      entityType = entityType ?? compatibilityParts.entityType;
    } else if (compatibilityType) {
      moduleCode = moduleCode ?? 'CRM';
      entityType = entityType ?? compatibilityType;
    }
  }

  const referenceType = canonicalReferenceType ?? (moduleCode && entityType ? `${moduleCode}.${entityType}` : compatibilityType);
  const resolvedCompatibilityType = compatibilityType ?? (moduleCode === 'CRM' ? entityType : referenceType);

  return {
    compatibilityType: resolvedCompatibilityType ?? null,
    referenceType: referenceType ?? null,
    moduleCode: moduleCode ?? null,
    entityType: entityType ?? null,
    moduleLabel: moduleCode ? (moduleLabels[moduleCode] ?? moduleCode) : 'Reference',
    entityLabel: entityType ? (entityLabels[entityType] ?? humanizeToken(entityType)) : 'Reference'
  };
}

export function buildReferenceSummary(context: CanonicalReferenceContext) {
  return context.moduleCode && context.entityType
    ? `${context.moduleLabel} / ${context.entityLabel}`
    : (context.compatibilityType ?? 'Sem vínculo');
}

export function buildReferenceDetail(context: CanonicalReferenceContext, relatedId?: string | null) {
  const parts = [context.referenceType ?? context.compatibilityType];
  if (relatedId) {
    parts.push(relatedId.slice(0, 8));
  }
  return parts.filter(Boolean).join(' · ');
}

export function isCrmEditableReference(context: CanonicalReferenceContext) {
  return context.moduleCode === 'CRM'
    && Boolean(context.entityType)
    && editableCrmEntityTypes.has(context.entityType as string);
}
