import { useApi } from 'src/composables/api';

export function useFeedbackService() {
  const api = useApi();

  async function sendFeedback(
    location: string,
    userAgent: string,
    message: string,
    email?: string | undefined,
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
