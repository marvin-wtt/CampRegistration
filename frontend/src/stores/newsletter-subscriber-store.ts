import { defineStore } from 'pinia';
import { useAPIService } from 'src/services/APIService';
import { useServiceHandler } from 'src/composables/serviceHandler';
import { useAuthBus } from 'src/composables/bus';
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

    authBus.on('logout', () => {
      reset();
    });

    async function fetchData(newsletterId: string) {
      const nid = checkNotNullWithError(newsletterId);
      await lazyFetch(async () => {
        return await api.fetchNewsletterSubscribers(nid);
      });
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
      await withProgressNotification('create', async () => {
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
