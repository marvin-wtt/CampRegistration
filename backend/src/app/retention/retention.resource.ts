import {
  eventRetentionDeadlineStatus,
  type EventRetention,
  type RetentionPeriods,
  type EventRetentionDeadline,
  type RetentionOverviewEntry,
} from '@camp-registration/common/privacy';
import { JsonResource } from '#core/resource/JsonResource';
import {
  effectiveAt,
  purgedAt,
  type DeadlineWithPostponer,
  type PurgeState,
} from './retention.service.js';

function deadlineData(
  deadline: DeadlineWithPostponer,
  event: PurgeState,
  withReason: boolean,
): EventRetentionDeadline {
  const kind = deadline.kind;
  const resolvedAt = purgedAt(event, kind);

  return {
    id: deadline.id,
    eventId: deadline.eventId,
    kind,
    dueAt: deadline.dueAt.toISOString(),
    effectiveAt: effectiveAt(deadline).toISOString(),
    status: eventRetentionDeadlineStatus(effectiveAt(deadline), resolvedAt),
    postponement:
      deadline.postponedUntil && deadline.postponedAt
        ? {
            until: deadline.postponedUntil.toISOString(),
            ...(withReason && deadline.postponeReason
              ? { reason: deadline.postponeReason }
              : {}),
            postponedAt: deadline.postponedAt.toISOString(),
            postponedBy: deadline.postponedBy?.name ?? null,
          }
        : null,
    resolvedAt: resolvedAt?.toISOString() ?? null,
  };
}

export class EventRetentionResource extends JsonResource<
  {
    event: PurgeState;
    sensitivePurgeIncomplete: boolean;
    deadlines: DeadlineWithPostponer[];
    registrationCount: number;
    periods: RetentionPeriods;
    /** The reason may name a person; only those who can act see it. */
    withReason: boolean;
  },
  EventRetention
> {
  transform(): EventRetention {
    const {
      event,
      sensitivePurgeIncomplete,
      deadlines,
      registrationCount,
      periods,
      withReason,
    } = this.data;

    return {
      deadlines: deadlines.map((deadline) =>
        deadlineData(deadline, event, withReason),
      ),
      purged: {
        sensitive: purgedAt(event, 'sensitive')?.toISOString() ?? null,
        registrations: purgedAt(event, 'registrations')?.toISOString() ?? null,
      },
      sensitivePurgeIncomplete,
      periods,
      registrationCount,
    };
  }
}

type OverviewDeadline = DeadlineWithPostponer & {
  event: PurgeState & {
    id: string;
    name: string | Record<string, string>;
  };
};

export class RetentionOverviewResource extends JsonResource<
  OverviewDeadline,
  RetentionOverviewEntry
> {
  transform(): RetentionOverviewEntry {
    const { event } = this.data;
    const deadline = deadlineData(this.data, event, false);

    return {
      deadlineId: deadline.id,
      eventId: event.id,
      eventName: event.name,
      kind: deadline.kind,
      effectiveAt: deadline.effectiveAt,
      status: deadline.status,
      postponed: deadline.postponement !== null,
    };
  }
}
