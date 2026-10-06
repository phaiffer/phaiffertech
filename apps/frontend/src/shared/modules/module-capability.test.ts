import { describe, expect, it } from 'vitest';
import {
  featureDisabledCapability,
  noDataCapability,
  notConfiguredCapability,
  permissionCapability,
  readyCapability,
  resolveModuleBoundaryCapability
} from '@/shared/modules/module-capability';

describe('module-capability', () => {
  it('builds ready capabilities as interactive states', () => {
    expect(readyCapability('active', 'en-US')).toEqual({
      kind: 'ready',
      interactive: true,
      status: 'active',
      actionLabel: 'Open workspace flow'
    });
  });

  it('builds a permission capability with locked interaction', () => {
    expect(permissionCapability({
      title: 'Dashboard permission required',
      description: 'The current role cannot open the dashboard.'
    }, 'en-US')).toEqual({
      kind: 'no-permission',
      interactive: false,
      status: 'no permission',
      title: 'Dashboard permission required',
      description: 'The current role cannot open the dashboard.',
      actionLabel: 'Unavailable in current workspace role'
    });
  });

  it('builds setup and no-data capabilities as guided interactive states', () => {
    expect(notConfiguredCapability({
      title: 'Setup required',
      description: 'Create the first records to configure this workspace.'
    }, 'en-US')).toEqual({
      kind: 'not-configured',
      interactive: true,
      status: 'setup required',
      title: 'Setup required',
      description: 'Create the first records to configure this workspace.',
      actionLabel: 'Open setup flow'
    });

    expect(noDataCapability({
      title: 'No telemetry yet',
      description: 'Signals will appear after the first collection cycle.'
    }, 'en-US')).toEqual({
      kind: 'no-data',
      interactive: true,
      status: 'no data',
      title: 'No telemetry yet',
      description: 'Signals will appear after the first collection cycle.',
      actionLabel: 'Open workspace flow'
    });
  });

  it('builds a feature-disabled capability for non-interactive states', () => {
    expect(featureDisabledCapability({
      title: 'Feature disabled',
      description: 'Exposure is currently disabled.'
    }, 'en-US')).toEqual({
      kind: 'feature-disabled',
      interactive: false,
      status: 'feature disabled',
      title: 'Feature disabled',
      description: 'Exposure is currently disabled.',
      actionLabel: 'Feature disabled in workspace'
    });
  });

  it('resolves module boundary states from the module catalog contract', () => {
    expect(resolveModuleBoundaryCapability('CRM', null, 'en-US')).toMatchObject({
      kind: 'not-contracted',
      interactive: false,
      status: 'unavailable',
      title: 'CRM is not contracted for this workspace'
    });

    expect(resolveModuleBoundaryCapability('CRM', {
      moduleEnabled: true,
      featureFlagEnabled: false,
      available: false
    }, 'en-US')).toMatchObject({
      kind: 'feature-disabled',
      interactive: false,
      status: 'feature disabled',
      title: 'CRM is disabled in the current workspace'
    });

    expect(resolveModuleBoundaryCapability('CRM', {
      moduleEnabled: true,
      featureFlagEnabled: true,
      available: false
    }, 'en-US')).toMatchObject({
      kind: 'unavailable',
      interactive: false,
      status: 'unavailable',
      title: 'CRM is unavailable in the current workspace'
    });
  });

  it('keeps Portuguese capability copy as the default without changing access state', () => {
    expect(permissionCapability({ title: 'Permissao necessaria', description: 'Acesso restrito.' })).toMatchObject({
      kind: 'no-permission',
      interactive: false,
      status: 'sem permissao',
      actionLabel: 'Indisponivel para este perfil'
    });
    expect(resolveModuleBoundaryCapability('CRM', null)).toMatchObject({
      kind: 'not-contracted',
      interactive: false,
      title: 'CRM nao esta contratado neste ambiente'
    });
  });
});
