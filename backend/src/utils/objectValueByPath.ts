export function objectValueByPath(
  path: string | (string | number)[],
  obj: unknown,
) {
  const keys = Array.isArray(path) ? path : path.split(".");
  let result: unknown = obj;

  for (const key of keys) {
    if (result && typeof result === "object" && key in result) {
      result = (result as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }

  return result;
}
