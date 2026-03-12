import type { AuthenticatedUser } from '@/shared/types/auth';

export type VisualProfileKey =
  | 'core-institutional'
  | 'crm-corporate'
  | 'iot-industrial'
  | 'pet-clinic'
  | 'pet-grooming';

export type VisualProfileModuleContext = 'core' | 'crm' | 'iot' | 'pet';

export type VisualProfileBackgroundMood = {
  softness: 'soft' | 'balanced';
  accentOpacity: number;
  supportOpacity: number;
  accentAnchor: string;
  supportAnchor: string;
};

export type VisualProfileSurfaceNuance = {
  tintOpacity: number;
  borderOpacity: number;
  elevation: 'quiet' | 'soft';
};

export type VisualProfileAccentTone = {
  emphasis: 'institutional' | 'corporate' | 'industrial' | 'clinical' | 'care';
  softAlpha: number;
  highlightAlpha: number;
};

export type VisualProfileIconTone = {
  emphasisOpacity: number;
  mutedOpacity: number;
};

export type VisualProfileHighlightTone = {
  accentOpacity: number;
  supportOpacity: number;
};

export type VisualProfileLoginContext = {
  accentOpacity: number;
  supportOpacity: number;
  cardTintOpacity: number;
  cardBorderOpacity: number;
  brandMarkOpacity: number;
};

export type VisualProfilePreset = {
  key: VisualProfileKey;
  label: string;
  accentFallback: string;
  primaryFallback: string;
  accentTone: VisualProfileAccentTone;
  backgroundMood: VisualProfileBackgroundMood;
  surfaceNuance: VisualProfileSurfaceNuance;
  iconTone: VisualProfileIconTone;
  chartHighlightTone: VisualProfileHighlightTone;
  dashboardHighlightTone: VisualProfileHighlightTone;
  loginVisualContext: VisualProfileLoginContext;
  illustrationPreset:
    | 'institutional-grid'
    | 'corporate-flow'
    | 'industrial-signals'
    | 'clinical-care'
    | 'grooming-rhythm';
};

export type VisualProfile = VisualProfilePreset & {
  accentColor: string;
  primaryColor: string;
};

export type VisualProfileResolutionInput = {
  tenantCode?: string | null;
  moduleContext?: VisualProfileModuleContext | null;
  defaultProfile?: VisualProfileKey | null;
  accentColor?: string | null;
  primaryColor?: string | null;
};

export const coreInstitutionalProfile: VisualProfilePreset = {
  key: 'core-institutional',
  label: 'Core Institutional',
  accentFallback: '#2563eb',
  primaryFallback: '#0f172a',
  accentTone: {
    emphasis: 'institutional',
    softAlpha: 0.18,
    highlightAlpha: 0.14
  },
  backgroundMood: {
    softness: 'soft',
    accentOpacity: 0.12,
    supportOpacity: 0.1,
    accentAnchor: 'top left',
    supportAnchor: 'bottom right'
  },
  surfaceNuance: {
    tintOpacity: 0.16,
    borderOpacity: 0.18,
    elevation: 'quiet'
  },
  iconTone: {
    emphasisOpacity: 0.18,
    mutedOpacity: 0.1
  },
  chartHighlightTone: {
    accentOpacity: 0.22,
    supportOpacity: 0.14
  },
  dashboardHighlightTone: {
    accentOpacity: 0.14,
    supportOpacity: 0.1
  },
  loginVisualContext: {
    accentOpacity: 0.12,
    supportOpacity: 0.12,
    cardTintOpacity: 0.05,
    cardBorderOpacity: 0.18,
    brandMarkOpacity: 0.16
  },
  illustrationPreset: 'institutional-grid'
};

