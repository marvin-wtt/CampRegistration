export function omitProperty<T, K extends keyof T>(
  obj: T,
  propToDelete: K,
): Omit<T, K> {
  const { [propToDelete]: _, ...rest } = obj;
  return rest;
}
