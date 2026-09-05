import { isoToLocalDate } from '@/utils/date';

export interface CsvFormatContext {
  translate: (
    value: string | Record<string, string> | null | undefined,
  ) => string;
  translateCountry: (country: string) => string;
  getFormSelectOptions: (
    fieldName: string,
  ) => Record<string, string | Record<string, string>> | undefined;
}

// Generic fallback used by cell renderers that have no CSV-specific
// behaviour to register (see ComponentRegistry.ts's `toCsv` option).
export function stringifyCsvValue(value: unknown): string {
  if (value == null) {
    return '';
  }

  if (Array.isArray(value)) {
    return value.map(stringifyCsvValue).join('; ');
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  // Only primitives remain at this point (object/array/nullish are handled
  // above), so the default `toString()` is always meaningful here.
  // eslint-disable-next-line @typescript-eslint/no-base-to-string
  return String(value);
}

export function isTranslatableCsvValue(
  value: unknown,
): value is string | Record<string, string> {
  return (
    typeof value === 'string' || (typeof value === 'object' && value !== null)
  );
}

// Shared by the `date`, `age`, and `time_ago` cell renderers: CSV output is
// meant to be sorted/re-imported, so a plain ISO calendar day beats the
// localized "medium" string or a computed age/relative-time value.
export function formatIsoDateCsvValue(value: unknown): string {
  return typeof value === 'string'
    ? isoToLocalDate(value)
    : stringifyCsvValue(value);
}

export function formatFormSelectCsvValue(
  fieldName: string,
  value: unknown,
  ctx: CsvFormatContext,
): string {
  // Mirrors FormSelectTableCell.vue: only `data.*` fields (dynamic form
  // questions) carry a select-options lookup; anything else has no option
  // list to resolve a label from.
  if (!fieldName.startsWith('data.')) {
    return stringifyCsvValue(value);
  }

  const options = ctx.getFormSelectOptions(fieldName.substring(5));
  const key = String(value);
  if (!options || !(key in options)) {
    return stringifyCsvValue(value);
  }

  return ctx.translate(options[key]);
}
