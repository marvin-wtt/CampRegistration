import type {
  MessageTemplate,
  MessageTemplateCreateData,
  MessageTemplateUpdateData,
} from '@camp-registration/common/entities';
import { api } from 'boot/axios';

export function useMessageTemplateService() {
  async function fetchMessageTemplates(
    campId: string,
  ): Promise<MessageTemplate[]> {
    const response = await api.get(`camps/${campId}/message-templates/`);

    return response?.data?.data;
  }

  async function fetchMessageTemplate(
    campId: string,
    templateId: string,
  ): Promise<MessageTemplate[]> {
    const response = await api.get(
      `camps/${campId}/message-templates/${templateId}/`,
    );

    return response?.data?.data;
  }

  async function createMessageTemplate(
    campId: string,
    data: MessageTemplateCreateData,
  ): Promise<MessageTemplate> {
    const response = await api.post(`camps/${campId}/message-templates/`, data);

    return response?.data?.data;
  }

  async function updateMessageTemplate(
    campId: string,
    templateId: string,
    data: MessageTemplateUpdateData,
  ): Promise<MessageTemplate> {
    const response = await api.put(
      `camps/${campId}/message-templates/${templateId}/`,
      data,
    );

    return response?.data?.data;
  }

  async function deleteMessageTemplate(
    campId: string,
    templateId: string,
  ): Promise<void> {
    await api.delete(`camps/${campId}/message-templates/${templateId}/`);
  }

  return {
    fetchMessageTemplates,
    fetchMessageTemplate,
    createMessageTemplate,
    updateMessageTemplate,
    deleteMessageTemplate,
  };
}
