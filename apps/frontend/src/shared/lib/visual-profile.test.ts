import { describe, expect, it } from 'vitest';
import { resolveVisualProfile, resolveVisualProfileKey } from '@/shared/lib/visual-profile';

describe('visual-profile', () => {
  it('maps historical industrial tenant codes to the neutral operations profile', () => {
    expect(resolveVisualProfileKey({
      tenantCode: 'iot-plant-north',
      defaultProfile: 'core-institutional'
    })).toBe('operations-industrial');
  });

  it('uses module context when the tenant is generic', () => {
    expect(resolveVisualProfileKey({
      tenantCode: 'workspace-default',
      moduleContext: 'crm',
      defaultProfile: 'core-institutional'
    })).toBe('crm-corporate');
  });

  it('falls back to the preset default when there are no stronger signals', () => {
    expect(resolveVisualProfileKey({
      tenantCode: 'workspace-default',
      defaultProfile: 'operations-industrial'
    })).toBe('operations-industrial');
  });

  it('keeps the pet module sensitive to grooming hints', () => {
    expect(resolveVisualProfileKey({
      tenantCode: 'pet-spa-north',
      moduleContext: 'pet',
      defaultProfile: 'pet-clinic'
    })).toBe('pet-grooming');
  });

  it('keeps tenant colors while applying the resolved visual profile', () => {
    const profile = resolveVisualProfile({
      tenantCode: 'factory-south',
      accentColor: '#123456',
      primaryColor: '#654321'
    });

    expect(profile.key).toBe('operations-industrial');
    expect(profile.accentColor).toBe('#123456');
    expect(profile.primaryColor).toBe('#654321');
    expect(profile.illustrationPreset).toBe('industrial-signals');
  });
});
