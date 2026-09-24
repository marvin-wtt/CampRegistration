import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import type { AuditEntityView } from '@/composables/audit/auditEntityView';
import { useAPIService } from '@/services/APIService';
import { useRegistrationsStore } from '@/stores/registration-store';
import MessageDetailsDialog from '@/components/event/contact/MessageDetailsDialog.vue';

export function useMessageAuditView(): AuditEntityView {
  const { t } = useI18n({ useScope: 'global' });
  const quasar = useQuasar();
  const apiService = useAPIService();
  const registrationsStore = useRegistrationsStore();

  return {
    icon: 'mail',

    open: {
      label: () => t('audit.entities.message.view'),
      async run(eventId, messageId) {
        const message = await apiService
          .fetchMessage(eventId, messageId)
          .catch(() => null);
        if (!message) {
          quasar.notify({
            type: 'negative',
            message: t('audit.entities.message.gone'),
          });
          return;
        }
        // Recipient names come from the store; the dialog falls back without it.
        await registrationsStore.fetchData(eventId).catch(() => undefined);
        quasar.dialog({
          component: MessageDetailsDialog,
          componentProps: {
            message,
            registrations: registrationsStore.data ?? [],
          },
        });
      },
    },
  };
}
