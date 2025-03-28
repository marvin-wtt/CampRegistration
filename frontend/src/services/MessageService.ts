import type {
  Message,
  MessageCreateData,
} from '@camp-registration/common/entities';
import { api } from 'boot/axios';

export function useMessageService() {
  async function fetchMessages(campId: string): Promise<Message[]> {
    const response = await api.get(`camps/${campId}/message/`);

    return response?.data?.data;
  }

  async function fetchMessage(
    campId: string,
    messageId: string,
  ): Promise<Message> {
    const response = await api.get(`camps/${campId}/message/${messageId}/`);

    return response?.data?.data;
  }

  async function createMessage(
    campId: string,
    data: MessageCreateData,
  ): Promise<Message> {
    const response = await api.post(`camps/${campId}/message/`, data);

    return response?.data?.data;
  }

  async function deleteMessage(
    campId: string,
    messageId: string,
  ): Promise<void> {
    await api.delete(`camps/${campId}/message/${messageId}/`);
  }

  return {
    fetchMessages,
    fetchMessage,
    createMessage,
    deleteMessage,
  };
}
