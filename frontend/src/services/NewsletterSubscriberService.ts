import { api } from '@/services/api';
import type {
  NewsletterSubscriber,
  NewsletterSubscriberCreateData,
  NewsletterSubscriberImportData,
} from '@camp-registration/common/entities';

export function useNewsletterSubscriberService() {
  async function fetchNewsletterSubscribers(
    newsletterId: string,
  ): Promise<NewsletterSubscriber[]> {
    const response = await api.get(`newsletters/${newsletterId}/subscribers/`);
    return response?.data?.data;
  }

  async function createNewsletterSubscriber(
    newsletterId: string,
    data: NewsletterSubscriberCreateData,
  ): Promise<NewsletterSubscriber> {
    const response = await api.post(
      `newsletters/${newsletterId}/subscribers/`,
      data,
    );
    return response?.data?.data;
  }

  async function importNewsletterSubscribers(
    newsletterId: string,
    data: NewsletterSubscriberImportData,
  ): Promise<{ added: number; skipped: number }> {
    const response = await api.post(
      `newsletters/${newsletterId}/subscribers/import/`,
      data,
    );
    return response?.data?.data;
  }

  async function deleteNewsletterSubscriber(
    newsletterId: string,
    subscriberId: string,
  ): Promise<void> {
    await api.delete(
      `newsletters/${newsletterId}/subscribers/${subscriberId}/`,
    );
  }

  async function unsubscribeByToken(token: string): Promise<void> {
    await api.delete(`newsletters/unsubscribe/${token}/`);
  }

  return {
    fetchNewsletterSubscribers,
    createNewsletterSubscriber,
    importNewsletterSubscribers,
    deleteNewsletterSubscriber,
    unsubscribeByToken,
  };
}
