import type {
  Message,
  MessageCreateData,
} from '@camp-registration/common/entities';
import { useApi } from 'src/composables/api';

export function useMessageService() {
  const api = useApi();

  async function fetchMessages(campId: string): Promise<Message[]> {
    const response = await api.get(`camps/${campId}/messages/`);

    return response?.data?.data;
  }

  async function fetchMessage(
    campId: string,
    messageId: string,
  ): Promise<Message> {
    const response = await api.get(`camps/${campId}/messages/${messageId}/`);

    return response?.data?.data;
  }

  async function createMessage(
    campId: string,
    data: MessageCreateData,
  ): Promise<Message[]> {
    const response = await api.post(`camps/${campId}/messages/`, data);

    return response?.data?.data;
  }

  async function deleteMessage(
    campId: string,
    messageId: string,
  ): Promise<void> {
    await api.delete(`camps/${campId}/messages/${messageId}/`);
  }

  return {
    fetchMessages,
    fetchMessage,
    createMessage,
    deleteMessage,
  };
}
