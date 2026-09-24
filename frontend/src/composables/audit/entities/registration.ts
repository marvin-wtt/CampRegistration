import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import type { AuditEntityView } from '@/composables/audit/auditEntityView';
import { useRegistrationsStore } from '@/stores/registration-store';
import { useRegistrationHelper } from '@/composables/registrationHelper';
import { formatPersonName } from '@/utils/formatters';
import RegistrationDetailsDialog from '@/components/event/table/dialogs/RegistrationDetailsDialog.vue';

export function useRegistrationAuditView(): AuditEntityView {
  const { t } = useI18n({ useScope: 'global' });
  const quasar = useQuasar();
  const store = useRegistrationsStore();
  const { fullName } = useRegistrationHelper();

  const find = (id: string) => store.data?.find((r) => r.id === id);

  return {
    icon: 'person',
    load: (eventId) => store.fetchData(eventId),

    // The log never stores participant data, so the name is only known while
    // the registration exists.
    subject(entry) {
      const registration = find(entry.entityId);
      if (registration) {
        return formatPersonName(fullName(registration));
      }
      // A "deleted" entry already says so in its title.
      return store.data && entry.action !== 'deleted'
        ? t('audit.entities.registration.deleted')
        : null;
    },

    exists: (id) => (store.data ? !!find(id) : null),

    open: {
      label: () => t('audit.entities.registration.view'),
      // The dialog reads the registration from the store, so refresh it first.
      async run(eventId, registrationId) {
        await store.fetchData(eventId).catch(() => undefined);
        if (!find(registrationId)) {
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
