import { BaseService } from '#core/base/BaseService';
import { getRequestContext } from '#core/context/requestContext';
import { injectable } from 'inversify';
import { type AuditLog, Prisma } from '#generated/prisma/client.js';
import type { PrismaTransaction } from '#core/database/transaction';
import type {
  AuditActor,
  AuditDetails,
  AuditEntityType,
} from '@camp-registration/common/entities';
import {
  composeDetails,
  hasNoChanges,
  mergeDetails,
} from '#app/audit/audit.diff';
import type { AuditChangePolicy, AuditSubject } from '#app/audit/audit.policy';
import { getAuditNameResolver } from '#app/audit/audit.names';

const AUDIT_RETENTION_DAYS = 365 * 2;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface AuditRecordInput {
  action: string;
  entityType: AuditEntityType;
  entityId: string;
  eventId?: string | null;
  details?: AuditDetails | null;
  // Omit to use the request's user; `null` forces a system-attributed entry.
  actorId?: string | null;
}

export interface AuditEntryOptions {
  details?: AuditDetails;
  // As in `AuditRecordInput`.
  actorId?: string | null;
}

export interface AuditLogView {
  log: AuditLog;
  actor: AuditActor | null;
  subject: AuditActor | null;
  // `undefined` when the entity type resolves no names; `null` once deleted.
  entityName?: string | null;
}

@injectable()
export class AuditService extends BaseService {
  // Runs in the caller's transaction, so the entry is atomic with the change.
  async record(tx: PrismaTransaction, input: AuditRecordInput): Promise<void> {
    await tx.auditLog.create({
      data: {
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        eventId: input.eventId ?? null,
        actorId: this.resolveActorId(input.actorId),
        details: input.details ?? Prisma.JsonNull,
      },
    });
  }

  private resolveActorId(actorId: string | null | undefined): string | null {
    return actorId !== undefined
      ? actorId
      : (getRequestContext()?.userId ?? null);
  }

  /**
   * Records `action` on `entity`, filed and identified by its subject.
   * `details` are merged over the subject's identity.
   */
  async recordFor<T>(
    tx: PrismaTransaction,
    subject: AuditSubject<T>,
    action: string,
    entity: T,
    options: AuditEntryOptions = {},
  ): Promise<void> {
    const details = composeDetails({
      ...subject.identity?.(entity),
      ...options.details,
    });
    await this.record(tx, {
      action,
      entityType: subject.entityType,
      ...subject.locate(entity),
      actorId: options.actorId,
      details: Object.keys(details).length > 0 ? details : null,
    });
  }

  async created<T>(
    tx: PrismaTransaction,
    subject: AuditSubject<T>,
    entity: T,
    options?: AuditEntryOptions,
  ): Promise<void> {
    await this.recordFor(tx, subject, 'created', entity, options);
  }

  async deleted<T>(
    tx: PrismaTransaction,
    subject: AuditSubject<T>,
    entity: T,
    options?: AuditEntryOptions,
  ): Promise<void> {
    await this.recordFor(tx, subject, 'deleted', entity, options);
  }

  /**
   * Records an update as diffed by the entity's policy, skipping no-op edits.
   * Read `before` inside the same transaction as the write. That keeps the
   * diff and the write atomic, but a plain read takes no lock under REPEATABLE
   * READ: two concurrent saves can both diff against the same `before`.
   *
   * With `coalesceWithinMs`, an edit by the same actor is merged into the
   * entity's latest entry if that is younger than the window — an autosaving
   * editor then yields one entry per window instead of one per save.
   */
  async updated<T>(
    tx: PrismaTransaction,
    policy: AuditChangePolicy<T>,
    before: T,
    after: T,
    options: { coalesceWithinMs?: number; actorId?: string | null } = {},
  ): Promise<void> {
    const details = policy.details(before, after);
    if (hasNoChanges(details)) {
      return;
    }
    const input = {
      action: 'updated',
      entityType: policy.entityType,
      ...policy.locate(after),
      actorId: options.actorId,
      details,
    };
    if (
      options.coalesceWithinMs !== undefined &&
      (await this.mergeIntoLatest(tx, input, details, options.coalesceWithinMs))
    ) {
      return;
    }
    await this.record(tx, input);
  }

