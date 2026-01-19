import { toRaw, isRef, isReactive, isProxy } from 'vue';

export function deepToRaw<T>(sourceObj: T): T {
  const objectIterator = (input: unknown): unknown => {
    if (Array.isArray(input)) {
      return input.map((item) => objectIterator(item));
    }

    if (isRef(input) || isReactive(input) || isProxy(input)) {
      return objectIterator(toRaw(input));
    }

    if (input && typeof input === 'object') {
      return Object.keys(input).reduce(
        (acc, key) => {
          acc[key] = objectIterator((input as Record<string, unknown>)[key]);
          return acc;
        },
        {} as Record<string, unknown>,
      );
    }
    return input;
  };

  return objectIterator(sourceObj) as T;
}
