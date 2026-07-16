import { defineStore } from 'pinia';
import { useAPIService } from '@/services/APIService';
import { useServiceHandler } from '@/composables/serviceHandler';
import { useAuthBus } from '@/composables/bus';
import type {
  NewsletterSubscriber,
  NewsletterSubscriberCreateData,
  NewsletterSubscriberImportData,
} from '@camp-registration/common/entities';

export const useNewsletterSubscriberStore = defineStore(
  'newsletterSubscriber',
  () => {
    const api = useAPIService();
    const authBus = useAuthBus();
    const {
      data,
      isLoading,
      error,
      reset,
      invalidate,
      withProgressNotification,
      lazyFetch,
      checkNotNullWithError,
      checkNotNullWithNotification,
    } = useServiceHandler<NewsletterSubscriber[]>('newsletterSubscriber');

    authBus.on('logout', reset);

    let lastNewsletterId: string | null = null;

    async function fetchData(newsletterId: string) {
      if (lastNewsletterId != null && lastNewsletterId !== newsletterId) {
        invalidate();
      }
      await lazyFetch(async () => {
        return await api.fetchNewsletterSubscribers(newsletterId);
      });
      lastNewsletterId = newsletterId;
    }

    async function createData(
      newsletterId: string,
      newData: NewsletterSubscriberCreateData,
    ) {
      checkNotNullWithError(newsletterId);
      await withProgressNotification('create', async () => {
        const subscriber = await api.createNewsletterSubscriber(
          newsletterId,
          newData,
        );
        data.value?.push(subscriber);
      });
    }

    async function importFromCamp(
      newsletterId: string,
      importData: NewsletterSubscriberImportData,
    ): Promise<{ added: number; skipped: number }> {
      checkNotNullWithError(newsletterId);
      let result = { added: 0, skipped: 0 };
      await withProgressNotification('import', async () => {
        result = await api.importNewsletterSubscribers(
          newsletterId,
          importData,
        );
        // Invalidate so it reloads on next fetch
        invalidate();
      });
      return result;
    }

    async function deleteData(newsletterId: string, subscriberId: string) {
      checkNotNullWithError(newsletterId);
      checkNotNullWithNotification(subscriberId);
      await withProgressNotification('delete', async () => {
        await api.deleteNewsletterSubscriber(newsletterId, subscriberId);
        data.value = data.value?.filter((s) => s.id !== subscriberId);
      });
    }

    return {
      reset,
      invalidate,
      data,
      isLoading,
      error,
      fetchData,
      createData,
      importFromCamp,
      deleteData,
    };
  },
);