  private async mergeIntoLatest(
    tx: PrismaTransaction,
    input: AuditRecordInput,
    details: AuditDetails,
    windowMs: number,
  ): Promise<boolean> {
    const actorId = this.resolveActorId(input.actorId);
    if (actorId === null) {
      return false;
    }

    const latest = await tx.auditLog.findFirst({
      where: { entityType: input.entityType, entityId: input.entityId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
    if (
      latest?.action !== input.action ||
      latest.actorId !== actorId ||
      latest.createdAt.getTime() < Date.now() - windowMs
    ) {
      return false;
    }

    await tx.auditLog.update({
      where: { id: latest.id },
      data: { details: mergeDetails(latest.details ?? {}, details) },
    });
    return true;
  }

  async listForRegistration(
    eventId: string,
    registrationId: string,
  ): Promise<AuditLog[]> {
    return this.prisma.auditLog.findMany({
      where: {
        eventId,
        entityType: 'registration',
        entityId: registrationId,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Newest first, cursor-paginated; `total` only on the first page.
  async listForEvent(
    eventId: string,
    filter: {
      entityType?: AuditEntityType[];
      entityId?: string;
      actorId?: string[];
      hideSystem?: boolean;
      from?: string;
      to?: string;
    } = {},
    options: { cursor?: string; limit?: number } = {},
  ): Promise<{
    logs: AuditLog[];
    nextCursor: string | null;
    limit: number;
    total?: number;
  }> {
    const limit = options.limit ?? 50;

    const where: Prisma.AuditLogWhereInput = {
      eventId,
      entityType: filter.entityType ? { in: filter.entityType } : undefined,
      entityId: filter.entityId,
      // An actor list already excludes system entries.
      actorId: filter.actorId
        ? { in: filter.actorId }
        : filter.hideSystem
          ? { not: null }
          : undefined,
      createdAt:
        filter.from || filter.to
          ? { gte: filter.from, lte: filter.to }
          : undefined,
    };

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        take: limit + 1,
        ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      }),
      options.cursor ? undefined : this.prisma.auditLog.count({ where }),
    ]);

    const hasMore = items.length > limit;
    const logs = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore ? (logs.at(-1)?.id ?? null) : null;

    return { logs, nextCursor, limit, total };
  }

  async listActorsForEvent(eventId: string): Promise<AuditActor[]> {
    // Not `distinct`: Prisma applies it in memory on MySQL, reading every row.
    const rows = await this.prisma.auditLog.groupBy({
      by: ['actorId'],
      where: { eventId, actorId: { not: null } },
    });
    const ids = rows.flatMap((row) => (row.actorId ? [row.actorId] : []));
    const users = await this.resolveUsers(ids);

    return ids.map((id) => this.userOrDeleted(users, id));
  }

  /**
   * Resolves the users an entry names — its actor and, for entries about a
   * person other than the entity (`details.subjectId`), its subject — and,
   * with `withEntityNames`, the entity's display name while it still exists.
   */
  async present(
    eventId: string,
    logs: AuditLog[],
    { withEntityNames = false } = {},
  ): Promise<AuditLogView[]> {
    const userIds = logs.flatMap((log) =>
      [log.actorId, log.details?.subjectId].filter((id): id is string => !!id),
    );
    const [users, names] = await Promise.all([
      this.resolveUsers(userIds),
      withEntityNames
        ? this.resolveEntityNames(eventId, logs)
        : Promise.resolve(null),
    ]);

    return logs.map((log) => {
      const subjectId = log.details?.subjectId;
      const typeNames = names?.get(log.entityType as AuditEntityType);
      return {
        log,
        actor: log.actorId ? this.userOrDeleted(users, log.actorId) : null,
        subject: subjectId ? this.userOrDeleted(users, subjectId) : null,
        ...(typeNames
          ? { entityName: typeNames.get(log.entityId) ?? null }
          : {}),
      };
    });
  }

  private async resolveEntityNames(
    eventId: string,
    logs: AuditLog[],
  ): Promise<Map<AuditEntityType, Map<string, string>>> {
    const idsByType = new Map<AuditEntityType, Set<string>>();
    for (const log of logs) {
      const type = log.entityType as AuditEntityType;
      if (getAuditNameResolver(type)) {
        idsByType.set(
          type,
          (idsByType.get(type) ?? new Set()).add(log.entityId),
        );
      }
    }

    const entries = await Promise.all(
      [...idsByType].map(async ([type, ids]) => {
        const resolver = getAuditNameResolver(type);
        const names = resolver
          ? await resolver(eventId, [...ids])
          : new Map<string, string>();
        return [type, names] as const;
      }),
    );
    return new Map(entries);
  }

  private async resolveUsers(ids: string[]): Promise<Map<string, AuditActor>> {
    const unique = [...new Set(ids)];
    if (unique.length === 0) {
      return new Map();
    }
    const users = await this.prisma.user.findMany({
      where: { id: { in: unique } },
      select: { id: true, name: true },
    });
    const resolved = new Map<string, AuditActor>(
      users.map((user) => [user.id, user]),
    );

    const missing = unique.filter((id) => !resolved.has(id));
    if (missing.length > 0) {
      const deleted = await this.prisma.auditDeletedUser.findMany({
        where: { id: { in: missing } },
        select: { id: true, name: true },
      });
      for (const user of deleted) {
        resolved.set(user.id, { ...user, deleted: true });
      }
    }
    return resolved;
  }

  /**
   * Keeps a deleted account's name so its entries stay attributable. Call in
   * the deleting transaction, after its own entries; an account no entry
   * names keeps nothing. The name is purged after the retention window.
   */
  async rememberDeletedUser(
    tx: PrismaTransaction,
    user: { id: string; name: string },
  ): Promise<void> {
    const referenced = await tx.auditLog.findFirst({
      where: {
        OR: [
          { actorId: user.id },
          { details: { path: '$.subjectId', equals: user.id } },
        ],
      },
      select: { id: true },
    });
    if (!referenced) {
      return;
    }

    await tx.auditDeletedUser.upsert({
      where: { id: user.id },
      create: { id: user.id, name: user.name },
      update: { name: user.name, deletedAt: new Date() },
    });
  }

  // A user no longer found, or whose name was purged, keeps its id with no
  // name, so it reads as "deleted user" rather than as the system.
  private userOrDeleted(
    users: Map<string, AuditActor>,
    id: string,
  ): AuditActor {
    return users.get(id) ?? { id, name: null, deleted: true };
  }

  /**
   * Deletes entries older than the retention window whose event is gone
   * (the FK nulls `eventId` when an event is deleted). Entries of an existing
   * event are kept for as long as the event exists.
   */
  async purgeExpiredAuditLogs(): Promise<number> {
    const cutoff = new Date(Date.now() - AUDIT_RETENTION_DAYS * DAY_MS);

    const { count } = await this.prisma.auditLog.deleteMany({
      where: {
        eventId: null,
        createdAt: { lt: cutoff },
      },
    });
    return count;
  }

  async purgeExpiredDeletedUsers(): Promise<number> {
    const cutoff = new Date(Date.now() - AUDIT_RETENTION_DAYS * DAY_MS);

    const { count } = await this.prisma.auditDeletedUser.deleteMany({
      where: { deletedAt: { lt: cutoff } },
    });
    return count;
  }
}
