import { describe, expect, it } from 'vitest';
import { formatPhoneDisplay, stripPhoneMask } from '@/shared/lib/phone';

describe('formatPhoneDisplay', () => {
  it('formats national mobile and landline numbers', () => {
    expect(formatPhoneDisplay('41997101101')).toBe('(41) 99710-1101');
    expect(formatPhoneDisplay('4132001100')).toBe('(41) 3200-1100');
  });

  it('keeps the +55 country code apart from the DDD', () => {
    expect(formatPhoneDisplay('+55 41 99710-1101')).toBe('+55 (41) 99710-1101');
    expect(formatPhoneDisplay('+55 41 3200-1100')).toBe('+55 (41) 3200-1100');
  });

  it('treats 55 as a DDD when the number has no country code', () => {
    expect(formatPhoneDisplay('55991234567')).toBe('(55) 99123-4567');
  });

  it('returns an empty string when there are no digits', () => {
    expect(formatPhoneDisplay('---')).toBe('');
  });
});

describe('stripPhoneMask', () => {
  it('keeps only digits', () => {
    expect(stripPhoneMask('+55 (41) 99710-1101')).toBe('5541997101101');
  });
});
