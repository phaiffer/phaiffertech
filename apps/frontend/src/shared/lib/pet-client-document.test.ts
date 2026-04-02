import { describe, expect, it } from 'vitest';
import {
  formatPetClientDocumentDisplay,
  formatPetClientDocumentInput,
  inferPetClientDocumentType,
  isValidPetClientDocument,
  normalizePetClientDocumentNumber
} from '@/shared/lib/pet-client-document';

describe('pet client document helpers', () => {
  it('masks cpf input and normalizes it to digits', () => {
    expect(formatPetClientDocumentInput('CPF', '52998224725')).toBe('529.982.247-25');
    expect(normalizePetClientDocumentNumber('CPF', '529.982.247-25')).toBe('52998224725');
    expect(formatPetClientDocumentDisplay('CPF', '52998224725')).toBe('529.982.247-25');
  });

  it('validates cpf values and rejects invalid numbers', () => {
    expect(isValidPetClientDocument('CPF', '529.982.247-25')).toBe(true);
    expect(isValidPetClientDocument('CPF', '111.111.111-11')).toBe(false);
  });

  it('keeps rg values flexible and infers legacy types', () => {
    expect(formatPetClientDocumentInput('RG', 'mg 12.345.678')).toBe('MG 12.345.678');
    expect(isValidPetClientDocument('RG', 'MG 12.345.678')).toBe(true);
    expect(inferPetClientDocumentType(undefined, '52998224725')).toBe('CPF');
    expect(inferPetClientDocumentType(undefined, 'MG 12.345.678')).toBe('RG');
  });
});
