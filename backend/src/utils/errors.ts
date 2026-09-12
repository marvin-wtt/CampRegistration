/**
 * A logged error's message, whatever was actually thrown. `JSON.stringify`
 * on a plain `Error` gives `{}` (message/stack aren't enumerable own
 * properties), so template-string interpolation needs this instead.
 */
export function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
