import type { AuditEntityType } from '@camp-registration/common/entities';
import type { AuditEntityView } from '@/features/audit/composables/auditEntityView';
import { useEventAuditView } from '@/features/audit/composables/entities/event';
import { useRegistrationAuditView } from '@/features/audit/composables/entities/registration';
import { useEventManagerAuditView } from '@/features/audit/composables/entities/eventManager';
import { useMessageAuditView } from '@/features/audit/composables/entities/message';
import { useMessageTemplateAuditView } from '@/features/audit/composables/entities/messageTemplate';

// Every audited entity type's view. Typed over `AuditEntityType`, so a new
// type fails to compile until it's registered here.
export function useAuditEntities(): Record<AuditEntityType, AuditEntityView> {
  return {
    event: useEventAuditView(),
    registration: useRegistrationAuditView(),
    eventManager: useEventManagerAuditView(),
    message: useMessageAuditView(),
    messageTemplate: useMessageTemplateAuditView(),
  };
}
