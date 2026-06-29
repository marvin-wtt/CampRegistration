import { isDeepStrictEqual } from 'node:util';

type AnyRecord = Record<string, unknown>;

/** Coerces a typed entity (which lacks an index signature) to a loose record. */
function toRecord(value: unknown): AnyRecord | undefined {
  return (value as AnyRecord | null | undefined) ?? undefined;
}

function isPlainObject(value: unknown): value is AnyRecord {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof Date)
  );
}

/** An array whose every element is a plain object (e.g. a dynamic panel). */
function isPlainObjectArray(value: unknown): value is AnyRecord[] {
  return Array.isArray(value) && value.length > 0 && value.every(isPlainObject);
}

/**
 * Flattens nested structures to dot-paths for leaf comparison:
 * - plain objects are descended into (`address.city`);
 * - arrays of objects (SurveyJS dynamic panels) are traced positionlessly —
 *   each leaf sub-path is collected across all rows under a `*` segment
 *   (`emergency_contacts.*.name`) into an order-insensitive bag, so reordering
 *   rows is not a change but editing/adding/removing a value is;
 * - everything else (primitive arrays, dates, primitives) is a single leaf
 *   (so e.g. the `emails` array is compared as a whole).
 */
function flatten(obj: AnyRecord, prefix = ''): AnyRecord {
  const out: AnyRecord = {};
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    flattenInto(out, path, value);
  }
  return out;
}

function flattenInto(out: AnyRecord, path: string, value: unknown): void {
  if (isPlainObject(value)) {
    Object.assign(out, flatten(value, path));
    return;
  }

  if (isPlainObjectArray(value)) {
    const bags: Record<string, unknown[]> = {};
    for (const element of value) {
      for (const [subPath, subValue] of Object.entries(
        flatten(element, `${path}.*`),
      )) {
        (bags[subPath] ??= []).push(subValue);
      }
    }
    // Sort each bag so row order does not register as a change.
    for (const [subPath, values] of Object.entries(bags)) {
      out[subPath] = [...values].sort(compareSerialized);
    }
    return;
  }

  out[path] = value;
}

function compareSerialized(a: unknown, b: unknown): number {
  return JSON.stringify(a ?? null).localeCompare(JSON.stringify(b ?? null));
}

/** True when two values are equal, treating `null` and absent as the same. */
function unchanged(from: unknown, to: unknown): boolean {
  if (from == null && to == null) {
    return true;
  }
  return isDeepStrictEqual(from, to);
}

/** Allow-listed top-level keys whose value changed. */
export function changedKeysByAllowList(
  before: unknown,
  after: unknown,
  allowList: readonly string[],
): string[] {
  const beforeRecord = toRecord(before);
  const afterRecord = toRecord(after);
  return allowList.filter(
    (key) => !unchanged(beforeRecord?.[key], afterRecord?.[key]),
  );
}

/**
 * Top-level keys (minus a deny-list) whose value changed. Iterates the keys of
 * `before` (so pass the lean, no-relations read) — this avoids spuriously
 * diffing included relations that only exist on `after`.
 */
export function changedKeysExcept(
  before: unknown,
  after: unknown,
  deny: readonly string[],
): string[] {
  const beforeRecord = toRecord(before) ?? {};
  const afterRecord = toRecord(after) ?? {};
  const denySet = new Set<string>(deny);
  return Object.keys(beforeRecord).filter(
    (key) =>
      !denySet.has(key) && !unchanged(beforeRecord[key], afterRecord[key]),
  );
}

/** Leaf dot-paths (prefixed) that changed between two JSON blobs. */
export function changedLeafPaths(
  before: unknown,
  after: unknown,
  prefix: string,
): string[] {
  const flatBefore = flatten(toRecord(before) ?? {});
  const flatAfter = flatten(toRecord(after) ?? {});
  const keys = new Set([...Object.keys(flatBefore), ...Object.keys(flatAfter)]);
  const changed: string[] = [];
  for (const key of keys) {
    if (!unchanged(flatBefore[key], flatAfter[key])) {
      changed.push(prefix ? `${prefix}.${key}` : key);
    }
  }
  return changed;
}

/** Merges field-name groups into a sorted, de-duplicated list. */
export function composeChangedFields(...groups: string[][]): string[] {
  return [...new Set(groups.flat())].sort();
}
