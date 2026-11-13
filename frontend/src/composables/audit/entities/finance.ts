import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import { formatMoney } from '@camp-registration/common/utils';
import type { AuditValue } from '@camp-registration/common/entities';
import type { AuditEntityView } from '@/composables/audit/auditEntityView';
import { useEventDetailsStore } from '@/stores/event-details-store';

const AMOUNT_KEYS = new Set(['amount', 'originalAmount']);

// Amounts are logged in minor units of the event's currency.
function useMoneyValue() {
  const { locale } = useI18n({ useScope: 'global' });
  const { data: event } = storeToRefs(useEventDetailsStore());

  return (key: string, value: AuditValue): string | undefined =>
    AMOUNT_KEYS.has(key) && typeof value === 'number'
      ? formatMoney(value, event.value?.currency ?? 'EUR', locale.value)
      : undefined;
}

export function useExpenseAuditView(): AuditEntityView {
  return {
    icon: 'receipt_long',
    // The receipt number identifies an expense on paper, also once deleted.
    subject(entry) {
      const number = entry.details?.context?.receiptNumber;
      return typeof number === 'number' ? `#${number.toString()}` : undefined;
    },
    formatValue: useMoneyValue(),
  };
}

export function useExpenseCategoryAuditView(): AuditEntityView {
  return { icon: 'category' };
}

export function usePayoutAuditView(): AuditEntityView {
  return {
    icon: 'payments',
    subject(entry) {
      const number = entry.details?.context?.number;
      return typeof number === 'number' ? `№ ${number.toString()}` : undefined;
    },
    formatValue: useMoneyValue(),
  };
}
