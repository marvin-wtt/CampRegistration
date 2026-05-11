import { api } from 'boot/axios';
import type {
  NewsletterManager,
  NewsletterManagerCreateData,
} from '@camp-registration/common/entities';

export function useNewsletterManagerService() {
  async function fetchNewsletterManagers(
    newsletterId: string,
  ): Promise<NewsletterManager[]> {
    const response = await api.get(`newsletters/${newsletterId}/managers/`);
    return response?.data?.data;
  }

  async function createNewsletterManager(
    newsletterId: string,
    data: NewsletterManagerCreateData,
  ): Promise<NewsletterManager> {
    const response = await api.post(
      `newsletters/${newsletterId}/managers/`,
      data,
    );
    return response?.data?.data;
  }

  async function deleteNewsletterManager(
    newsletterId: string,
    managerId: string,
  ): Promise<void> {
    await api.delete(`newsletters/${newsletterId}/managers/${managerId}/`);
  }

  return {
    fetchNewsletterManagers,
    createNewsletterManager,
    deleteNewsletterManager,
  };
}
