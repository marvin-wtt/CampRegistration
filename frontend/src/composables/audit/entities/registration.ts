import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import type { AuditEntityView } from '@/composables/audit/auditEntityView';
import { useRegistrationsStore } from '@/stores/registration-store';
import { formatPersonName } from '@/utils/formatters';
import RegistrationDetailsDialog from '@/components/event/table/dialogs/RegistrationDetailsDialog.vue';

export function useRegistrationAuditView(): AuditEntityView {
  const { t } = useI18n({ useScope: 'global' });
  const quasar = useQuasar();
  const store = useRegistrationsStore();

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
