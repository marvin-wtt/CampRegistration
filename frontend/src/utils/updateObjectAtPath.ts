/**
 * Update (or create) a nested property on an object, given a dot-delimited path.
 *
 * @param obj    The object to modify in place.
 * @param path   Dot-delimited string indicating the nested key (e.g. "a.b.c").
 * @param value  The new value to set at that nested key.
 * @returns      The original object, with the update applied.
 */
export function updateObjectAtPath(
  obj: Record<string, unknown>,
  path: string,
  value: unknown,
): Record<string, unknown> {
  const keys = path.split('.');
  let current: Record<string, unknown> = obj;

  // Traverse/create intermediate objects
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]!;
    const next = current[key];
    if (typeof next !== 'object' || next === null || Array.isArray(next)) {
      // overwrite non-objects (or arrays) with a fresh object
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }

  // Set the final key to the new value
  const lastKey = keys[keys.length - 1]!;
  current[lastKey] = value;

  return obj;
}
