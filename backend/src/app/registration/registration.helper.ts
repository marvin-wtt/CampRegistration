/**
 * Field namespace on `File` rows for custom registration files
 * (`field = 'custom:<slot>'`). The File row is the single source of truth for
 * these assignments; the API's `Registration.files` record is derived from it.
 * The prefix separates custom files from form files (`field = sessionId`).
 */
export const CUSTOM_FILE_FIELD_PREFIX = 'custom:';

/** Custom file slot name → attached file id; other files are skipped. */
export function customFileSlots(
  files: { id: string; field: string | null }[],
): Record<string, string> {
  return Object.fromEntries(
    files.flatMap((file) =>
      file.field?.startsWith(CUSTOM_FILE_FIELD_PREFIX)
        ? [[file.field.slice(CUSTOM_FILE_FIELD_PREFIX.length), file.id]]
        : [],
    ),
  );
}