export const crmCorporateProfile: VisualProfilePreset = {
  key: 'crm-corporate',
  label: 'CRM Corporate',
  accentFallback: '#4f46e5',
  primaryFallback: '#111827',
  accentTone: {
    emphasis: 'corporate',
    softAlpha: 0.16,
    highlightAlpha: 0.16
  },
  backgroundMood: {
    softness: 'soft',
    accentOpacity: 0.1,
    supportOpacity: 0.08,
    accentAnchor: 'top center',
    supportAnchor: 'bottom right'
  },
  surfaceNuance: {
    tintOpacity: 0.14,
    borderOpacity: 0.16,
    elevation: 'quiet'
  },
  iconTone: {
    emphasisOpacity: 0.16,
    mutedOpacity: 0.08
  },
  chartHighlightTone: {
    accentOpacity: 0.24,
    supportOpacity: 0.12
  },
  dashboardHighlightTone: {
    accentOpacity: 0.12,
    supportOpacity: 0.08
  },
  loginVisualContext: {
    accentOpacity: 0.1,
    supportOpacity: 0.1,
    cardTintOpacity: 0.04,
    cardBorderOpacity: 0.16,
    brandMarkOpacity: 0.14
  },
  illustrationPreset: 'corporate-flow'
};

export const iotIndustrialProfile: VisualProfilePreset = {
  key: 'iot-industrial',
  label: 'IoT Industrial',
  accentFallback: '#0891b2',
  primaryFallback: '#0f172a',
  accentTone: {
    emphasis: 'industrial',
    softAlpha: 0.14,
    highlightAlpha: 0.18
  },
  backgroundMood: {
    softness: 'balanced',
    accentOpacity: 0.1,
    supportOpacity: 0.12,
    accentAnchor: 'top right',
    supportAnchor: 'bottom left'
  },
  surfaceNuance: {
    tintOpacity: 0.12,
    borderOpacity: 0.16,
    elevation: 'soft'
  },
  iconTone: {
    emphasisOpacity: 0.18,
    mutedOpacity: 0.1
  },
  chartHighlightTone: {
    accentOpacity: 0.28,
    supportOpacity: 0.16
  },
  dashboardHighlightTone: {
    accentOpacity: 0.14,
    supportOpacity: 0.12
  },
  loginVisualContext: {
    accentOpacity: 0.1,
    supportOpacity: 0.12,
    cardTintOpacity: 0.04,
    cardBorderOpacity: 0.18,
    brandMarkOpacity: 0.14
  },
  illustrationPreset: 'industrial-signals'
};

export const petClinicProfile: VisualProfilePreset = {
  key: 'pet-clinic',
  label: 'Pet Clinic',
  accentFallback: '#0f766e',
  primaryFallback: '#164e63',
  accentTone: {
    emphasis: 'clinical',
    softAlpha: 0.18,
    highlightAlpha: 0.14
  },
  backgroundMood: {
    softness: 'soft',
    accentOpacity: 0.11,
    supportOpacity: 0.09,
    accentAnchor: 'top left',
    supportAnchor: 'bottom center'
  },
  surfaceNuance: {
    tintOpacity: 0.15,
    borderOpacity: 0.17,
    elevation: 'quiet'
  },
  iconTone: {
    emphasisOpacity: 0.16,
    mutedOpacity: 0.08
  },
  chartHighlightTone: {
    accentOpacity: 0.22,
    supportOpacity: 0.12
  },
  dashboardHighlightTone: {
    accentOpacity: 0.12,
    supportOpacity: 0.09
  },
  loginVisualContext: {
    accentOpacity: 0.11,
    supportOpacity: 0.1,
    cardTintOpacity: 0.05,
    cardBorderOpacity: 0.16,
    brandMarkOpacity: 0.15
  },
  illustrationPreset: 'clinical-care'
};

