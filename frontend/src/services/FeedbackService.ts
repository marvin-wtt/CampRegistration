import { api } from '@/services/api';

export interface FeedbackData {
  message: string;
  name?: string | undefined;
  email?: string | undefined;
  location?: string;
  userAgent?: string;
}

export function useFeedbackService() {
  async function sendFeedback(data: FeedbackData): Promise<void> {
    const response = await api.post('feedback/', data);

    return response?.data?.data;
  }

  return {
    sendFeedback,
  };
}
