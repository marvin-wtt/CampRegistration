import { defineStore } from 'pinia';
import { useAPIService } from '@/services/APIService';
import { useCollection } from '@/composables/resource';
import { removeById, replaceById, upsertById } from '@/utils/collection';
import type {
  Newsletter,
  NewsletterCreateData,
  NewsletterUpdateData,
} from '@camp-registration/common/entities';

/** The newsletters the signed-in user manages. */
export const useNewsletterStore = defineStore('newsletter', () => {
  const api = useAPIService();
  const newsletters = useCollection<Newsletter>({
    name: 'newsletter',
    fetch: () => api.fetchNewsletters(),
  });

  function fetchData() {
    return newsletters.load();
  }

  // Adds a newsletter the list doesn't hold (e.g. opened by link). Its own
  // page reports failures through the manager/subscriber/message stores.
  async function fetchById(id: string): Promise<void> {
    if (newsletters.data.value?.some((n) => n.id === id)) {
      return;
    }
    const newsletter = await api.fetchNewsletter(id).catch(() => undefined);
    if (newsletter) {
      newsletters.update((list) => upsertById(list, newsletter));
    }
  }

  async function createData(createData: NewsletterCreateData): Promise<void> {
    await newsletters.mutate('create', () => api.createNewsletter(createData), {
      feedback: 'progress',
      apply: upsertById,
    });
  }

  async function updateData(
    id: string,
    updateData: NewsletterUpdateData,
  ): Promise<void> {
    await newsletters.mutate(
      'update',
      () => api.updateNewsletter(id, updateData),
      { feedback: 'progress', apply: replaceById },
    );
  }

  async function deleteData(id: string): Promise<void> {
    await newsletters.mutate('delete', () => api.deleteNewsletter(id), {
      feedback: 'progress',
      apply: (list) => removeById(list, id),
    });
  }

  return {
    data: newsletters.data,
    isLoading: newsletters.isLoading,
    error: newsletters.error,
    reset: newsletters.reset,
    invalidate: newsletters.invalidate,
    fetchData,
    fetchById,
    createData,
    updateData,
    deleteData,
  };
});
