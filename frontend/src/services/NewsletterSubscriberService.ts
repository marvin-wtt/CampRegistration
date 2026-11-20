import { api } from '@/services/api';
import type {
  NewsletterConfirmation,
  NewsletterSubscriber,
  NewsletterSubscriberCreateData,
  NewsletterSubscriberImportData,
  NewsletterSubscriberImportResult,
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
  ): Promise<NewsletterSubscriberImportResult> {
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

  async function resendNewsletterConfirmation(
    newsletterId: string,
    subscriberId: string,
  ): Promise<NewsletterSubscriber> {
    const response = await api.post(
      `newsletters/${newsletterId}/subscribers/${subscriberId}/resend-confirmation/`,
    );
    return response?.data?.data;
  }

  async function fetchNewsletterConfirmation(
    token: string,
  ): Promise<NewsletterConfirmation> {
    const response = await api.get(`newsletters/confirm/${token}/`);
    return response?.data?.data;
  }

  async function confirmNewsletterSubscription(token: string): Promise<void> {
    await api.post(`newsletters/confirm/${token}/`);
  }

  async function unsubscribeByToken(token: string): Promise<void> {
    await api.delete(`newsletters/unsubscribe/${token}/`);
  }

  return {
    fetchNewsletterSubscribers,
    createNewsletterSubscriber,
    importNewsletterSubscribers,
    deleteNewsletterSubscriber,
    resendNewsletterConfirmation,
    fetchNewsletterConfirmation,
    confirmNewsletterSubscription,
    unsubscribeByToken,
  };
}
