import { api } from 'boot/axios';

export function useFeedbackService() {
  async function sendFeedback(
    location: string,
    userAgent: string,
    message: string,
    email?: string,
  ): Promise<void> {
    const response = await api.post('feedback/', {
      location,
      userAgent,
      message,
      email,
    });

    return response?.data?.data;
  }

  return {
    sendFeedback,
  };
}
