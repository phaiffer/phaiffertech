// Minimal CSV builder for client-side exports.
// Uses ";" as separator (default in Brazilian spreadsheet locales) and a UTF-8 BOM
// so accented characters open correctly in Excel.

const SEPARATOR = ';';
// U+FEFF byte order mark, built from its code point so editors and formatters
// cannot silently strip an invisible literal.
export const CSV_BOM = String.fromCharCode(0xfeff);

function escapeCell(value: string) {
  const needsQuotes = /[";\r\n]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

export function buildCsv(rows: string[][]): string {
  return CSV_BOM + rows.map((row) => row.map((cell) => escapeCell(cell ?? '')).join(SEPARATOR)).join('\r\n');
}

/** Triggers a browser download of the given CSV content. */
export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
