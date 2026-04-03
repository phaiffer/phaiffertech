import { describe, expect, it } from 'vitest';
import { resolvePetClientPrimaryResponsible } from '@/shared/lib/pet-client-primary-responsible';

describe('resolvePetClientPrimaryResponsible', () => {
  it('prefers the new primary responsible aliases when they are available', () => {
    expect(resolvePetClientPrimaryResponsible({
      name: 'Legacy client name',
      fullName: 'Legacy client full name',
      email: 'legacy@example.test',
      phone: '11999990000',
      primaryResponsibleName: 'Ana Responsible',
      primaryResponsibleEmail: 'ana@example.test',
      primaryResponsiblePhone: '11888887777'
    })).toEqual({
      name: 'Ana Responsible',
      email: 'ana@example.test',
      phone: '11888887777'
    });
  });

  it('falls back to the existing client fields for compatibility', () => {
    expect(resolvePetClientPrimaryResponsible({
      name: 'Ana Client',
      fullName: 'Ana Client',
      email: 'ana@example.test',
      phone: '11999990000'
    })).toEqual({
      name: 'Ana Client',
      email: 'ana@example.test',
      phone: '11999990000'
    });
  });
});
