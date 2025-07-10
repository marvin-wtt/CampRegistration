/**
 * Computes the differences between two objects, `objA` and `objB`, and returns a partial object
 * representing the changes needed to transform `objA` into `objB`.
 *
 * - If a key exists in `objA` but not in `objB`, it will be set to `null` in the result.
 * - If a key exists in `objB` but not in `objA`, the result will include that key with its value from `objB`.
 * - If a key exists in both objects but with different values, the result will include that key with its value from `objB`.
 *
 * @template T - The type of the input objects.
 * @param {T} objA - The base object to compare.
 * @param {Partial<T>} objB - The object to compare against `objA`, which may contain a subset of keys from `objA`.
 * @returns {Partial<{ [K in keyof T]: T[K] | null }>} - A partial object representing the differences, with keys set to `null` if missing in `objB`.
 */
export function updateDiff<T extends object>(
  objA: T,
  objB: Partial<T>,
): Partial<{ [K in keyof T]: T[K] | null }> {
  const keys = new Set([...Object.keys(objA), ...Object.keys(objB)]);

  return Array.from(keys).reduce(
    (acc, key) => {
      const valueA = objA[key as keyof T];
      const valueB = objB[key as keyof T];

      // Handle cases where objA has the key but objB doesn't
      if (key in objA && !(key in objB)) {
        acc[key as keyof T] = null;
      }
      // Handle cases where objB has the key but objA doesn't
      else if (key in objB && !(key in objA)) {
        acc[key as keyof T] = valueB;
      }
      // Handle cases where the values differ
      else if (valueA !== valueB) {
        acc[key as keyof T] = valueB;
      }

      return acc;
    },
    {} as Partial<{ [K in keyof T]: T[K] | null }>,
  );
}
