import { useI18n } from 'vue-i18n';
import type {
  AuditEntityType,
  AuditValue,
} from '@camp-registration/common/entities';

// Value keys resolved elsewhere (e.g. into `subject`) and never shown as a
// raw changed-value chip themselves.
const HIDDEN_VALUE_KEYS = new Set(['userId']);

// Resolves audit entity/action/field names to translated labels from the
// global `audit` i18n namespace (src/i18n/<locale>/audit.ts) — shared across
// every page that renders raw audit-log entries, so labels stay consistent
// and don't need re-adding per component.
export function useAuditFieldLabels() {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const { t, te } = useI18n({ useScope: 'global' });

  function entityLabel(entityType: string): string {
    const key = `audit.entity.${entityType}`;
    return te(key) ? t(key) : entityType;
  }

  function actionLabel(action: string): string {
    const key = `audit.action.${action}`;
    return te(key) ? t(key) : action;
  }

  // A simple (non-dotted) field or value name, e.g. `status`, `role`, `country`.
  function valueLabel(entityType: AuditEntityType, field: string): string {
    const key = `audit.fields.${entityType}.${field}`;
    return te(key) ? t(key) : field;
  }

  function roleLabel(role: string): string {
    const key = `audit.roles.${role.toLowerCase()}`;
    return te(key) ? t(key) : role;
  }

  // A `changedValues` entry's display value — special-cased where the raw
  // value is a code rather than something already readable (e.g. a manager
  // role enum).
  function valueDisplay(
    entityType: AuditEntityType,
    key: string,
    value: AuditValue,
  ): string {
    if (value === null) {
      return '—';
    }
    if (entityType === 'campManager' && key === 'role') {
      return roleLabel(String(value));
    }
    return String(value);
  }

  function isHiddenValueKey(key: string): boolean {
    return HIDDEN_VALUE_KEYS.has(key);
  }

  /**
   * A `changedFields` entry, which may be a dotted dynamic path (`data.allergies`,
   * `form.allergies`) — resolved against the camp's current form questions where
   * possible (`formFieldLabels` keyed by the path after the prefix), falling back
   * to the raw path when there's no match (e.g. a since-removed question).
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
        return `${valueLabel(entityType, prefix)}: ${resolved}`;
      }
    }
    return valueLabel(entityType, path);
  }

  return {
    entityLabel,
    actionLabel,
    valueLabel,
    fieldLabel,
    valueDisplay,
    isHiddenValueKey,
  };
}
