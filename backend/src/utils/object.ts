export function filterByKeys(
  obj: string | Record<string, string>,
  keys: string[],
): string | Record<string, string> {
  return typeof obj === 'string'
    ? obj
    : Object.fromEntries(keys.map((value) => [value, obj[value]]));
}
