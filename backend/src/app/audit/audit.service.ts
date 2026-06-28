import { BaseService } from '#core/base/BaseService';
import { RequestContext } from '#core/context/RequestContext';
import { inject, injectable } from 'inversify';
import {
  type AuditLog,
  Prisma,
  type PrismaClient,
} from '#generated/prisma/client.js';
import type {
  AuditActor,
  AuditChangeSet,
  AuditEntityType,
} from '@camp-registration/common/entities';
import { isEmptyChangeSet } from '#app/audit/audit.diff';
import type {
  AuditChangePolicy,
  AuditSnapshotPolicy,
} from '#app/audit/audit.policy';

export type PrismaTransaction = Parameters<
  Parameters<PrismaClient['$transaction']>[0]
>[0];

export interface AuditRecordInput {
  action: string;
  entityType: AuditEntityType;
  entityId: string;
  campId?: string | null;
  changes?: AuditChangeSet | null;
  // Override the actor. Omit to use the request context; pass `null` to force a
  // system-attributed entry (e.g. a public self-registration).
  actorId?: string | null;
}

export interface AuditLogWithActor {
  log: AuditLog;
  actor: AuditActor | null;
}

@injectable()
export class AuditService extends BaseService {
  constructor(
    @inject(RequestContext) private readonly context: RequestContext,
  ) {
    super();
  }

  /**
   * Writes one audit entry. Pass `tx` to enrol the write in the caller's
   * transaction so the audit row is atomic with the mutation it records.
   * The actor is read from the request context — `null` for anonymous/system.
   */
  async record(input: AuditRecordInput, tx?: PrismaTransaction): Promise<void> {
    const client = tx ?? this.prisma;
    await client.auditLog.create({
      data: {
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        campId: input.campId ?? null,
        actorId:
          input.actorId !== undefined
            ? input.actorId
            : (this.context.userId ?? null),
        actorIp: this.context.ip ?? null,
        changes: input.changes ?? Prisma.JsonNull,
      },
    });
  }

  /**
   * Diffs `before`/`after` through the entity's policy and records an entry —
   * skipping no-op edits. Keeps audit shaping in the entity's module.
   */
  async recordChange<T>(
    tx: PrismaTransaction,
    action: string,
    policy: AuditChangePolicy<T>,
    args: {
      before: T | null | undefined;
      after: T | null | undefined;
      entityId: string;
      campId?: string | null;
    },
  ): Promise<void> {
    const changes = policy.changeSet(args.before, args.after);
    if (isEmptyChangeSet(changes)) {
      return;
    }
    await this.record(
      {
        action,
        entityType: policy.entityType,
        entityId: args.entityId,
        campId: args.campId,
        changes,
      },
      tx,
    );
  }

  /** Records an entry carrying a snapshot of the entity (for create/delete). */
  async recordSnapshot<T>(
    tx: PrismaTransaction,
    action: string,
    policy: AuditSnapshotPolicy<T>,
    args: {
      entity: T | null | undefined;
      entityId: string;
      campId?: string | null;
    },
  ): Promise<void> {
    await this.record(
      {
        action,
        entityType: policy.entityType,
        entityId: args.entityId,
        campId: args.campId,
        changes: { snapshot: policy.snapshot(args.entity) },
      },
      tx,
    );
  }

  async listForRegistration(
    campId: string,
    registrationId: string,
  ): Promise<AuditLog[]> {
    return this.prisma.auditLog.findMany({
      where: {
        campId,
        entityType: 'registration',
        entityId: registrationId,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Resolves actor ids to `{ id, name }`. Ids with no matching user (deleted or
   * GDPR-erased) are omitted, so callers surface them as `null` ("deleted user").
   */
  async resolveActors(
    actorIds: (string | null)[],
  ): Promise<Map<string, AuditActor>> {
    const ids = [
      ...new Set(actorIds.filter((id): id is string => id !== null)),
    ];
    if (ids.length === 0) {
      return new Map();
    }
    const users = await this.prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true },
    });
    return new Map(users.map((user) => [user.id, user]));
  }

  /** Removes all audit rows for a registration — for GDPR erasure only. */
  async purgeForRegistration(
    registrationId: string,
    tx?: PrismaTransaction,
  ): Promise<void> {
    const client = tx ?? this.prisma;
    await client.auditLog.deleteMany({
      where: { entityType: 'registration', entityId: registrationId },
    });
  }

  /** Removes all audit rows scoped to a camp — for GDPR erasure only. */
  async purgeForCamp(campId: string, tx?: PrismaTransaction): Promise<void> {
    const client = tx ?? this.prisma;
    await client.auditLog.deleteMany({ where: { campId } });
  }

  /** Deletes audit rows older than the given cutoff (retention enforcement). */
  async purgeOlderThan(cutoff: Date): Promise<number> {
    const { count } = await this.prisma.auditLog.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    return count;
  }
}
