export function omitProperty<T, K extends keyof T>(
  obj: T,
  propToDelete: K,
): Omit<T, K> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { [propToDelete]: _, ...rest } = obj;
  return rest;
}
