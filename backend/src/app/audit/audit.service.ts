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
import type { AuditChangePolicy } from '#app/audit/audit.policy';

export type PrismaTransaction = Parameters<
  Parameters<PrismaClient['$transaction']>[0]
>[0];

// Audit rows are purged after this long — defense-in-depth against unbounded PII retention.
const AUDIT_RETENTION_DAYS = 365 * 2;
// The actor IP only serves short-lived security/abuse investigation, so it is
// scrubbed well before the audit row itself expires — data minimization for the
// one piece of free-floating PII the log retains for a camp's whole lifetime.
const AUDIT_IP_RETENTION_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface AuditRecordInput {
  action: string;
  entityType: AuditEntityType;
  entityId: string;
  campId?: string | null;
  // The change set; omit for create/delete events (no diff).
  changes?: AuditChangeSet | null;
  // Override the actor. Omit to use the request context; pass `null` to force a
  // system-attributed entry (e.g. a public self-registration).
  actorId?: string | null;
}

export interface AuditLogWithActor {
  log: AuditLog;
  actor: AuditActor | null;
  subject: AuditActor | null;
}

@injectable()
export class AuditService extends BaseService {
  constructor(
    @inject(RequestContext) private readonly context: RequestContext,
  ) {
    super();
  }

  /**
   * Writes one audit entry, enrolled in the caller's transaction so the audit
   * row is atomic with the mutation it records. The actor is read from the
   * request context — `null` for anonymous/system.
   */
  async record(tx: PrismaTransaction, input: AuditRecordInput): Promise<void> {
    const actorId =
      input.actorId !== undefined
        ? input.actorId
        : (this.context.userId ?? null);

    await tx.auditLog.create({
      data: {
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        campId: input.campId ?? null,
        actorId,
        actorIp: this.context.ip ?? null,
        changes: input.changes ?? Prisma.JsonNull,
      },
    });
  }

  /**
   * Diffs `before`/`after` through the entity's policy and records the resulting
   * change set — skipping no-op edits. Keeps audit shaping in the entity's
   * module. Only field names (and the bounded status value) are recorded.
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
    await this.record(tx, {
      action,
      entityType: policy.entityType,
      entityId: args.entityId,
      campId: args.campId,
      changes,
    });
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

  /** All audit rows for a camp, across every entity type. */
  async listForCamp(campId: string): Promise<AuditLog[]> {
    return this.prisma.auditLog.findMany({
      where: { campId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Resolves actor ids to `{ id, name }`. Ids with no matching user (deleted or
   * GDPR-erased) are omitted from the returned map — callers should fall back to
   * `{ id, name: null }` (not a bare `null`) so the id survives for display as
   * "deleted user", distinct from a genuinely absent (system/anonymous) actor.
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

  /** Removes all audit rows scoped to a camp — for GDPR erasure only. */
  async purgeForCamp(campId: string, tx?: PrismaTransaction): Promise<void> {
    const client = tx ?? this.prisma;
    await client.auditLog.deleteMany({ where: { campId } });
  }

  /**
   * Enforces the audit-log retention policy. Only purges *orphaned* entries —
   * rows whose camp is already gone (`campId` is null, either because the camp
   * was deleted — the FK sets it null — or because the action was
   * system/public to begin with). Rows still tied to an existing camp are left
   * untouched, so a live camp always keeps its full audit trail.
   */
  async purgeExpiredAuditLogs(): Promise<number> {
    const cutoff = new Date(Date.now() - AUDIT_RETENTION_DAYS * DAY_MS);

    const { count } = await this.prisma.auditLog.deleteMany({
      where: {
        campId: null,
        createdAt: { lt: cutoff },
      },
    });
    return count;
  }

  /**
   * Scrubs the actor IP from audit rows older than the short IP-retention
   * window, while keeping the accountability record (actor, action, time). The
   * IP outlives its investigative purpose quickly, so it is nulled independently
   * of the row's own lifetime — this also clears the IPs of any user who has
   * since been erased.
   */
  async purgeExpiredActorIps(): Promise<number> {
    const cutoff = new Date(Date.now() - AUDIT_IP_RETENTION_DAYS * DAY_MS);

    const { count } = await this.prisma.auditLog.updateMany({
      where: {
        actorIp: { not: null },
        createdAt: { lt: cutoff },
      },
      data: { actorIp: null },
    });
    return count;
  }
}
