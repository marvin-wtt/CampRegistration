import { inject, injectable } from 'inversify';
import moment from 'moment';
import { BaseService } from '#core/base/BaseService';
import logger from '#core/logger';
import { permissionRegistry } from '#core/permission/permission.registry';
import {
  RETENTION_REMINDER_STAGES,
  type RetentionDeadlineKind,
} from '@camp-registration/common/privacy';
import {
  RetentionService,
  effectiveAt,
  purgedAt,
} from './retention.service.js';
import {
  RetentionDeadlineMessage,
  type RetentionDeadlinePayload,
} from './retention.messages.js';

/**
 * Reminds the managers who can delete registrations 30, 7 and 1 day before a
 * deadline, and on the deadline itself, when the organization's admins hear
 * about it too. Deadlines whose data is deleted get nothing more.
 */
@injectable()
export class RetentionReminderService extends BaseService {
  constructor(
    @inject(RetentionService)
    private readonly retentionService: RetentionService,
  ) {
    super();
  }

  async run(): Promise<void> {
    await this.retentionService.syncAll();
    await this.sendDueReminders();
  }

  async sendDueReminders(now: Date = new Date()): Promise<void> {
    const horizon = moment(now)
      .add(Math.max(...RETENTION_REMINDER_STAGES), 'days')
      .endOf('day')
      .toDate();

    // Only what can be due: within reach of the first stage, and not yet
    // reminded on the deadline itself.
    const deadlines = await this.prisma.retentionDeadline.findMany({
      where: {
        event: { registrationDataPurgedAt: null },
        OR: [{ notifiedStage: null }, { notifiedStage: { gt: 0 } }],
        AND: [
          {
            OR: [
              { postponedUntil: null, dueAt: { lte: horizon } },
              { postponedUntil: { lte: horizon } },
            ],
          },
        ],
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            organizationId: true,
            sensitiveDataPurgedAt: true,
            registrationDataPurgedAt: true,
          },
        },
      },
    });

    for (const deadline of deadlines) {
      const kind = deadline.kind as RetentionDeadlineKind;
      if (purgedAt(deadline.event, kind)) {
        continue;
      }

      const stage = reminderStage(effectiveAt(deadline), now);
      // Each stage once; a missed run catches up with the most urgent one.
      if (
        stage === null ||
        (deadline.notifiedStage !== null && deadline.notifiedStage <= stage)
      ) {
        continue;
      }

      try {
        const recipients = await this.recipients(
          deadline.event.id,
          deadline.event.organizationId,
          stage,
        );
        if (recipients.length === 0) {
          logger.warn(
            `Event ${deadline.event.id} has nobody to remind of its retention deadline.`,
          );
          continue;
        }

        await this.prisma.retentionDeadline.update({
          where: { id: deadline.id },
          data: { notifiedStage: stage },
        });

        await RetentionDeadlineMessage.enqueueBulk(
          recipients.map(({ audience, user }): RetentionDeadlinePayload => ({
            event: {
              id: deadline.event.id,
              name: deadline.event.name,
              organizationId: deadline.event.organizationId,
            },
            recipient: user,
            audience,
            kind,
            effectiveAt: effectiveAt(deadline).toISOString(),
            stage,
          })),
        );
      } catch (error: unknown) {
        logger.error(
          `Failed to send the retention reminder for event ${deadline.event.id}:`,
          error,
        );
      }
    }
  }

  /**
   * The managers allowed to delete registrations, since they can act; on the
   * deadline also the organization's admins, who cannot see the data but
   * answer for the organization.
   */
  private async recipients(
    eventId: string,
    organizationId: string,
    stage: number,
  ) {
    const roles = Object.entries(permissionRegistry.for('event').getAll())
      .filter(([, permissions]) =>
        permissions.includes('event.registrations.delete'),
      )
      .map(([role]) => role);

    const managers = await this.prisma.eventManager.findMany({
      where: {
        eventId,
        role: { in: roles },
        userId: { not: null },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      select: { user: { select: { name: true, email: true, locale: true } } },
    });

    const admins =
      stage === 0
        ? await this.prisma.organizationMember.findMany({
            where: { organizationId, role: 'ADMIN', userId: { not: null } },
            select: {
              user: { select: { name: true, email: true, locale: true } },
            },
          })
        : [];

    // Someone who is both manager and admin gets the manager's mail only.
    const recipients = new Map<
      string,
      { audience: 'manager' | 'organization'; user: Recipient }
    >();
    for (const [audience, members] of [
      ['manager', managers],
      ['organization', admins],
    ] as const) {
      for (const { user } of members) {
        if (user && !recipients.has(user.email)) {
          recipients.set(user.email, { audience, user });
        }
      }
    }

    return [...recipients.values()];
  }
}

interface Recipient {
  name: string | null;
  email: string;
  locale: string | null;
}

/** The most urgent stage reached, or null while more than 30 days away. */
export function reminderStage(deadline: Date, now: Date): number | null {
  const daysLeft = moment
    .utc(deadline)
    .startOf('day')
    .diff(moment.utc(now).startOf('day'), 'days');
  const reached = RETENTION_REMINDER_STAGES.filter(
    (stage) => daysLeft <= stage,
  );

  return reached.length > 0 ? Math.min(...reached) : null;
}
