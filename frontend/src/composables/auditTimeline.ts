import type { AuditActor } from '@camp-registration/common/entities';

// Entity-agnostic audit-timeline display helpers, shared by the per-registration
// timeline and the camp-wide audit log page. Translated labels stay with the
// calling component (its own `<i18n>` block) — this composable only shapes
// dates/colors/icons.
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

  function actionColor(action: string): string {
    switch (action) {
      case 'created':
        return 'positive';
      case 'deleted':
        return 'negative';
      default:
        return 'primary';
    }
  }

  // What kind of record the entry is about — paired with `actionColor` so a
  // marker reads as "a message template" (icon) "was deleted" (color) at a glance.
  function entityIcon(entityType: string): string {
    switch (entityType) {
      case 'camp':
        return 'cabin';
      case 'registration':
        return 'person';
      case 'campManager':
        return 'admin_panel_settings';
      case 'message':
        return 'mail';
      case 'messageTemplate':
        return 'drafts';
      default:
        return 'history';
    }
  }

  return {
    formatDateTime,
    formatTime,
    formatDay,
    actorLabel,
    actionColor,
    entityIcon,
  };
}
