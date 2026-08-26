import type {
  Message,
  MessageCreateData,
  MessageDelivery,
  ServiceFile,
} from '@camp-registration/common/entities';
import { api } from '@/services/api';

export function useMessageService() {
  async function fetchMessages(eventId: string): Promise<Message[]> {
    const response = await api.get(`events/${eventId}/messages/`);

    return response?.data?.data;
  }

  async function fetchMessage(
    eventId: string,
    messageId: string,
  ): Promise<MessageDelivery> {
    const response = await api.get(`events/${eventId}/messages/${messageId}/`);

    return response?.data?.data;
  }

  async function createMessage(
    eventId: string,
    data: MessageCreateData,
  ): Promise<Message> {
    const response = await api.post(`events/${eventId}/messages/`, data);

    return response?.data?.data;
  }

  async function deleteMessage(
    eventId: string,
    messageId: string,
  ): Promise<void> {
    await api.delete(`events/${eventId}/messages/${messageId}/`);
  }

  async function duplicateMessageAttachments(
    eventId: string,
    messageId: string,
  ): Promise<ServiceFile[]> {
    const response = await api.post(
      `events/${eventId}/messages/${messageId}/attachments/`,
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
