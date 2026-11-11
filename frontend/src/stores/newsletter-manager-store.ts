import { defineStore } from 'pinia';
import { useAPIService } from '@/services/APIService';
import { useCollection, useRouteKey } from '@/composables/resource';
import { removeById, upsertById } from '@/utils/collection';
import type {
  NewsletterManager,
  NewsletterManagerCreateData,
} from '@camp-registration/common/entities';

export const useNewsletterManagerStore = defineStore(
  'newsletterManager',
  () => {
    const api = useAPIService();
    const managers = useCollection<NewsletterManager>({
      name: 'newsletterManager',
      key: useRouteKey('newsletterId'),
      fetch: (newsletterId) => api.fetchNewsletterManagers(newsletterId),
    });

    function fetchData(newsletterId: string) {
      return managers.load(newsletterId);
    }

    async function createData(
      newsletterId: string,
      createData: NewsletterManagerCreateData,
    ): Promise<void> {
      await managers.mutate(
        'create',
        (key) => api.createNewsletterManager(key, createData),
        { key: newsletterId, feedback: 'progress', apply: upsertById },
      );
    }

    async function deleteData(
      newsletterId: string,
      managerId: string,
    ): Promise<void> {
      await managers.mutate(
        'delete',
        (key) => api.deleteNewsletterManager(key, managerId),
        {
          key: newsletterId,
          feedback: 'progress',
          apply: (list) => removeById(list, managerId),
        },
      );
    }

    return {
      data: managers.data,
      isLoading: managers.isLoading,
      error: managers.error,
      reset: managers.reset,
      invalidate: managers.invalidate,
      fetchData,
      createData,
      deleteData,
    };
  },
);
