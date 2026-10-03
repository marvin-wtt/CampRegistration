export type CsvValue = string | number | null | undefined;

// Spreadsheets run a cell starting with one of these as a formula.
const FORMULA_PREFIX = /^[=+\-@\t\r]/;

function csvField(value: CsvValue): string {
  if (value === null || value === undefined) {
    return '';
  }
  // Text only: numbers can't carry a formula, and a minus sign is theirs.
  const text =
    typeof value === 'string' && FORMULA_PREFIX.test(value)
      ? `'${value}`
      : String(value);

  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/**
 * RFC 4180 CSV with CRLF line ends. The leading byte order mark makes Excel
 * read it as UTF-8 instead of the system code page.
 */
export function toCsv(header: string[], rows: CsvValue[][]): string {
  const lines = [header, ...rows].map((row) => row.map(csvField).join(','));

  return '﻿' + lines.join('\r\n') + '\r\n';
}
