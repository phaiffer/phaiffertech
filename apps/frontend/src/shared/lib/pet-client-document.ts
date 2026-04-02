import type { PetClientDocumentType } from '@/shared/types/pet';

const CPF_LENGTH = 11;

function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

function normalizeRg(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, ' ');
}

function calculateCpfDigit(value: string, length: number, weightStart: number) {
  let sum = 0;

  for (let index = 0; index < length; index += 1) {
    sum += Number(value[index]) * (weightStart - index);
  }

  const remainder = (sum * 10) % 11;
  return remainder === 10 ? 0 : remainder;
}

export function normalizePetClientDocumentType(value?: string | null): PetClientDocumentType | '' {
  if (!value) {
    return '';
  }

  const normalizedValue = value.trim().toUpperCase();
  if (normalizedValue === 'CPF' || normalizedValue === 'RG') {
    return normalizedValue;
  }

  return '';
}

export function inferPetClientDocumentType(
  documentType?: string | null,
  document?: string | null
): PetClientDocumentType | '' {
  const normalizedDocumentType = normalizePetClientDocumentType(documentType);
  if (normalizedDocumentType) {
    return normalizedDocumentType;
  }

  if (!document) {
    return '';
  }

  return onlyDigits(document).length === CPF_LENGTH ? 'CPF' : 'RG';
}

export function formatPetClientDocumentInput(documentType: string | null | undefined, value: string) {
  const normalizedDocumentType = normalizePetClientDocumentType(documentType);
  if (normalizedDocumentType !== 'CPF') {
    return normalizeRg(value);
  }

  const digits = onlyDigits(value).slice(0, CPF_LENGTH);
  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 6) {
    return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  }

  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function normalizePetClientDocumentNumber(documentType: string | null | undefined, value: string) {
  const normalizedDocumentType = normalizePetClientDocumentType(documentType);
  if (normalizedDocumentType === 'CPF') {
    return onlyDigits(value).slice(0, CPF_LENGTH);
  }

  return normalizeRg(value);
}

export function isValidPetClientDocument(documentType: string | null | undefined, value: string) {
  const normalizedDocumentType = normalizePetClientDocumentType(documentType);
  const normalizedValue = normalizePetClientDocumentNumber(normalizedDocumentType, value);

  if (!normalizedDocumentType || !normalizedValue) {
    return false;
  }

  if (normalizedDocumentType === 'RG') {
    return normalizedValue.length >= 3;
  }

  if (normalizedValue.length !== CPF_LENGTH || /^(\d)\1+$/.test(normalizedValue)) {
    return false;
  }

  return calculateCpfDigit(normalizedValue, 9, 10) === Number(normalizedValue[9])
    && calculateCpfDigit(normalizedValue, 10, 11) === Number(normalizedValue[10]);
}

export function formatPetClientDocumentDisplay(documentType: string | null | undefined, value?: string | null) {
  if (!value) {
    return '';
  }

  return formatPetClientDocumentInput(documentType, value);
}
