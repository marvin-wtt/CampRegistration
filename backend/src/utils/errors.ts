/**
 * An error's message for logging. `JSON.stringify(new Error(...))` yields
 * `{}`, so use this when interpolating into a template string.
 */
export function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
