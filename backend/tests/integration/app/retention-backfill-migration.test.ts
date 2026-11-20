import { beforeEach, describe, expect, it } from 'vitest';
import moment from 'moment';
import {
  EventFactory,
  OrganizationFactory,
  PrivacyNoticeFactory,
  RegistrationFactory,
  completePrivacyNoticeContent,
} from '../../../prisma/factories/index.js';
import prisma from '../utils/prisma.js';
import { up } from '../../../prisma/migrations/20261119120000_add_retention_workflow/migration.js';
import { resolve } from '#core/ioc/container';
import { RetentionReminderService } from '#app/retention/retention-reminder.service';
import { mailer } from '../utils/mailer.js';

describe('data migration: add_retention_workflow', () => {
  const run = () => prisma.$transaction((tx) => up(tx));

  beforeEach(async () => {
    await prisma.event.deleteMany();
  });

  /** An event ending `daysAgo` days ago (negative: ahead), one stamped registration. */
  async function pastEvent(daysAgo: number, months: number) {
    const organization = await OrganizationFactory.create(
      {},
      { privacyNotice: null },
    );
    const version = await PrivacyNoticeFactory.createPublished(
      organization.id,
      // As notices were before this migration: no sensitive-data period.
      completePrivacyNoticeContent({
        retention: { months, anchor: 'event_end', exceptions: [] },
      }),
    );
    const endAt = moment().subtract(daysAgo, 'days').toDate();
    const event = await EventFactory.create({
      organization: { connect: { id: organization.id } },
      startAt: moment(endAt).subtract(7, 'days').toDate(),
      endAt,
    });
    await RegistrationFactory.create({
      event: { connect: { id: event.id } },
      organizationPrivacyNotice: { connect: { id: version.id } },
    });

    return event;
  }

  it('marks the deadlines of past events as reminded, so deploying sends nothing', async () => {
    const overdue = await pastEvent(400, 6);
    const dueSoon = await pastEvent(178, 6);
    const far = await pastEvent(10, 24);
    const upcoming = await pastEvent(-20, 2);

    await run();
    await resolve(RetentionReminderService).run();

    const deadlines = await prisma.eventRetentionDeadline.findMany();
    expect(
      deadlines.map(({ eventId, notifiedStage }) => ({
        eventId,
        notifiedStage,
      })),
    ).toEqual(
      expect.arrayContaining(
        [overdue, dueSoon, far].map(({ id }) => ({
          eventId: id,
          notifiedStage: 0,
        })),
      ),
    );
    expect(deadlines).toContainEqual(
      expect.objectContaining({ eventId: upcoming.id, notifiedStage: null }),
    );
    expect(deadlines).toHaveLength(4);
    expect(mailer.sendMail).not.toHaveBeenCalled();
  });

  it('agrees with the live sync for an event stamped with several notices', async () => {
    const event = await pastEvent(400, 6);
    // A second notice version published while registration was open, with
    // another period: the two promises differ.
    const longer = await PrivacyNoticeFactory.createPublished(
      event.organizationId,
      completePrivacyNoticeContent({
        retention: { months: 12, anchor: 'event_end', exceptions: [] },
      }),
    );
    await RegistrationFactory.create({
      event: { connect: { id: event.id } },
      organizationPrivacyNotice: { connect: { id: longer.id } },
    });

    await run();
    const before = await prisma.eventRetentionDeadline.findFirstOrThrow({
      where: { eventId: event.id },
    });
    await resolve(RetentionReminderService).run();
    const after = await prisma.eventRetentionDeadline.findFirstOrThrow({
      where: { eventId: event.id },
    });

    expect(after.dueAt).toEqual(before.dueAt);
    expect(after.notifiedStage).toBe(0);
    expect(mailer.sendMail).not.toHaveBeenCalled();
  });

  it('does nothing on a database without stamped registrations', async () => {
    await EventFactory.create();

    await run();

    expect(await prisma.eventRetentionDeadline.count()).toBe(0);
  });
});
