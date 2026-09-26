export type CsvSeparator = ',' | ';';

// German, French, Polish, and Czech Excel installs default to `;` as the CSV
// list separator (since `,` is their decimal separator) and will import a
// comma-separated file as a single unsplit column; everything else keeps the
// standard `,`.
const SEMICOLON_LOCALES = new Set(['de', 'fr', 'pl', 'cs']);

export function csvSeparatorForLocale(locale: string): CsvSeparator {
  const base = locale.split('-')[0]?.toLowerCase();
  return base != null && SEMICOLON_LOCALES.has(base) ? ';' : ',';
}

function specialCharsPattern(separator: CsvSeparator): RegExp {
  return new RegExp(`["${separator}\r\n]`);
}

export function escapeCsvField(
  value: string,
  separator: CsvSeparator = ',',
): string {
  if (!specialCharsPattern(separator).test(value)) {
    return value;
  }

  return `"${value.replace(/"/g, '""')}"`;
}

export function toCsvRow(
  fields: string[],
  separator: CsvSeparator = ',',
): string {
  return fields
    .map((field) => escapeCsvField(field, separator))
    .join(separator);
}

export function toCsv(
  headerRow: string[],
  rows: string[][],
  separator: CsvSeparator = ',',
): string {
  return [headerRow, ...rows]
    .map((row) => toCsvRow(row, separator))
    .join('\r\n');
}
