import { api } from '@/services/api';
import type {
  Newsletter,
  NewsletterCreateData,
  NewsletterUpdateData,
  NewsletterQuery,
  CursorPaginated,
} from '@camp-registration/common/entities';

export function useNewsletterService() {
  async function fetchNewsletters(
    params?: NewsletterQuery,
  ): Promise<Newsletter[]> {
    const response = await api.get('newsletters/', { params });
    return response?.data?.data;
  }

  async function fetchNewslettersPaginated(
    params?: NewsletterQuery,
  ): Promise<CursorPaginated<Newsletter>> {
    const response = await api.get('newsletters/', { params });
    return {
      data: response?.data?.data,
      meta: response?.data?.meta,
    };
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

  return {
    fetchNewsletters,
    fetchNewslettersPaginated,
    fetchNewsletter,
    createNewsletter,
    updateNewsletter,
    deleteNewsletter,
  };
}
