import {
  type AuditEntityView,
  useSettingsLink,
} from '@/features/audit/composables/auditEntityView';

export function useEventAuditView(): AuditEntityView {
  return {
    icon: 'cabin',
    open: useSettingsLink('management.event.settings.edit'),
  };
}
