import { computed, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type {
  AuditActor,
  AuditEntityType,
  AuditLogEntry,
  AuditValue,
} from '@camp-registration/common/entities';
import { useAuditTimeline } from '@/composables/audit/auditTimeline';
import {
  useAuditLabels,
  useFormFieldLabels,
} from '@/composables/audit/auditLabels';
import { useAuditEntities } from '@/composables/audit/auditEntities';

export interface AuditLogValueDetail {
  label: string;
  value: string;
}

export interface AuditLogDisplayEntry {
  id: string;
  entityId: string;
  entityType: AuditEntityType;
  title: string;
  subject: string | null;
  time: string;
  color: string;
  icon: string;
  fieldLabels: string[];
  valueDetails: AuditLogValueDetail[];
  actor: string | null;
  openLabel: string | null;
}

// One virtual-scroll row: a day heading, or an entry inside that day's card.
export type AuditLogItem =
  | { kind: 'day'; key: string; label: string }
  | {
      kind: 'entry';
      key: string;
      entry: AuditLogDisplayEntry;
      first: boolean;
      last: boolean;
    };

export function useAuditLogEntries(
  entries: Ref<AuditLogEntry[]>,
  timeZone: Ref<string | undefined>,
) {
  const { t, locale } = useI18n({ useScope: 'global' });
  const {
    formatTime,
    formatDay,
    dayKey,
    relativeDay,
    actorLabel,
    actionColor,
  } = useAuditTimeline();
  const { entityLabel, actionLabel, fieldLabel, valueLabel, reasonLabel } =
    useAuditLabels();
  const formFieldLabels = useFormFieldLabels();
  const entityViews = useAuditEntities();

  const deletedUser = () => t('audit.deletedUser');

  // Best-effort — without it, entries only lose their live names and links.
  function loadEntityViews(eventId: string): void {
    for (const view of Object.values(entityViews)) {
      view.load?.(eventId).catch(() => undefined);
    }
  }

  function open(eventId: string, entry: AuditLogDisplayEntry): void {
    if (entry.openLabel) {
      void entityViews[entry.entityType].open?.run(eventId, entry.entityId);
    }
  }

  // Users resolved for any loaded entry of a record, so an older entry recorded
  // before the user was known (e.g. a pending invitation) can still name them.
  const knownSubjects = computed(() => {
    const subjects = new Map<string, AuditActor>();
    for (const entry of entries.value) {
      if (entry.subject) {
        subjects.set(entry.entityId, entry.subject);
      }
    }
    return subjects;
  });

  function subjectOf(entry: AuditLogEntry): string | null {
    const custom = entityViews[entry.entityType].subject?.(entry);
    if (custom !== undefined) {
      return custom;
    }
    if (entry.entityName) {
      return entry.entityName;
    }
    const subject = entry.subject ?? knownSubjects.value.get(entry.entityId);
    if (subject) {
      return actorLabel(subject, deletedUser());
    }
    return entry.details?.subjectHint ?? null;
  }

  function displayValue(
    entityType: AuditEntityType,
    key: string,
    value: AuditValue,
  ): string {
    return (
      entityViews[entityType].formatValue?.(key, value) ??
      valueLabel(entityType, key, value)
    );
  }

  // The subject plus the identifying context, e.g. "Jane Doe · Viewer" — a
  // context value that changed is shown as a value chip instead.
  function subjectLine(entry: AuditLogEntry): string | null {
    const values = entry.details?.values ?? {};
    const context = Object.entries(entry.details?.context ?? {})
      .filter(([key]) => !(key in values))
      .map(([key, value]) => displayValue(entry.entityType, key, value));
    const parts = [subjectOf(entry), ...context].filter(
      (part): part is string => !!part,
    );
    return parts.length > 0 ? parts.join(' · ') : null;
  }

  function valueDetails(entry: AuditLogEntry): AuditLogValueDetail[] {
    const { entityType, details } = entry;
    const reason = details?.reason
      ? [
          {
            label: t('audit.reason'),
            value: reasonLabel(entityType, details.reason),
          },
        ]
      : [];
    const values = Object.entries(details?.values ?? {}).map(
      ([key, value]) => ({
        label: fieldLabel(entityType, key),
        value: displayValue(entityType, key, value),
      }),
    );
    return [...reason, ...values];
  }

  function buildEntry(entry: AuditLogEntry): AuditLogDisplayEntry {
    const { entityType, details } = entry;
    const view = entityViews[entityType];
    const values = details?.values ?? {};
    const exists =
      entry.entityName !== undefined
        ? entry.entityName !== null
        : (view.exists?.(entry.entityId) ?? true);

    return {
      id: entry.id,
      entityId: entry.entityId,
      entityType,
      title: `${entityLabel(entityType)} — ${actionLabel(entityType, entry.action)}`,
      subject: subjectLine(entry),
      time: formatTime(entry.createdAt, locale.value, timeZone.value),
      color: actionColor(entry.action),
      icon: view.icon,
      valueDetails: valueDetails(entry),
      // A field already shown as "label: value" doesn't also need a bare chip.
      fieldLabels: (details?.changedFields ?? [])
        .filter((path) => !(path in values))
        .map((path) => fieldLabel(entityType, path, formFieldLabels.value)),
      actor: actorLabel(entry.actor, deletedUser()),
      openLabel: exists && view.open ? view.open.label() : null,
    };
  }

  function dayLabel(timestamp: string): string {
    const relative = relativeDay(timestamp, timeZone.value);
    return relative
      ? t(`audit.${relative}`)
      : formatDay(timestamp, locale.value, timeZone.value);
  }

  // Entries arrive newest-first, so same-day entries are already adjacent.
  const items = computed<AuditLogItem[]>(() => {
    const result: AuditLogItem[] = [];
    let currentDay: string | null = null;

    for (const entry of entries.value) {
      const day = dayKey(entry.createdAt, timeZone.value);
      if (day !== currentDay) {
        const previous = result.at(-1);
        if (previous?.kind === 'entry') {
          previous.last = true;
        }
        result.push({
          kind: 'day',
          key: day,
          label: dayLabel(entry.createdAt),
        });
        currentDay = day;
      }
      result.push({
        kind: 'entry',
        key: entry.id,
        entry: buildEntry(entry),
        first: result.at(-1)?.kind === 'day',
        last: false,
      });
    }

    const lastItem = result.at(-1);
    if (lastItem?.kind === 'entry') {
      lastItem.last = true;
    }
    return result;
  });

  return { items, loadEntityViews, open };
}
