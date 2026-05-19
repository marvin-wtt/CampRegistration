import { defineStore } from 'pinia';
import { useAPIService } from 'src/services/APIService';
import { useServiceHandler } from 'src/composables/serviceHandler';
import { useAuthBus } from 'src/composables/bus';
import type { NewsletterMessage } from '@camp-registration/common/entities';

export const useNewsletterMessageStore = defineStore(
  'newsletterMessage',
  () => {
    const api = useAPIService();
    const authBus = useAuthBus();
    const {
      data,
      isLoading,
      error,
      reset,
      invalidate,
      lazyFetch,
      withProgressNotification,
    } = useServiceHandler<NewsletterMessage[]>('newsletterMessage');

    authBus.on('logout', reset);

    let lastNewsletterId: string | null = null;

    async function fetchData(newsletterId: string) {
      if (lastNewsletterId != null && lastNewsletterId !== newsletterId) {
        invalidate();
      }
      await lazyFetch(async () => {
        return await api.fetchNewsletterMessages(newsletterId);
      });
      lastNewsletterId = newsletterId;
    }

    async function deleteData(newsletterId: string, messageId: string) {
      await withProgressNotification('delete', async () => {
        await api.deleteNewsletterMessage(newsletterId, messageId);
        data.value = data.value?.filter((m) => m.id !== messageId);
      });
    }

    return {
      reset,
      invalidate,
      data,
      isLoading,
      error,
      fetchData,
      deleteData,
    };
  },
);
