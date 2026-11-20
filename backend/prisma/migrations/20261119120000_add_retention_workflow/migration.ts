import type { Prisma } from '#generated/prisma/client.js';
import type { PrivacyNoticeContent } from '@camp-registration/common/privacy';
import { ulid } from 'ulidx';
import { promisedDeadlines } from '#app/retention/retention.deadlines';

/**
 * Creates the retention deadlines of existing events. Those of events already
 * over are marked as fully reminded, so deploying the workflow mails nothing
 * about them; upcoming events are reminded as usual.
 *
 * The dates come from the live rule (`promisedDeadlines`), so the first daily
 * sync finds them unchanged: a date on another day would reset the reminder
 * and mail every past deadline at once. Only general deadlines: no form could
 * tag a sensitive question before this release.
 */
export async function up(tx: Prisma.TransactionClient): Promise<void> {
  const stamps = await tx.registration.groupBy({
    by: [
      'eventId',
      'organizationPrivacyNoticeVersionId',
      'eventPrivacyNoticeVersionId',
    ],
    where: { organizationPrivacyNoticeVersionId: { not: null } },
    _min: { createdAt: true },
  });
  if (stamps.length === 0) {
    return;
  }

  const versionIds = [
    ...new Set(
      stamps.flatMap((stamp) =>
        [
          stamp.organizationPrivacyNoticeVersionId,
          stamp.eventPrivacyNoticeVersionId,
        ].filter((id): id is string => id !== null),
      ),
    ),
  ];
  const versions = await tx.privacyNoticeVersion.findMany({
    where: { id: { in: versionIds } },
    select: { id: true, content: true },
  });
  const contents = new Map(
    versions.map(({ id, content }) => [id, content as PrivacyNoticeContent]),
  );
  const contentOf = (id: string | null) =>
    (id ? contents.get(id) : undefined) ?? null;

  const events = await tx.event.findMany({
    where: { id: { in: [...new Set(stamps.map((stamp) => stamp.eventId))] } },
    select: { id: true, endAt: true },
  });

  const now = new Date();
  const rows: Prisma.EventRetentionDeadlineCreateManyInput[] = [];
  for (const event of events) {
    const { registrations: dueAt } = promisedDeadlines(
      stamps.filter((stamp) => stamp.eventId === event.id),
      contentOf,
      event.endAt,
    );
    if (dueAt) {
      rows.push({
        id: ulid(),
        eventId: event.id,
        kind: 'registrations',
        dueAt,
        // 0: reminded on the deadline itself, the last stage there is.
        notifiedStage: event.endAt < now ? 0 : null,
      });
    }
  }

  if (rows.length > 0) {
    await tx.eventRetentionDeadline.createMany({
      data: rows,
      skipDuplicates: true,
    });
  }
}
