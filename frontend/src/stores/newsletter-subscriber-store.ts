import { defineStore } from 'pinia';
import { useAPIService } from '@/services/APIService';
import { useCollection, useRouteKey } from '@/composables/resource';
import { removeById, upsertById } from '@/utils/collection';
import type {
  NewsletterSubscriber,
  NewsletterSubscriberCreateData,
  NewsletterSubscriberImportData,
} from '@camp-registration/common/entities';

export const useNewsletterSubscriberStore = defineStore(
  'newsletterSubscriber',
  () => {
    const api = useAPIService();
    const subscribers = useCollection<NewsletterSubscriber>({
      name: 'newsletterSubscriber',
      key: useRouteKey('newsletterId'),
      fetch: (newsletterId) => api.fetchNewsletterSubscribers(newsletterId),
    });

    function fetchData(newsletterId: string) {
      return subscribers.load(newsletterId);
    }

    async function createData(
      newsletterId: string,
      createData: NewsletterSubscriberCreateData,
    ): Promise<void> {
      await subscribers.mutate(
        'create',
        (key) => api.createNewsletterSubscriber(key, createData),
        { key: newsletterId, feedback: 'progress', apply: upsertById },
      );
    }

    // Adds many at once; the list is reloaded to show them.
    function importFromEvent(
      newsletterId: string,
      importData: NewsletterSubscriberImportData,
    ): Promise<{ added: number; skipped: number }> {
      return subscribers.mutate(
        'import',
        (key) => api.importNewsletterSubscribers(key, importData),
        { key: newsletterId, feedback: 'progress', reload: true },
      );
    }

    async function deleteData(
      newsletterId: string,
      subscriberId: string,
    ): Promise<void> {
      await subscribers.mutate(
        'delete',
        (key) => api.deleteNewsletterSubscriber(key, subscriberId),
        {
          key: newsletterId,
          feedback: 'progress',
          apply: (list) => removeById(list, subscriberId),
        },
      );
    }

    return {
      data: subscribers.data,
      isLoading: subscribers.isLoading,
      error: subscribers.error,
      reset: subscribers.reset,
      invalidate: subscribers.invalidate,
      fetchData,
      createData,
      importFromEvent,
      deleteData,
    };
  },
);
