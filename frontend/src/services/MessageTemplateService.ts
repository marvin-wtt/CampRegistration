import type {
  MessageTemplate,
  MessageTemplateCreateData,
  MessageTemplateUpdateData,
} from '@camp-registration/common/entities';
import { api } from '@/services/api';

export function useMessageTemplateService() {
  async function fetchMessageTemplates(
    eventId: string,
  ): Promise<MessageTemplate[]> {
    const response = await api.get(`events/${eventId}/message-templates/`);

    return response?.data?.data;
  }

  async function fetchMessageTemplate(
    eventId: string,
    templateId: string,
  ): Promise<MessageTemplate> {
    const response = await api.get(
      `events/${eventId}/message-templates/${templateId}/`,
    );

    return response?.data?.data;
  }

  async function createMessageTemplate(
    eventId: string,
    data: MessageTemplateCreateData,
  ): Promise<MessageTemplate> {
    const response = await api.post(
      `events/${eventId}/message-templates/`,
      data,
    );

    return response?.data?.data;
  }

  async function updateMessageTemplate(
    eventId: string,
    templateId: string,
    data: MessageTemplateUpdateData,
  ): Promise<MessageTemplate> {
    const response = await api.patch(
      `events/${eventId}/message-templates/${templateId}/`,
      data,
    );

    return response?.data?.data;
  }

  async function deleteMessageTemplate(
    eventId: string,
    templateId: string,
  ): Promise<void> {
    await api.delete(`events/${eventId}/message-templates/${templateId}/`);
  }

  return {
    fetchMessageTemplates,
    fetchMessageTemplate,
    createMessageTemplate,
    updateMessageTemplate,
    deleteMessageTemplate,
  };
}
