import type { AuditActor } from '@camp-registration/common/entities';

const ACTION_COLORS: Record<string, string> = {
  created: 'positive',
  deleted: 'negative',
};

// Entity-agnostic audit-timeline display helpers (dates, actors, colors),
// shared by the per-registration timeline and the event-wide audit log page.
export function useAuditTimeline() {
  function formatDateTime(timestamp: string, locale: string): string {
    return new Date(timestamp).toLocaleString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function formatTime(timestamp: string, locale: string): string {
    return new Date(timestamp).toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function formatDay(timestamp: string, locale: string): string {
    return new Date(timestamp).toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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
    actorLabel,
    actionColor,
  };
}
