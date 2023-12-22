import { api } from 'boot/axios';

export function useFeedbackService() {
  async function sendFeedback(
    message: string,
    email?: string | undefined,
  ): Promise<void> {
    const response = await api.post('feedback/', {
      message,
      email,
    });

    return response.data.data;
  }

  return {
    sendFeedback,
  };
}
