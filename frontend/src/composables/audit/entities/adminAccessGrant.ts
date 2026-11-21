import type { AuditEntityView } from '@/composables/audit/auditEntityView';

// Named by its reason, which the server resolves into `entityName`.
export function useAdminAccessGrantAuditView(): AuditEntityView {
  return {
    icon: 'shield',
  };
}
