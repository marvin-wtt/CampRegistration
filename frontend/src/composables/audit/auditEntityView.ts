import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import type {
  AuditLogEntry,
  AuditValue,
} from '@camp-registration/common/entities';

export interface AuditEntityOpener {
  label(): string;
  run(eventId: string, entityId: string): Promise<void> | void;
}

// What the audit log needs to know about one entity type beyond the entry and
// its translations. Each entity implements it in `entities/<type>.ts`.
export interface AuditEntityView {
  icon: string;
  // Loads the live data `subject`/`exists` read. Best-effort.
  load?(eventId: string): Promise<unknown>;
  // Who or what an entry is about; `undefined` defers to the generic subject.
  subject?(entry: AuditLogEntry): string | null | undefined;
  // Whether the record still exists, `null` while unknown. Only needed for
  // types whose entries carry no server-resolved `entityName`.
  exists?(entityId: string): boolean | null;
  // Opens the record — offered only while it exists.
  open?: AuditEntityOpener;
  // Formats a value the generic rules (dates, translated enums) can't.
  formatValue?(key: string, value: AuditValue): string | undefined;
}

// `open` for an entity managed on a settings page rather than per record.
export function useSettingsLink(routeName: string): AuditEntityOpener {
  const { t } = useI18n({ useScope: 'global' });
  const router = useRouter();

  return {
    label: () => t('audit.viewInSettings'),
    run: async (eventId) => {
      await router.push({ name: routeName, params: { eventId } });
    },
  };
}
