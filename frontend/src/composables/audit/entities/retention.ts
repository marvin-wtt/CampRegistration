import { useI18n } from 'vue-i18n';
import type { AuditEntityView } from '@/composables/audit/auditEntityView';

// Deletions and postponements of the retention workflow (docs/privacy.md, 8).
export function useRetentionAuditView(): AuditEntityView {
  const { t } = useI18n({ useScope: 'global' });

  return {
    icon: 'auto_delete',
    subject(entry) {
      const kind = entry.details?.context?.kind;
      return typeof kind === 'string'
        ? t(`audit.entities.retention.kinds.${kind}`)
        : undefined;
    },
  };
}
