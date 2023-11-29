import {
  TableTemplate,
  TemplateCreateData,
  TemplateUpdateData,
} from 'src/types/TableTemplate';
import { api } from 'boot/axios';

export function useTemplateService() {
  async function fetchResultTemplates(
    campId: string,
  ): Promise<TableTemplate[]> {
    const response = await api.get(`camps/${campId}/templates/`);

    return response.data.data;
  }

  async function fetchResultTemplate(
    campId: string,
    templateId: string,
  ): Promise<TableTemplate[]> {
    const response = await api.get(`camps/${campId}/templates/${templateId}/`);

    return response.data.data;
  }

  async function createResultTemplate(
    campId: string,
    data: TemplateCreateData,
  ): Promise<void> {
    await api.post(`camps/${campId}/templates/`, data);
  }

  async function updateResultTemplate(
    campId: string,
    templateId: string,
    data: TemplateUpdateData,
  ): Promise<void> {
    await api.put(`camps/${campId}/templates/${templateId}/`, data);
  }

  async function deleteResultTemplate(
    campId: string,
    templateId: string,
  ): Promise<void> {
    await api.delete(`camps/${campId}/templates/${templateId}/`);
  }

  return {
    fetchResultTemplates,
    fetchResultTemplate,
    createResultTemplate,
    updateResultTemplate,
    deleteResultTemplate,
  };
}
