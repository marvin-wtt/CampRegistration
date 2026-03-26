import { defineStore } from 'pinia';
import { useAPIService } from 'src/services/APIService';
import { useServiceHandler } from 'src/composables/serviceHandler';
import { useAuthBus } from 'src/composables/bus';
import type {
  NewsletterManager,
  NewsletterManagerCreateData,
} from '@camp-registration/common/entities';

export const useNewsletterManagerStore = defineStore(
  'newsletterManager',
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
    } = useServiceHandler<NewsletterManager[]>('newsletterManager');

    authBus.on('logout', () => {
      reset();
    });

    async function fetchData(newsletterId: string) {
      const nid = checkNotNullWithError(newsletterId);
      await lazyFetch(async () => {
        return await api.fetchNewsletterManagers(nid);
      });
    }

    async function createData(
      newsletterId: string,
      newData: NewsletterManagerCreateData,
    ) {
      checkNotNullWithError(newsletterId);
      await withProgressNotification('create', async () => {
        const manager = await api.createNewsletterManager(
          newsletterId,
          newData,
        );
        data.value?.push(manager);
      });
    }

    async function deleteData(newsletterId: string, managerId: string) {
      checkNotNullWithError(newsletterId);
      checkNotNullWithNotification(managerId);
      await withProgressNotification('delete', async () => {
        await api.deleteNewsletterManager(newsletterId, managerId);
        data.value = data.value?.filter((m) => m.id !== managerId);
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
      deleteData,
    };
  },
);
