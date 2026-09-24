import { useI18n } from 'vue-i18n';
import type {
  AuditEntityType,
  AuditValue,
} from '@camp-registration/common/entities';

// How the backend records a `Date` value.
const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

// Resolves audit labels from the global `audit` i18n namespace, where each
// entity owns its label, field names, action wording, and value labels
// (`audit.entities.<type>.*`) — a new entity needs translations, not code.
export function useAuditLabels() {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const { t, te, locale } = useI18n({ useScope: 'global' });

  function translate(keys: string[], fallback: string): string {
    const key = keys.find((candidate) => te(candidate));
    return key ? t(key) : fallback;
  }

  function entityLabel(entityType: AuditEntityType): string {
    return translate([`audit.entities.${entityType}.label`], entityType);
  }

  // An entity may word an action its own way (a message is "Sent").
  function actionLabel(entityType: AuditEntityType, action: string): string {
    return translate(
      [
        `audit.entities.${entityType}.actions.${action}`,
        `audit.actions.${action}`,
      ],
      action,
    );
  }

  /**
   * A changed field, which may be a dotted dynamic path (`data.allergies`,
   * `form.allergies`) — resolved against the event's form questions where
   * possible, falling back to the raw path (e.g. a since-removed question).
   */
  function fieldLabel(
    entityType: AuditEntityType,
    path: string,
    formFieldLabels?: Map<string, string>,
  ): string {
    const separatorIndex = path.indexOf('.');
    if (separatorIndex !== -1 && formFieldLabels) {
      const prefix = path.slice(0, separatorIndex);
      const resolved = formFieldLabels.get(path.slice(separatorIndex + 1));
      if (resolved) {
        return `${fieldLabel(entityType, prefix)}: ${resolved}`;
      }
    }
    return translate([`audit.entities.${entityType}.fields.${path}`], path);
  }

  // A recorded value: a date, a translated enum value (e.g. a role), or as-is.
  function valueLabel(
    entityType: AuditEntityType,
    key: string,
    value: AuditValue,
  ): string {
    if (value === null) {
      return '—';
    }
    const text = String(value);
    if (ISO_DATE_TIME.test(text)) {
      return new Date(text).toLocaleString(locale.value, {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    }
    return translate(
      [`audit.entities.${entityType}.values.${key}.${text}`],
      text,
    );
  }

  // Why an action happened — a code the entity translates under `reasons`.
  function reasonLabel(entityType: AuditEntityType, reason: string): string {
    return translate(
      [`audit.entities.${entityType}.reasons.${reason}`],
      reason,
    );
  }

  return { entityLabel, actionLabel, fieldLabel, valueLabel, reasonLabel };
}