export const petGroomingProfile: VisualProfilePreset = {
  key: 'pet-grooming',
  label: 'Pet Grooming',
  accentFallback: '#d97706',
  primaryFallback: '#7c2d12',
  accentTone: {
    emphasis: 'care',
    softAlpha: 0.2,
    highlightAlpha: 0.16
  },
  backgroundMood: {
    softness: 'soft',
    accentOpacity: 0.12,
    supportOpacity: 0.08,
    accentAnchor: 'top center',
    supportAnchor: 'bottom left'
  },
  surfaceNuance: {
    tintOpacity: 0.16,
    borderOpacity: 0.18,
    elevation: 'quiet'
  },
  iconTone: {
    emphasisOpacity: 0.18,
    mutedOpacity: 0.08
  },
  chartHighlightTone: {
    accentOpacity: 0.24,
    supportOpacity: 0.1
  },
  dashboardHighlightTone: {
    accentOpacity: 0.14,
    supportOpacity: 0.08
  },
  loginVisualContext: {
    accentOpacity: 0.12,
    supportOpacity: 0.08,
    cardTintOpacity: 0.05,
    cardBorderOpacity: 0.18,
    brandMarkOpacity: 0.16
  },
  illustrationPreset: 'grooming-rhythm'
};

const visualProfilePresets: Record<VisualProfileKey, VisualProfilePreset> = {
  'core-institutional': coreInstitutionalProfile,
  'crm-corporate': crmCorporateProfile,
  'iot-industrial': iotIndustrialProfile,
  'pet-clinic': petClinicProfile,
  'pet-grooming': petGroomingProfile
};

export function getVisualProfilePreset(key: VisualProfileKey) {
  return visualProfilePresets[key];
}

export function resolveVisualProfileKey(
  input: Pick<VisualProfileResolutionInput, 'tenantCode' | 'moduleContext' | 'defaultProfile'> = {}
): VisualProfileKey {
  const tenantCode = input.tenantCode?.trim().toLowerCase() ?? '';
  const tenantTokens = tokenizeTenantCode(tenantCode);

  if (hasTenantKeyword(tenantTokens, ['groom', 'banho', 'tosa', 'spa'])) {
    return 'pet-grooming';
  }

  if (hasTenantKeyword(tenantTokens, ['pet', 'vet', 'clinic', 'clinica'])) {
    return 'pet-clinic';
  }

  if (hasTenantKeyword(tenantTokens, ['iot', 'plant', 'factory', 'industrial', 'manuf'])) {
    return 'iot-industrial';
  }

  if (hasTenantKeyword(tenantTokens, ['crm', 'corp', 'sales', 'commercial'])) {
    return 'crm-corporate';
  }

  if (input.moduleContext === 'crm') {
    return 'crm-corporate';
  }

  if (input.moduleContext === 'iot') {
    return 'iot-industrial';
  }

  if (input.moduleContext === 'pet') {
    if (input.defaultProfile === 'pet-grooming') {
      return 'pet-grooming';
    }

    return 'pet-clinic';
  }

  return input.defaultProfile ?? 'core-institutional';
}

export function resolveVisualProfile(input: VisualProfileResolutionInput = {}): VisualProfile {
  const key = resolveVisualProfileKey(input);
  const preset = getVisualProfilePreset(key);

  return {
    ...preset,
    accentColor: input.accentColor || preset.accentFallback,
    primaryColor: input.primaryColor || preset.primaryFallback
  };
}

export function resolveUserVisualProfile(
  user?: AuthenticatedUser | null,
  options: Pick<VisualProfileResolutionInput, 'moduleContext' | 'defaultProfile'> = {}
) {
  return resolveVisualProfile({
    tenantCode: user?.tenantCode,
    accentColor: user?.tenantAccentColor,
    primaryColor: user?.tenantPrimaryColor,
    moduleContext: options.moduleContext,
    defaultProfile: options.defaultProfile
  });
}

export function withAlpha(hexColor: string, alpha: number) {
  const normalized = hexColor.replace('#', '');

  if (normalized.length !== 6) {
    return hexColor;
  }

  const red = parseInt(normalized.slice(0, 2), 16);
  const green = parseInt(normalized.slice(2, 4), 16);
  const blue = parseInt(normalized.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function tokenizeTenantCode(tenantCode: string) {
  return tenantCode.split(/[^a-z0-9]+/).filter(Boolean);
}

function hasTenantKeyword(tokens: string[], keywords: string[]) {
  return keywords.some((keyword) => tokens.some((token) => (
    token === keyword
    || token.startsWith(keyword)
    || (keyword.length >= 4 && token.includes(keyword))
  )));
}
