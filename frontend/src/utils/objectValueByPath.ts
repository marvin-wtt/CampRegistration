export function objectValueByPath(
  path: string | (string | number)[],
  obj: unknown,
): unknown | unknown[] {
  const keys = Array.isArray(path) ? path : path.split('.');
  let result: unknown = obj;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];

    if (result == null) {
      return undefined;
    }

    // Handle arrays without explicit index
    if (key === '*') {
      if (!Array.isArray(result)) {
        return undefined;
      }

      const remainingPath = keys.slice(i + 1);
      return result.flatMap((item) => objectValueByPath(remainingPath, item));
    }

    if (typeof result !== 'object' || !(key in result)) {
      return undefined;
    }

    result = (result as Record<string, unknown>)[key];
  }

  return result;
}
