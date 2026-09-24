import type { AuditActor } from '@camp-registration/common/entities';

const ACTION_COLORS: Record<string, string> = {
  created: 'positive',
  deleted: 'negative',
};

const DAY_MS = 24 * 60 * 60 * 1000;

// Entity-agnostic audit-timeline display helpers (dates, actors, colors),
// shared by the per-registration timeline and the event-wide audit log page.
// Dates are shown in `timeZone` (the event's) when given.
export function useAuditTimeline() {
  function formatDateTime(
    timestamp: string,
    locale: string,
    timeZone?: string,
  ): string {
    return new Date(timestamp).toLocaleString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone,
    });
  }

  function formatTime(
    timestamp: string,
    locale: string,
    timeZone?: string,
  ): string {
    return new Date(timestamp).toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
      timeZone,
    });
  }

  function formatDay(
    timestamp: string,
    locale: string,
    timeZone?: string,
  ): string {
    return new Date(timestamp).toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone,
    });
  }

  // The calendar day (`YYYY-MM-DD`) an instant falls on in `timeZone`.
  function dayKey(date: Date | string, timeZone?: string): string {
    return new Date(date).toLocaleDateString('en-CA', { timeZone });
  }

  // "today" / "yesterday" / null, relative to now in `timeZone`.
  function relativeDay(
    timestamp: string,
    timeZone?: string,
  ): 'today' | 'yesterday' | null {
    const key = dayKey(timestamp, timeZone);
    const now = Date.now();
    if (key === dayKey(new Date(now), timeZone)) {
      return 'today';
    }
    if (key === dayKey(new Date(now - DAY_MS), timeZone)) {
      return 'yesterday';
    }
    return null;
  }

  function actorLabel(
    actor: AuditActor | null,
    deletedUserLabel: string,
  ): string | null {
    if (actor === null) {
      return null;
    }
    return actor.name ?? deletedUserLabel;
  }

  // Only the generic lifecycle has a color of its own; entity-specific actions
  // (a message being sent, an invitation accepted) read as a plain change.
  function actionColor(action: string): string {
    return ACTION_COLORS[action] ?? 'primary';
  }

  return {
    formatDateTime,
    formatTime,
    formatDay,
    dayKey,
    relativeDay,
    actorLabel,
    actionColor,
  };
}
