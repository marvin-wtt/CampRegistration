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

  /** An event that ended `daysAgo` days ago, one stamped registration. */
  async function pastEvent(
    daysAgo: number,
    months: number,
    form: Record<string, unknown> = {},
  ) {
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
      form,
    });
    await RegistrationFactory.create({
      event: { connect: { id: event.id } },
      organizationPrivacyNotice: { connect: { id: version.id } },
    });

    return event;
  }

  it('records past deadlines as already reminded, so deploying sends nothing', async () => {
    const overdue = await pastEvent(400, 6);
    const dueSoon = await pastEvent(178, 6, {
      elements: [{ type: 'comment', name: 'a', privacyCategory: 'allergies' }],
    });

    await run();
    await resolve(RetentionReminderService).run();

    const deadlines = await prisma.retentionDeadline.findMany({
      orderBy: { kind: 'asc' },
    });
    expect(
      deadlines.map(({ eventId, kind, notifiedStage }) => ({
        eventId,
        kind,
        notifiedStage,
      })),
    ).toEqual(
      expect.arrayContaining([
        { eventId: overdue.id, kind: 'registrations', notifiedStage: 0 },
        { eventId: dueSoon.id, kind: 'registrations', notifiedStage: 7 },
        { eventId: dueSoon.id, kind: 'sensitive', notifiedStage: 7 },
      ]),
    );
    expect(deadlines).toHaveLength(3);
    expect(mailer.sendMail).not.toHaveBeenCalled();
  });

  it('leaves a far deadline to be reminded as usual', async () => {
    const event = await pastEvent(10, 24);

    await run();

    const deadline = await prisma.retentionDeadline.findFirstOrThrow({
      where: { eventId: event.id },
    });
    expect(deadline.notifiedStage).toBeNull();
    expect(deadline.dueAt.getMilliseconds()).toBe(0);
  });

  it('does nothing on a database without stamped registrations', async () => {
    await EventFactory.create();

    await run();

    expect(await prisma.retentionDeadline.count()).toBe(0);
  });
});
