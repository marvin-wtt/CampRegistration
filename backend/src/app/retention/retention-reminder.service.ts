import { inject, injectable } from 'inversify';
import moment from 'moment';
import { BaseService } from '#core/base/BaseService';
import logger from '#core/logger';
import { permissionRegistry } from '#core/permission/permission.registry';
import { RETENTION_REMINDER_STAGES } from '@camp-registration/common/privacy';
import {
  RetentionService,
  effectiveAt,
  purgedAt,
} from './retention.service.js';
import { daysUntil, reminderStage } from './retention.deadlines.js';
import {
  EventRetentionDeadlineMessage,
  type EventRetentionDeadlinePayload,
} from './retention.messages.js';

/**
 * Reminds the managers who can delete registrations 30 days before a deadline
 * and on the deadline itself. Deadlines whose data is deleted get nothing more.
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
    const deadlines = await this.prisma.eventRetentionDeadline.findMany({
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
            sensitiveDataPurgedAt: true,
            registrationDataPurgedAt: true,
          },
        },
      },
    });

    for (const deadline of deadlines) {
      const kind = deadline.kind;
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
        const recipients = await this.recipients(deadline.event.id);
        if (recipients.length === 0) {
          logger.warn(
            `Event ${deadline.event.id} has nobody to remind of its retention deadline.`,
          );
          continue;
        }

        // Claimed before enqueuing, so overlapping runs never send twice. A
        // failed enqueue drops this stage (logged); the next one still comes.
        const { count } = await this.prisma.eventRetentionDeadline.updateMany({
          where: { id: deadline.id, notifiedStage: deadline.notifiedStage },
          data: { notifiedStage: stage },
        });
        if (count === 0) {
          continue;
        }

        await EventRetentionDeadlineMessage.enqueueBulk(
          recipients.map((recipient): EventRetentionDeadlinePayload => ({
            event: { id: deadline.event.id, name: deadline.event.name },
            recipient,
            kind,
            effectiveAt: effectiveAt(deadline).toISOString(),
            stage,
            daysLeft: Math.max(0, daysUntil(effectiveAt(deadline), now)),
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

  /** The managers allowed to delete registrations, since they can act. */
  private async recipients(eventId: string) {
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

    return managers.flatMap(({ user }) => (user ? [user] : []));
  }
}
