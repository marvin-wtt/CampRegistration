import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockDeep, type DeepMockProxy } from 'vitest-mock-extended';
import type { AuditLog, PrismaClient } from '#generated/prisma/client.js';
import type { AuditDetails } from '@camp-registration/common/entities';
import { AuditService } from '#app/audit/audit.service';
import type { AuditChangePolicy, AuditSubject } from '#app/audit/audit.policy';
import { runWithRequestContext } from '#core/context/requestContext';

const WINDOW_MS = 5 * 60 * 1000;

const policy = (details: AuditDetails): AuditChangePolicy<unknown> => ({
  entityType: 'event',
  locate: () => ({ entityId: 'event-1', eventId: 'event-1' }),
  details: () => details,
});

function latestEntry(overrides: Partial<AuditLog> = {}): AuditLog {
  return {
    id: 'log-1',
    action: 'updated',
    entityType: 'event',
    entityId: 'event-1',
    eventId: 'event-1',
    actorId: 'user-1',
    details: { changedFields: ['name'] },
    createdAt: new Date(Date.now() - 60_000),
    ...overrides,
  } as AuditLog;
}

// Runs `fn` as if inside a request authenticated as `userId`.
function asUser<T>(userId: string | undefined, fn: () => Promise<T>) {
  return new Promise<T>((resolve, reject) => {
    runWithRequestContext({ userId }, () => {
      fn().then(resolve, reject);
    });
  });
}

describe('AuditService.updated', () => {
  let prisma: DeepMockProxy<PrismaClient>;
  let service: AuditService;

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    service = new AuditService(prisma);
  });

  const change = (details: AuditDetails, coalesce = true) =>
    service.updated(
      policy(details),
      {},
      {},
      coalesce ? { coalesceWithinMs: WINDOW_MS } : {},
    );

  it('skips an edit that changed nothing', async () => {
    await asUser('user-1', () => change({}));

    expect(prisma.auditLog.create).not.toHaveBeenCalled();
    expect(prisma.auditLog.update).not.toHaveBeenCalled();
  });

  it("merges into the same actor's recent entry", async () => {
    prisma.auditLog.findFirst.mockResolvedValue(latestEntry());

    await asUser('user-1', () => change({ changedFields: ['location'] }));

    expect(prisma.auditLog.create).not.toHaveBeenCalled();
    expect(prisma.auditLog.update).toHaveBeenCalledWith({
      where: { id: 'log-1' },
      data: { details: { changedFields: ['location', 'name'] } },
    });
  });

  it("starts a new entry after another actor's edit", async () => {
    prisma.auditLog.findFirst.mockResolvedValue(latestEntry({ actorId: 'user-2' }));

    await asUser('user-1', () => change({ changedFields: ['location'] }));

    expect(prisma.auditLog.update).not.toHaveBeenCalled();
    expect(prisma.auditLog.create).toHaveBeenCalledOnce();
  });

  it('starts a new entry once the window has passed', async () => {
    prisma.auditLog.findFirst.mockResolvedValue(
      latestEntry({ createdAt: new Date(Date.now() - WINDOW_MS - 1000) }),
    );

    await asUser('user-1', () => change({ changedFields: ['location'] }));

    expect(prisma.auditLog.update).not.toHaveBeenCalled();
    expect(prisma.auditLog.create).toHaveBeenCalledOnce();
  });

  it('never merges system edits', async () => {
    await asUser(undefined, () => change({ changedFields: ['location'] }));

    expect(prisma.auditLog.findFirst).not.toHaveBeenCalled();
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ actorId: null }),
    });
  });

  it('only merges when asked to', async () => {
    prisma.auditLog.findFirst.mockResolvedValue(latestEntry());

    await asUser('user-1', () =>
      change({ changedFields: ['location'] }, false),
    );

    expect(prisma.auditLog.findFirst).not.toHaveBeenCalled();
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ actorId: 'user-1' }),
    });
  });
});

describe('AuditService.recordFor', () => {
  let prisma: DeepMockProxy<PrismaClient>;
  let service: AuditService;

  const subject = (
    identity?: AuditSubject<{ id: string }>['identity'],
  ): AuditSubject<{ id: string }> => ({
    entityType: 'registration',
    locate: (entity) => ({ entityId: entity.id, eventId: 'event-1' }),
    identity,
  });

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    service = new AuditService(prisma);
  });

  it('files the entry where the subject locates it, with its identity', async () => {
    await asUser('user-1', () =>
      service.deleted(
        subject(() => ({ context: { status: 'PENDING' } })),
        { id: 'reg-1' },
        { details: { reason: 'duplicate' } },
      ),
    );

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        action: 'deleted',
        entityType: 'registration',
        entityId: 'reg-1',
        eventId: 'event-1',
        actorId: 'user-1',
        details: { context: { status: 'PENDING' }, reason: 'duplicate' },
      },
    });
  });

  it('stores no details when there are none, and honours an actor override', async () => {
    const record = vi.spyOn(service, 'record');

    await asUser('user-1', () =>
      service.created(subject(), { id: 'reg-1' }, { actorId: null }),
    );

    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: null, details: null }),
    );
  });
});
