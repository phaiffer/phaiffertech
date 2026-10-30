/**
 * Formata um número de telefone para exibição: (XX) XXXXX-XXXX
 * Remove qualquer caractere não-numérico antes de formatar.
 * Suporta celular (11 dígitos) e fixo (10 dígitos), com ou sem o prefixo +55.
 */
const BRAZIL_COUNTRY_CODE = '55';
const MAX_NATIONAL_DIGITS = 11;

export function formatPhoneDisplay(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 0) return '';
  // 55 is also a valid DDD, so only treat it as the country code beyond 11 digits.
  const hasCountryCode = digits.length > MAX_NATIONAL_DIGITS && digits.startsWith(BRAZIL_COUNTRY_CODE);
  if (hasCountryCode) {
    return `+${BRAZIL_COUNTRY_CODE} ${formatNationalPhone(digits.slice(BRAZIL_COUNTRY_CODE.length))}`;
  }
  return formatNationalPhone(digits);
}

function formatNationalPhone(digits: string): string {
  if (digits.length <= 10) {
    // Fixo: (XX) XXXX-XXXX
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
  }
  // Celular: (XX) XXXXX-XXXX
  return digits
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
}

/**
 * Remove a máscara — retorna apenas dígitos para salvar no banco.
 */
export function stripPhoneMask(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Aplica máscara progressivamente enquanto o usuário digita.
 * Limita a 11 dígitos (celular brasileiro).
 */
export function maskPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return formatPhoneDisplay(digits);
}
