import type {
  EventRetention,
  EventRetentionDeadline,
  RetentionOverviewEntry,
  RetentionPeriods,
} from '@camp-registration/common/privacy';
import { JsonResource } from '#core/resource/JsonResource';
import type { DeadlineDates } from './retention.deadlines.js';
import {
  purgedAt,
  type Deadline,
  type PurgeState,
  type RetentionEventWithName,
} from './retention.service.js';

function deadlineData(
  deadline: Deadline,
  withReason: boolean,
): EventRetentionDeadline {
  const { state } = deadline;
  // A postponement the promise has since reached moves nothing.
  const postponed = deadline.effectiveAt > deadline.dueAt ? state : null;

  return {
    kind: deadline.kind,
    dueAt: deadline.dueAt,
    effectiveAt: deadline.effectiveAt,
    status: deadline.status,
    postponement: postponed?.postponedAt
      ? {
          until: deadline.effectiveAt,
          ...(withReason && postponed.postponeReason
            ? { reason: postponed.postponeReason }
            : {}),
          postponedAt: postponed.postponedAt.toISOString(),
          postponedBy: postponed.postponedBy?.name ?? null,
        }
      : null,
    postponeRange: deadline.postponeRange,
  };
}

export class EventRetentionResource extends JsonResource<
  {
    event: PurgeState;
    deadlines: Deadline[];
    periods: RetentionPeriods;
    estimates: DeadlineDates;
    /** The reason may name a person; only those who can act see it. */
    withReason: boolean;
  },
  EventRetention
> {
  transform(): EventRetention {
    const { event, deadlines, periods, estimates, withReason } = this.data;

    return {
      deadlines: deadlines.map((deadline) =>
        deadlineData(deadline, withReason),
      ),
      estimates,
      periods,
      purged: {
        sensitive: purgedAt(event, 'sensitive')?.toISOString() ?? null,
        registrations: purgedAt(event, 'registrations')?.toISOString() ?? null,
      },
    };
  }
}

export class RetentionOverviewResource extends JsonResource<
  Deadline & { event: RetentionEventWithName },
  RetentionOverviewEntry
> {
  transform(): RetentionOverviewEntry {
    const { event } = this.data;
    const deadline = deadlineData(this.data, false);

    return {
      eventId: event.id,
      eventName: event.name,
      kind: deadline.kind,
      effectiveAt: deadline.effectiveAt,
      status: deadline.status,
      postponed: deadline.postponement !== null,
    };
  }
}
