import type { AuditEntityType } from '@camp-registration/common/entities';
import type { AuditEntityView } from '@/composables/audit/auditEntityView';
import { useEventAuditView } from '@/composables/audit/entities/event';
import { useRegistrationAuditView } from '@/composables/audit/entities/registration';
import { useEventManagerAuditView } from '@/composables/audit/entities/eventManager';
import { useMessageAuditView } from '@/composables/audit/entities/message';
import { useMessageTemplateAuditView } from '@/composables/audit/entities/messageTemplate';

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
