import type { CsvSeparator } from '@camp-registration/common/utils';

/** Makes Excel read the file as UTF-8 instead of the system code page. */
export const CSV_BOM = String.fromCharCode(0xfeff);

export type CsvValue = string | number | null | undefined;

// Spreadsheets run a cell starting with one of these as a formula.
const FORMULA_PREFIX = /^[=+\-@\t\r]/;

function csvField(value: CsvValue, separator: CsvSeparator): string {
  if (value === null || value === undefined) {
    return '';
  }
  // Text only: numbers can't carry a formula, and a minus sign is theirs.
  const text =
    typeof value === 'string' && FORMULA_PREFIX.test(value)
      ? `'${value}`
      : String(value);
  const needsQuotes = text.includes(separator) || /["\r\n]/.test(text);

  return needsQuotes ? `"${text.replaceAll('"', '""')}"` : text;
}

/**
 * RFC 4180 CSV with CRLF line ends, separated by `separator` (see
 * `csvSeparatorForLocale`). It starts with {@link CSV_BOM}.
 */
export function toCsv(
  header: string[],
  rows: CsvValue[][],
  separator: CsvSeparator = ',',
): string {
  const lines = [header, ...rows].map((row) =>
    row.map((value) => csvField(value, separator)).join(separator),
  );

  return CSV_BOM + lines.join('\r\n') + '\r\n';
}
