import { api } from 'boot/axios';
import type {
  Newsletter,
  NewsletterCreateData,
  NewsletterMessage,
  NewsletterSendData,
  NewsletterUpdateData,
  NewsLetterQuery,
} from '@camp-registration/common/entities';

export function useNewsletterService() {
  async function fetchNewsletters(
    params?: NewsLetterQuery,
  ): Promise<Newsletter[]> {
    const response = await api.get('newsletters/', { params });
    return response?.data?.data;
  }

  async function fetchNewsletter(id: string): Promise<Newsletter> {
    const response = await api.get(`newsletters/${id}/`);
    return response?.data?.data;
  }

  async function createNewsletter(
    data: NewsletterCreateData,
  ): Promise<Newsletter> {
    const response = await api.post('newsletters/', data);
    return response?.data?.data;
  }

  async function updateNewsletter(
    id: string,
    data: NewsletterUpdateData,
  ): Promise<Newsletter> {
    const response = await api.patch(`newsletters/${id}/`, data);
    return response?.data?.data;
  }

  async function deleteNewsletter(id: string): Promise<void> {
    await api.delete(`newsletters/${id}/`);
  }

  async function sendNewsletter(
    id: string,
    data: NewsletterSendData,
  ): Promise<{ queued: number }> {
    const response = await api.post(`newsletters/${id}/send/`, data);
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
    fetchNewsletters,
    fetchNewsletter,
    createNewsletter,
    updateNewsletter,
    deleteNewsletter,
    sendNewsletter,
    fetchNewsletterMessages,
    deleteNewsletterMessage,
  };
}
