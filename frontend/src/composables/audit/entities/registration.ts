import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import type { AuditEntityView } from '@/composables/audit/auditEntityView';
import { formatMoney } from '@camp-registration/common/utils';
import { useRegistrationsStore } from '@/stores/registration-store';
import { useEventDetailsStore } from '@/stores/event-details-store';
import { formatPersonName } from '@/utils/formatters';
import RegistrationDetailsDialog from '@/components/event/table/dialogs/RegistrationDetailsDialog.vue';

export function useRegistrationAuditView(): AuditEntityView {
  const { t, locale } = useI18n({ useScope: 'global' });
  const quasar = useQuasar();
  const store = useRegistrationsStore();
  const eventStore = useEventDetailsStore();

  return {
    icon: 'person',

    // The log stores no participant data; the server names a registration
    // only while it exists. A "deleted" entry already says so in its title.
    subject(entry) {
      if (entry.entityName) {
        return formatPersonName(entry.entityName);
      }
      return entry.entityName === null && entry.action !== 'deleted'
        ? t('audit.entities.registration.deleted')
        : null;
    },

    // Payment entries record minor units of the event currency.
    formatValue(key, value) {
      const currency = eventStore.data?.currency;
      if ((key === 'amount' || key === 'amountDue') && currency) {
        return typeof value === 'number'
          ? formatMoney(value, currency, locale.value)
          : undefined;
      }
      return undefined;
    },

    open: {
      label: () => t('audit.entities.registration.view'),
      // The dialog reads the registration from the store.
      async run(eventId, registrationId) {
        await store.fetchData(eventId).catch(() => undefined);
        if (!store.data?.some((r) => r.id === registrationId)) {
          quasar.notify({
            type: 'negative',
            message: t('audit.entities.registration.gone'),
          });
          return;
        }
        quasar.dialog({
          component: RegistrationDetailsDialog,
          componentProps: { registrationId },
        });
      },
    },
  };
}
