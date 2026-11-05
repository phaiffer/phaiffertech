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
    entityType: entityType ?? null
  };
}
