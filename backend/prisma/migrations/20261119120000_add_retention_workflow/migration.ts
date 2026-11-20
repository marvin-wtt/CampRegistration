import type { Prisma } from '#generated/prisma/client.js';
import moment from 'moment';
import { ulid } from 'ulidx';

/**
 * Backfills the retention deadlines of existing events, with every reminder
 * stage already reached recorded as sent. Without it the first daily run would
 * mail managers and organization admins about every past deadline at once —
 * the old reminder had marked all ended events as reminded, a flag this
 * migration's schema change drops.
 *
 * Self-contained on purpose: it mirrors the deadline rule of
 * `retention.deadlines.ts` as it stood when written. The rule: per pair of
 * notice versions stamped on an event's registrations, the composed retention
 * period (the event's if it set one, else the organization's) counted from the
 * event's end or the last registration under that pair; the latest wins.
 * Only general deadlines: no form could tag a sensitive question before this
 * release, so the live sync adds sensitive deadlines once a form does.
 */

const REMINDER_STAGES = [30, 7, 1, 0];

interface Retention {
  months?: unknown;
  anchor?: unknown;
}

interface NoticeContent {
  mode?: unknown;
  retention?: Retention | null;
}

function retentionOf(
  organization: NoticeContent | undefined,
  event: NoticeContent | undefined,
): { months: number; anchor: string } | null {
  if (!organization) {
    return null;
  }
  const retention = event?.retention ?? organization.retention;
  if (
    !retention ||
    typeof retention.months !== 'number' ||
    retention.months <= 0
  ) {
    return null;
  }
  return {
    months: retention.months,
    anchor: retention.anchor === 'submission' ? 'submission' : 'event_end',
  };
}

/** The most urgent stage already reached, as the reminder job counts it. */
function reachedStage(deadline: Date, now: Date): number | null {
  const daysLeft = moment
    .utc(deadline)
    .startOf('day')
    .diff(moment.utc(now).startOf('day'), 'days');
  const reached = REMINDER_STAGES.filter((stage) => daysLeft <= stage);
  return reached.length > 0 ? Math.min(...reached) : null;
}

export async function up(tx: Prisma.TransactionClient): Promise<void> {
  const stamps = await tx.registration.groupBy({
    by: [
      'eventId',
      'organizationPrivacyNoticeVersionId',
      'eventPrivacyNoticeVersionId',
    ],
    where: { organizationPrivacyNoticeVersionId: { not: null } },
    _max: { createdAt: true },
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
  const contentOf = new Map(
    versions.map(({ id, content }) => [id, content as NoticeContent]),
  );

  const events = await tx.event.findMany({
    where: { id: { in: [...new Set(stamps.map((stamp) => stamp.eventId))] } },
    select: { id: true, endAt: true },
  });

  const stampsByEvent = new Map<string, typeof stamps>();
  for (const stamp of stamps) {
    stampsByEvent.set(stamp.eventId, [
      ...(stampsByEvent.get(stamp.eventId) ?? []),
      stamp,
    ]);
  }

  const now = new Date();
  const rows: Prisma.RetentionDeadlineCreateManyInput[] = [];

  for (const event of events) {
    let due: Date | null = null;

    for (const stamp of stampsByEvent.get(event.id) ?? []) {
      const organization = contentOf.get(
        stamp.organizationPrivacyNoticeVersionId ?? '',
      );
      if (organization?.mode === 'free_text') {
        continue;
      }
      const retention = retentionOf(
        organization,
        stamp.eventPrivacyNoticeVersionId
          ? contentOf.get(stamp.eventPrivacyNoticeVersionId)
          : undefined,
      );
      if (!retention) {
        continue;
      }

      const from =
        retention.anchor === 'event_end'
          ? event.endAt
          : (stamp._max.createdAt ?? event.endAt);
      const candidate = moment
        .utc(from)
        .add(retention.months, 'months')
        .toDate();
      // Whole seconds, as the column stores them.
      candidate.setMilliseconds(0);
      if (!due || candidate > due) {
        due = candidate;
      }
    }

    if (!due) {
      continue;
    }

    rows.push({
      id: ulid(),
      eventId: event.id,
      kind: 'registrations',
      dueAt: due,
      notifiedStage: reachedStage(due, now),
    });
  }

  if (rows.length > 0) {
    await tx.retentionDeadline.createMany({ data: rows, skipDuplicates: true });
  }
}
