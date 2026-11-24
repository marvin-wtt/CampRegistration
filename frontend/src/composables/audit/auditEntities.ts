import type { AuditEntityType } from '@camp-registration/common/entities';
import type { AuditEntityView } from '@/composables/audit/auditEntityView';
import { useEventAuditView } from '@/composables/audit/entities/event';
import { useRegistrationAuditView } from '@/composables/audit/entities/registration';
import { useEventManagerAuditView } from '@/composables/audit/entities/eventManager';
import { useMessageAuditView } from '@/composables/audit/entities/message';
import { useMessageTemplateAuditView } from '@/composables/audit/entities/messageTemplate';
import {
  useExpenseAuditView,
  useFinanceCategoryAuditView,
  useIncomeAuditView,
  usePayoutAuditView,
} from '@/composables/audit/entities/finance';
import { useRetentionAuditView } from '@/composables/audit/entities/retention';
import { useAdminAccessGrantAuditView } from '@/composables/audit/entities/adminAccessGrant';

// Every audited entity type's view. Typed over `AuditEntityType`, so a new
// type fails to compile until it's registered here.
export function useAuditEntities(): Record<AuditEntityType, AuditEntityView> {
  return {
    event: useEventAuditView(),
    registration: useRegistrationAuditView(),
    eventManager: useEventManagerAuditView(),
    message: useMessageAuditView(),
    messageTemplate: useMessageTemplateAuditView(),
    expense: useExpenseAuditView(),
    financeCategory: useFinanceCategoryAuditView(),
    payout: usePayoutAuditView(),
    income: useIncomeAuditView(),
    retention: useRetentionAuditView(),
    adminAccessGrant: useAdminAccessGrantAuditView(),
  };
}
