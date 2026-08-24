import { beforeEach, describe, expect, it } from 'vitest';
import {
  CampFactory,
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
 * A camp end date whose promised period lapses `days` from now. Negative values
 * put the deadline in the past, which is the catch-up case.
 */
function campEndForDeadlineIn(days: number): Date {
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + days);
  deadline.setMonth(deadline.getMonth() - RETENTION_MONTHS);

  return deadline;
}

const notice: PrivacyNoticeContent = completePrivacyNoticeContent({
  retention: { months: RETENTION_MONTHS, anchor: 'camp_end', exceptions: [] },
});

/**
 * A camp whose registrants were shown a notice — the only kind the reminder
 * speaks about. `stamped: false` builds the legacy shape instead: a camp whose
 * registrations predate the notice and were promised nothing.
 */
async function campDue(
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
  const camp = await CampFactory.create({
    organization: { connect: { id: organization.id } },
    endAt: campEndForDeadlineIn(days),
  });

  await RegistrationFactory.create({
    camp: { connect: { id: camp.id } },
    ...(stamped
      ? { organizationPrivacyNotice: { connect: { id: version.id } } }
      : {}),
  });

  const user = await UserFactory.create();
  await prisma.campManager.create({
    data: { campId: camp.id, userId: user.id, role },
  });

  return { camp, user };
}

const run = () => resolve(PrivacyRetentionService).sendDueRetentionReminders();

const reminderSentAt = async (campId: string) =>
  prisma.camp
    .findUniqueOrThrow({
      where: { id: campId },
      select: { retentionReminderSentAt: true },
    })
    .then((camp) => camp.retentionReminderSentAt);

describe('retention reminders', () => {
  beforeEach(async () => {
    await prisma.camp.deleteMany();
  });

  it('should tell the camp director that the period is running out', async () => {
    const { camp, user } = await campDue(10);

    await run();

    expect(await reminderSentAt(camp.id)).not.toBeNull();
    expect(mailer.sendMail).toHaveBeenCalledTimes(1);
    expect(mailer.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: expect.objectContaining({ address: user.email }),
      }),
    );
  });

  it('should still send once the deadline has already passed', async () => {
    const { camp } = await campDue(-40);

    await run();

    expect(await reminderSentAt(camp.id)).not.toBeNull();
    expect(mailer.sendMail).toHaveBeenCalledTimes(1);
  });

  it('should stay quiet while the deadline is beyond the lead window', async () => {
    const { camp } = await campDue(90);

    await run();

    expect(await reminderSentAt(camp.id)).toBeNull();
    expect(mailer.sendMail).not.toHaveBeenCalled();
  });

  it('should never send a second time for the same camp', async () => {
    const { camp } = await campDue(10);

    await run();
    await run();

    expect(mailer.sendMail).toHaveBeenCalledTimes(1);
    expect(await reminderSentAt(camp.id)).not.toBeNull();
  });

  // Nobody was promised anything, so there is no date to remind anyone of.
  it('should skip a camp whose registrations were never shown a notice', async () => {
    const { camp } = await campDue(10, { stamped: false });

    await run();

    expect(await reminderSentAt(camp.id)).toBeNull();
    expect(mailer.sendMail).not.toHaveBeenCalled();
  });

  /*
   * MJML drops handlebars block helpers that sit between its own elements, so
   * a `{{#if}}` outside `<mj-raw>` compiles away and its body renders
   * unconditionally. That failed silently once already: the mail told every
   * camp not to delete what its exceptions cover, including the camps that
   * have none.
   */
  describe('the conditional paragraphs', () => {
    const sentBody = () =>
      (mailer.sendMail as unknown as { mock: { calls: [{ html: string }][] } })
        .mock.calls[0]![0].html;

    it('should stay silent about exceptions a camp does not have', async () => {
      await campDue(10);

      await run();

      expect(sentBody()).not.toContain('kept beyond this period');
      expect(sentBody()).not.toContain('withdraws that consent');
    });

    it('should warn about exceptions a camp does have', async () => {
      await campDue(10, {
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
  it('should withhold the reminder when the camp has no director', async () => {
    const { camp } = await campDue(10, { role: 'COORDINATOR' });

    await run();

    expect(await reminderSentAt(camp.id)).toBeNull();
    expect(mailer.sendMail).not.toHaveBeenCalled();
  });
});
