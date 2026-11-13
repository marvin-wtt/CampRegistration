import type { Request } from 'express';
import { getRequestContext } from '#core/context/requestContext';

type Models = Request['models'];
export type ModelKey = keyof Models;

/** Properties of a model that hold a user id. */
export type OwnerFields<K extends ModelKey> = readonly {
  [F in keyof NonNullable<Models[K]>]: NonNullable<Models[K]>[F] extends
    string | null
    ? Extract<F, string>
    : never;
}[keyof NonNullable<Models[K]>][];

const owners = new Map<ModelKey, readonly string[]>();

/**
 * Declares who owns a model, once for all its `:own` grants. Called by
 * `ModuleRouter.bindModel()`; a router built twice may repeat the same fields.
 */
export function registerOwnership<K extends ModelKey>(
  model: K,
  fields: OwnerFields<K>,
): void {
  const existing = owners.get(model);
  if (existing && existing.join() !== fields.join()) {
    throw new Error(`Conflicting ownership for model '${model}'`);
  }

  owners.set(model, fields);
}

function ownerFields(model: ModelKey): readonly string[] {
  const fields = owners.get(model);
  if (!fields) {
    throw new Error(`Model '${model}' declares no owners`);
  }

  return fields;
}

export function isOwnedBy(
  model: ModelKey,
  record: object,
  userId: string | undefined,
): boolean {
  const values = record as Record<string, unknown>;

  return (
    userId !== undefined &&
    ownerFields(model).some((field) => values[field] === userId)
  );
}

/** For resources: whether the requesting user owns `record`. */
export function ownedByRequester(model: ModelKey, record: object): boolean {
  return isOwnedBy(model, record, getRequestContext()?.userId);
}

/**
 * Whether the user owns the request's bound `model`. An unbound model is a
 * wiring mistake, not a denial, so it throws.
 */
export function ownsBoundModel(req: Request, model: ModelKey): boolean {
  const record = req.model(model);
  if (!record) {
    throw new Error(`Model '${model}' is not bound on this route`);
  }

  return isOwnedBy(model, record, req.authUserId());
}

/** The Prisma `where` for the records of `model` that `userId` owns. */
export function ownedWhere(
  model: ModelKey,
  userId: string,
): { OR: Record<string, string>[] } {
  return { OR: ownerFields(model).map((field) => ({ [field]: userId })) };
}

/** Test seam — the ownership map is a boot-time singleton. */
export function clearOwnership(): void {
  owners.clear();
}
