import type { CsvSeparator } from '@camp-registration/common/utils';

// The locale rule is shared with the backend's exports.
export {
  type CsvSeparator,
  csvSeparatorForLocale,
} from '@camp-registration/common/utils';

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
