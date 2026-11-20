import { inject, injectable } from 'inversify';
import { BaseService } from '#core/base/BaseService';
import logger from '#core/logger';
import { permissionRegistry } from '#core/permission/permission.registry';
import {
  currentDateInTimeZone,
  daysBetween,
} from '@camp-registration/common/utils';
import {
  RetentionService,
  type Deadline,
  type RetentionEventWithName,
} from './retention.service.js';
import { reminderStage } from './retention.deadlines.js';
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

  async run(now: Date = new Date()): Promise<void> {
    for await (const event of this.retentionService.eventsWithRegistrations()) {
      try {
        const deadlines = await this.retentionService.deadlines(event, now);
        for (const deadline of deadlines) {
          await this.remind(event, deadline, now);
        }
      } catch (error: unknown) {
        // One event's broken notice must not stop the others.
        logger.error(
          `Failed to send the retention reminders of event ${event.id}:`,
          error,
        );
      }
    }
  }

  private async remind(
    event: RetentionEventWithName,
    deadline: Deadline,
    now: Date,
  ): Promise<void> {
    const today = currentDateInTimeZone(event.timezone, now);
    const stage = reminderStage(deadline.effectiveAt, today);
    // Each stage once per date; a missed run catches up with the most urgent.
    const sent = deadline.state;
    if (
      stage === null ||
      (sent?.remindedFor === deadline.effectiveAt &&
        sent.remindedStage !== null &&
        sent.remindedStage <= stage)
    ) {
      return;
    }

    const recipients = await this.recipients(event.id);
    if (recipients.length === 0) {
      logger.warn(
        `Event ${event.id} has nobody to remind of its retention deadline.`,
      );
      return;
    }
    if (!(await this.claim(event.id, deadline, stage))) {
      return;
    }

    await EventRetentionDeadlineMessage.enqueueBulk(
      recipients.map((recipient): EventRetentionDeadlinePayload => ({
        event: { id: event.id, name: event.name },
        recipient,
        kind: deadline.kind,
        effectiveAt: deadline.effectiveAt,
        stage,
        daysLeft: Math.max(0, daysBetween(today, deadline.effectiveAt)),
      })),
    );
  }

  /**
   * Records the stage as sent before it is queued, and only over what was
   * read, so overlapping runs never send twice. A failed enqueue drops this
   * stage (logged); the next one still comes.
   */
  private async claim(
    eventId: string,
    deadline: Deadline,
    stage: number,
  ): Promise<boolean> {
    await this.prisma.eventRetentionState.createMany({
      data: [{ eventId, kind: deadline.kind }],
      skipDuplicates: true,
    });
    const { count } = await this.prisma.eventRetentionState.updateMany({
      where: {
        eventId,
        kind: deadline.kind,
        remindedFor: deadline.state?.remindedFor ?? null,
        remindedStage: deadline.state?.remindedStage ?? null,
      },
      data: { remindedFor: deadline.effectiveAt, remindedStage: stage },
    });

    return count > 0;
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
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      select: { user: { select: { name: true, email: true, locale: true } } },
    });

    return managers.flatMap(({ user }) => (user ? [user] : []));
  }
}
