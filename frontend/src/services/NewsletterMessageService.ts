import { api } from 'boot/axios';
import type {
  NewsletterMessage,
  NewsletterMessageCreateData,
} from '@camp-registration/common/entities';

export function useNewsletterMessageService() {
  async function sendNewsletterMessage(
    id: string,
    data: NewsletterMessageCreateData,
  ): Promise<void> {
    const response = await api.post(`newsletters/${id}/messages/`, data);
    return response?.data?.data;
  }

  async function fetchNewsletterMessages(
    newsletterId: string,
  ): Promise<NewsletterMessage[]> {
    const response = await api.get(`newsletters/${newsletterId}/messages/`);
    return response?.data?.data;
  }

  async function deleteNewsletterMessage(
    newsletterId: string,
    messageId: string,
  ): Promise<void> {
    await api.delete(`newsletters/${newsletterId}/messages/${messageId}/`);
  }

  return {
    sendNewsletterMessage,
    fetchNewsletterMessages,
    deleteNewsletterMessage,
  };
}
