import { useI18n } from 'vue-i18n';
import {
  type AuditEntityView,
  useSettingsLink,
} from '@/composables/audit/auditEntityView';

export function useMessageTemplateAuditView(): AuditEntityView {
  const { locale } = useI18n({ useScope: 'global' });

  return {
    icon: 'drafts',
    open: useSettingsLink('management.event.settings.emails'),

    formatValue(key, value) {
      if (key !== 'country' || typeof value !== 'string') {
        return undefined;
      }
      const code = value.toUpperCase();
      try {
        return (
          new Intl.DisplayNames([locale.value], { type: 'region' }).of(code) ??
          code
        );
      } catch {
        return code;
      }
    },
  };
}
