export type CsvSeparator = ',' | ';';

// German, French, Polish, and Czech Excel installs default to `;` as the CSV
// list separator (since `,` is their decimal separator) and will import a
// comma-separated file as a single unsplit column; everything else keeps the
// standard `,`.
const SEMICOLON_LOCALES = new Set(['de', 'fr', 'pl', 'cs']);

/** The list separator Excel expects for `locale`; shared by every CSV export. */
export function csvSeparatorForLocale(locale: string): CsvSeparator {
  const [base = ''] = locale.split('-');
  return SEMICOLON_LOCALES.has(base.toLowerCase()) ? ';' : ',';
}

/** The decimal mark that goes with a list separator: `,` where `;` lists. */
export function csvDecimalMark(separator: CsvSeparator): '.' | ',' {
  return separator === ';' ? ',' : '.';
}
