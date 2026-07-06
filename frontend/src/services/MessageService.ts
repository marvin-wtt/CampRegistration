import type {
  Message,
  MessageCreateData,
  MessageDelivery,
  ServiceFile,
} from '@camp-registration/common/entities';
import { api } from '@/services/api';

export function useMessageService() {
  async function fetchMessages(campId: string): Promise<Message[]> {
    const response = await api.get(`camps/${campId}/messages/`);

    return response?.data?.data;
  }

  async function fetchMessage(
    campId: string,
    messageId: string,
  ): Promise<MessageDelivery> {
    const response = await api.get(`camps/${campId}/messages/${messageId}/`);

    return response?.data?.data;
  }

  async function createMessage(
    campId: string,
    data: MessageCreateData,
  ): Promise<Message> {
    const response = await api.post(`camps/${campId}/messages/`, data);

    return response?.data?.data;
  }

  async function deleteMessage(
    campId: string,
    messageId: string,
  ): Promise<void> {
    await api.delete(`camps/${campId}/messages/${messageId}/`);
  }

  async function duplicateMessageAttachments(
    campId: string,
    messageId: string,
  ): Promise<ServiceFile[]> {
    const response = await api.post(
      `camps/${campId}/messages/${messageId}/attachments/`,
    );

    return response?.data?.data;
  }

  return {
    fetchMessages,
    fetchMessage,
    createMessage,
    deleteMessage,
    duplicateMessageAttachments,
  };
}
