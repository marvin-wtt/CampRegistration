import { beforeEach, describe, expect, it } from 'vitest';
import {
  EventFactory,
  OrganizationFactory,
  PrivacyNoticeFactory,
  RegistrationFactory,
  UserFactory,
  completePrivacyNoticeContent,
} from '../../../prisma/factories/index.js';
import prisma from '../utils/prisma.js';
import { resolve } from '#core/ioc/container';
import { NoOpMailer } from '#app/mail/noop.mailer';
import { PrivacyRetentionService } from '#app/privacyNotice/privacy-retention.service';
import type { PrivacyNoticeContent } from '@camp-registration/common/privacy';

const mailer = NoOpMailer.prototype;

const RETENTION_MONTHS = 24;

/**
 * A event end date whose promised period lapses `days` from now. Negative values
 * put the deadline in the past, which is the catch-up case.
 */
function eventEndForDeadlineIn(days: number): Date {
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + days);
  deadline.setMonth(deadline.getMonth() - RETENTION_MONTHS);

  return deadline;
}

const notice: PrivacyNoticeContent = completePrivacyNoticeContent({
  retention: { months: RETENTION_MONTHS, anchor: 'camp_end', exceptions: [] },
});

/**
 * A event whose registrants were shown a notice — the only kind the reminder
 * speaks about. `stamped: false` builds the legacy shape instead: a event whose
 * registrations predate the notice and were promised nothing.
 */
async function eventDue(
  days: number,
  {
    stamped = true,
    role = 'DIRECTOR',
    content = notice,
  }: {
    stamped?: boolean;
    role?: string;
    content?: PrivacyNoticeContent;
  } = {},
) {
  const organization = await OrganizationFactory.create(
    { verificationStatus: 'VERIFIED' },
    { privacyNotice: null },
  );
  const version = await PrivacyNoticeFactory.createPublished(
    organization.id,
    content,
  );
  const event = await EventFactory.create({
    organization: { connect: { id: organization.id } },
    endAt: eventEndForDeadlineIn(days),
  });

  await RegistrationFactory.create({
    event: { connect: { id: event.id } },
    ...(stamped
      ? { organizationPrivacyNotice: { connect: { id: version.id } } }
      : {}),
  });

  const user = await UserFactory.create();
  await prisma.eventManager.create({
    data: { eventId: event.id, userId: user.id, role },
  });

  return { event, user };
}

const run = () => resolve(PrivacyRetentionService).sendDueRetentionReminders();

const reminderSentAt = async (eventId: string) =>
  prisma.event
    .findUniqueOrThrow({
      where: { id: eventId },
      select: { retentionReminderSentAt: true },
    })
    .then((event) => event.retentionReminderSentAt);

describe('retention reminders', () => {
  beforeEach(async () => {
    await prisma.event.deleteMany();
  });

  it('should tell the event director that the period is running out', async () => {
    const { event, user } = await eventDue(10);

    await run();

    expect(await reminderSentAt(event.id)).not.toBeNull();
    expect(mailer.sendMail).toHaveBeenCalledTimes(1);
    expect(mailer.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: expect.objectContaining({ address: user.email }),
      }),
    );
  });

  it('should still send once the deadline has already passed', async () => {
    const { event } = await eventDue(-40);

    await run();

    expect(await reminderSentAt(event.id)).not.toBeNull();
    expect(mailer.sendMail).toHaveBeenCalledTimes(1);
  });

  it('should stay quiet while the deadline is beyond the lead window', async () => {
    const { event } = await eventDue(90);

    await run();

    expect(await reminderSentAt(event.id)).toBeNull();
    expect(mailer.sendMail).not.toHaveBeenCalled();
  });

  it('should never send a second time for the same event', async () => {
    const { event } = await eventDue(10);

    await run();
    await run();

    expect(mailer.sendMail).toHaveBeenCalledTimes(1);
    expect(await reminderSentAt(event.id)).not.toBeNull();
  });

  // Nobody was promised anything, so there is no date to remind anyone of.
  it('should skip a event whose registrations were never shown a notice', async () => {
    const { event } = await eventDue(10, { stamped: false });

    await run();

    expect(await reminderSentAt(event.id)).toBeNull();
    expect(mailer.sendMail).not.toHaveBeenCalled();
  });

  /*
   * MJML drops handlebars block helpers that sit between its own elements, so
   * a `{{#if}}` outside `<mj-raw>` compiles away and its body renders
   * unconditionally. That failed silently once already: the mail told every
   * event not to delete what its exceptions cover, including the events that
   * have none.
   */
  describe('the conditional paragraphs', () => {
    const sentBody = () =>
      (mailer.sendMail as unknown as { mock: { calls: [{ html: string }][] } })
        .mock.calls[0]![0].html;

    it('should stay silent about exceptions a event does not have', async () => {
      await eventDue(10);

      await run();

      expect(sentBody()).not.toContain('kept beyond this period');
      expect(sentBody()).not.toContain('withdraws that consent');
    });

    it('should warn about exceptions a event does have', async () => {
      await eventDue(10, {
        content: completePrivacyNoticeContent({
          purposes: [
            { key: 'registration_administration', legalBasis: 'contract' },
            { key: 'photo_publication', legalBasis: 'consent' },
          ],
          retention: {
            months: RETENTION_MONTHS,
            anchor: 'camp_end',
            exceptions: [
              { scope: 'photo_publication', until: 'consent_withdrawn' },
            ],
          },
        }),
      });

      await run();

      expect(sentBody()).toContain('kept beyond this period');
      expect(sentBody()).toContain('withdraws that consent');
    });
  });

  // Telling someone to delete data they cannot reach is not a reminder, and
  // spending the one notification on them would lose it for good.
  it('should withhold the reminder when the event has no director', async () => {
    const { event } = await eventDue(10, { role: 'COORDINATOR' });

    await run();

    expect(await reminderSentAt(event.id)).toBeNull();
    expect(mailer.sendMail).not.toHaveBeenCalled();
  });
});
