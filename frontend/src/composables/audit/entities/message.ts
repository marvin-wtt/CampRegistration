import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import type { Message } from '@camp-registration/common/entities';
import type { AuditEntityView } from '@/composables/audit/auditEntityView';
import { useAPIService } from '@/services/APIService';
import { useRegistrationsStore } from '@/stores/registration-store';
import MessageDetailsDialog from '@/components/event/contact/MessageDetailsDialog.vue';

export function useMessageAuditView(): AuditEntityView {
  const { t } = useI18n({ useScope: 'global' });
  const quasar = useQuasar();
  const apiService = useAPIService();
  const registrationsStore = useRegistrationsStore();

  const messages = ref<Message[] | null>(null);
  const find = (id: string) => messages.value?.find((m) => m.id === id);

  async function load(eventId: string): Promise<void> {
    messages.value = await apiService.fetchMessages(eventId);
  }

  return {
    icon: 'mail',
    load,
    exists: (id) => (messages.value ? !!find(id) : null),

    open: {
      label: () => t('audit.entities.message.view'),
      async run(eventId, messageId) {
        await load(eventId).catch(() => undefined);
        const message = find(messageId);
        if (!message) {
          quasar.notify({
            type: 'negative',
            message: t('audit.entities.message.gone'),
          });
          return;
        }
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
