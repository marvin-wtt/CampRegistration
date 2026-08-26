import type {
  TableTemplate,
  TableTemplateCreateData,
  TableTemplateUpdateData,
} from '@camp-registration/common/entities';
import { api } from '@/services/api';

export function useTableTemplateService() {
  async function fetchTableTemplates(
    eventId: string,
  ): Promise<TableTemplate[]> {
    const response = await api.get(`events/${eventId}/table-templates/`);

    return response?.data?.data;
  }

  async function fetchTableTemplate(
    eventId: string,
    templateId: string,
  ): Promise<TableTemplate> {
    const response = await api.get(
      `events/${eventId}/table-templates/${templateId}/`,
    );

    return response?.data?.data;
  }

  async function createTableTemplate(
    eventId: string,
    data: TableTemplateCreateData,
  ): Promise<TableTemplate> {
    const response = await api.post(`events/${eventId}/table-templates/`, data);

    return response?.data?.data;
  }

  async function updateTableTemplate(
    eventId: string,
    templateId: string,
    data: TableTemplateUpdateData,
  ): Promise<TableTemplate> {
    const response = await api.put(
      `events/${eventId}/table-templates/${templateId}/`,
      data,
    );

    return response?.data?.data;
  }

  async function deleteTableTemplate(
    eventId: string,
    templateId: string,
  ): Promise<void> {
    await api.delete(`events/${eventId}/table-templates/${templateId}/`);
  }

  return {
    fetchTableTemplates,
    fetchTableTemplate,
    createTableTemplate,
    updateTableTemplate,
    deleteTableTemplate,
  };
}
