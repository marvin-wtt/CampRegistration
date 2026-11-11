import { defineStore } from 'pinia';
import { useAPIService } from '@/services/APIService';
import { useCollection, useRouteKey } from '@/composables/resource';
import { removeById } from '@/utils/collection';
import type { NewsletterMessage } from '@camp-registration/common/entities';

export const useNewsletterMessageStore = defineStore(
  'newsletterMessage',
  () => {
    const api = useAPIService();
    const messages = useCollection<NewsletterMessage>({
      name: 'newsletterMessage',
      key: useRouteKey('newsletterId'),
      fetch: (newsletterId) => api.fetchNewsletterMessages(newsletterId),
    });

    function fetchData(newsletterId: string) {
      return messages.load(newsletterId);
    }

    async function deleteData(
      newsletterId: string,
      messageId: string,
    ): Promise<void> {
      await messages.mutate(
        'delete',
        (key) => api.deleteNewsletterMessage(key, messageId),
        {
          key: newsletterId,
          feedback: 'progress',
          apply: (list) => removeById(list, messageId),
        },
      );
    }

    return {
      data: messages.data,
      isLoading: messages.isLoading,
      error: messages.error,
      reset: messages.reset,
      invalidate: messages.invalidate,
      fetchData,
      deleteData,
    };
  },
);
