import { api } from 'boot/axios';

export function useFeedbackService() {
  async function sendFeedback(
    location: string,
    message: string,
    email?: string | undefined,
  ): Promise<void> {
    const response = await api.post('feedback/', {
      location,
      message,
      email,
    });

    return response.data.data;
  }

  return {
    sendFeedback,
  };
}
