import {
  type AuditEntityView,
  useSettingsLink,
} from '@/composables/audit/auditEntityView';

export function useEventAuditView(): AuditEntityView {
  return {
    icon: 'cabin',
    open: useSettingsLink('management.event.settings.edit'),
  };
}
