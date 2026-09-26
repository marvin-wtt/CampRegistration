import {
  type AuditEntityView,
  useSettingsLink,
} from '@/composables/audit/auditEntityView';
import { useEventManagerStore } from '@/stores/event-manager-store';

export function useEventManagerAuditView(): AuditEntityView {
  const store = useEventManagerStore();

  const find = (id: string) => store.data?.find((m) => m.id === id);

  return {
    icon: 'admin_panel_settings',
    load: (eventId) => store.fetchData(eventId),

    // The live access list is the only source naming a pending invitation;
    // once the access is gone, the generic subject (user or masked email) remains.
    subject(entry) {
      const manager = find(entry.entityId);
      return manager ? (manager.name ?? manager.email) : undefined;
    },

    exists: (id) => (store.data ? !!find(id) : null),
    open: useSettingsLink('management.event.settings.access'),
  };
}
