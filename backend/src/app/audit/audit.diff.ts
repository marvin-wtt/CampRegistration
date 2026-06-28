import { isDeepStrictEqual } from 'node:util';
import type {
  AuditChangeSet,
  AuditFieldChange,
} from '@camp-registration/common/entities';

// Generic, entity-agnostic diff primitives. Per-entity policy (which fields to
// track, how to shape a change set) lives in each feature's `*.audit.ts`.

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

/**
 * Flattens nested plain objects to dot-paths, treating arrays, dates and
 * primitives as leaf values (so e.g. the `emails` array is compared as a whole).
 */
function flatten(obj: AnyRecord, prefix = ''): AnyRecord {
  const out: AnyRecord = {};
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (isPlainObject(value)) {
      Object.assign(out, flatten(value, path));
    } else {
      out[path] = value;
    }
  }
  return out;
}

/** Top-level diff restricted to an explicit allow-list of keys. */
export function diffByAllowList(
  before: unknown,
  after: unknown,
  allowList: readonly string[],
): Record<string, AuditFieldChange> {
  const beforeRecord = toRecord(before);
  const afterRecord = toRecord(after);
  const changes: Record<string, AuditFieldChange> = {};
  for (const key of allowList) {
    const from = beforeRecord?.[key];
    const to = afterRecord?.[key];
    if (!isDeepStrictEqual(from, to)) {
      changes[key] = { from: from ?? null, to: to ?? null };
    }
  }
  return changes;
}

/**
 * Top-level diff of every column EXCEPT a deny-list. Iterates the keys of
 * `before` (so pass the lean, no-relations read) — this avoids spuriously
 * diffing included relations that only exist on `after`. Suited to config
 * entities where "track everything except a few" beats enumerating each field.
 */
export function diffExcept(
  before: unknown,
  after: unknown,
  deny: readonly string[],
): Record<string, AuditFieldChange> {
  const beforeRecord = toRecord(before) ?? {};
  const afterRecord = toRecord(after) ?? {};
  const denySet = new Set<string>(deny);
  const changes: Record<string, AuditFieldChange> = {};
  for (const key of Object.keys(beforeRecord)) {
    if (denySet.has(key)) {
      continue;
    }
    const from = beforeRecord[key];
    const to = afterRecord[key];
    if (!isDeepStrictEqual(from, to)) {
      changes[key] = { from: from ?? null, to: to ?? null };
    }
  }
  return changes;
}

/** Leaf-level diff of two JSON blobs (e.g. registration `data`). */
export function diffLeaves(
  before: unknown,
  after: unknown,
): Record<string, AuditFieldChange> {
  const flatBefore = flatten(toRecord(before) ?? {});
  const flatAfter = flatten(toRecord(after) ?? {});
  const keys = new Set([...Object.keys(flatBefore), ...Object.keys(flatAfter)]);
  const changes: Record<string, AuditFieldChange> = {};
  for (const key of keys) {
    if (!isDeepStrictEqual(flatBefore[key], flatAfter[key])) {
      changes[key] = {
        from: flatBefore[key] ?? null,
        to: flatAfter[key] ?? null,
      };
    }
  }
  return changes;
}

/** Picks a stable snapshot of the given keys (for delete events). */
export function pickSnapshot(
  entity: unknown,
  keys: readonly string[],
): AnyRecord {
  const record = toRecord(entity) ?? {};
  const snapshot: AnyRecord = {};
  for (const key of keys) {
    snapshot[key] = record[key] ?? null;
  }
  return snapshot;
}

/** Assembles a change set, omitting empty sections. */
export function composeChangeSet(
  fields: Record<string, AuditFieldChange>,
  data?: Record<string, AuditFieldChange>,
): AuditChangeSet {
  const changeSet: AuditChangeSet = {};
  if (Object.keys(fields).length > 0) {
    changeSet.fields = fields;
  }
  if (data && Object.keys(data).length > 0) {
    changeSet.data = data;
  }
  return changeSet;
}

/** True when a change set carries no recordable change. */
export function isEmptyChangeSet(changeSet: AuditChangeSet): boolean {
  return (
    !changeSet.fields &&
    !changeSet.data &&
    (changeSet.snapshot === undefined ||
      Object.keys(changeSet.snapshot).length === 0)
  );
}
