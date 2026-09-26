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
  ): Promise<Message> {
    const response = await api.get(`events/${eventId}/messages/${messageId}/`);

    return response?.data?.data;
  }

  // The emails a registration received — manual messages and automated ones.
  async function fetchRegistrationMessages(
    eventId: string,
    registrationId: string,
  ): Promise<MessageDelivery[]> {
    const response = await api.get(
      `events/${eventId}/registrations/${registrationId}/messages/`,
    );

    return response?.data?.data;
  }

  // Renders the email's source again and sends it to the registration's
  // current addresses.
  async function resendRegistrationMessage(
    eventId: string,
    registrationId: string,
    deliveryId: string,
  ): Promise<void> {
    await api.post(
      `events/${eventId}/registrations/${registrationId}/messages/${deliveryId}/resend/`,
    );
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
    fetchRegistrationMessages,
    resendRegistrationMessage,
    createMessage,
    deleteMessage,
    duplicateMessageAttachments,
  };
}
