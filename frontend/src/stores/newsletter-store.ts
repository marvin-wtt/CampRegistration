import { defineStore } from 'pinia';
import { useAPIService } from 'src/services/APIService';
import { useServiceHandler } from 'src/composables/serviceHandler';
import { useAuthBus } from 'src/composables/bus';
import type {
  Newsletter,
  NewsletterCreateData,
  NewsletterUpdateData,
} from '@camp-registration/common/entities';

export const useNewsletterStore = defineStore('newsletter', () => {
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
  } = useServiceHandler<Newsletter[]>('newsletter');

  authBus.on('logout', () => {
    reset();
  });

  async function fetchData() {
    await lazyFetch(async () => {
      return await api.fetchNewsletters();
    });
  }

  async function createData(newData: NewsletterCreateData) {
    await withProgressNotification('create', async () => {
      const newsletter = await api.createNewsletter(newData);
      data.value?.push(newsletter);
    });
  }

  async function updateData(id: string, updateData: NewsletterUpdateData) {
    checkNotNullWithError(id);
    await withProgressNotification('update', async () => {
      const newsletter = await api.updateNewsletter(id, updateData);
      data.value = data.value?.map((n) =>
        n.id === newsletter.id ? newsletter : n,
      );
    });
  }

  async function deleteData(id: string) {
    checkNotNullWithNotification(id);
    await withProgressNotification('delete', async () => {
      await api.deleteNewsletter(id);
      data.value = data.value?.filter((n) => n.id !== id);
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
    updateData,
    deleteData,
  };
});
