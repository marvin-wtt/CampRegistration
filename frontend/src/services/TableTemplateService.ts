import type {
  TableTemplate,
  TableTemplateCreateData,
  TableTemplateUpdateData,
} from '@camp-registration/common/entities';
import { api } from 'boot/axios';

export function useTableTemplateService() {
  async function fetchTableTemplates(campId: string): Promise<TableTemplate[]> {
    const response = await api.get(`camps/${campId}/templates/`);

    return response?.data?.data;
  }

  async function fetchTableTemplate(
    campId: string,
    templateId: string,
  ): Promise<TableTemplate[]> {
    const response = await api.get(`camps/${campId}/templates/${templateId}/`);

    return response?.data?.data;
  }

  async function createTableTemplate(
    campId: string,
    data: TableTemplateCreateData,
  ): Promise<TableTemplate> {
    const response = await api.post(`camps/${campId}/templates/`, data);

    return response?.data?.data;
  }

  async function updateTableTemplate(
    campId: string,
    templateId: string,
    data: TableTemplateUpdateData,
  ): Promise<TableTemplate> {
    const response = await api.put(
      `camps/${campId}/templates/${templateId}/`,
      data,
    );

    return response?.data?.data;
  }

  async function deleteTableTemplate(
    campId: string,
    templateId: string,
  ): Promise<void> {
    await api.delete(`camps/${campId}/templates/${templateId}/`);
  }

  return {
    fetchTableTemplates,
    fetchTableTemplate,
    createTableTemplate,
    updateTableTemplate,
    deleteTableTemplate,
  };
}
