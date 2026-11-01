import { describe, expect, it } from 'vitest';
import { buildCsv, CSV_BOM } from '@/shared/lib/csv';

describe('buildCsv', () => {
  it('joins cells with ";" and rows with CRLF, prefixed with a UTF-8 BOM', () => {
    const csv = buildCsv([['Nome', 'Telefone'], ['Fernanda Lima', '(11) 99999-0000']]);

    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv.startsWith(CSV_BOM)).toBe(true);
    expect(csv.slice(1)).toBe('Nome;Telefone\r\nFernanda Lima;(11) 99999-0000');
  });

  it('quotes cells containing separators, quotes or line breaks', () => {
    const csv = buildCsv([['Rua A; 10', 'Diz "oi"', 'linha 1\nlinha 2']]);

    expect(csv.slice(1)).toBe('"Rua A; 10";"Diz ""oi""";"linha 1\nlinha 2"');
  });
});
