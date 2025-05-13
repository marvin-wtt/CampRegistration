import { type AxiosInstance } from 'axios';
import { inject } from 'vue';

export function useApi() {
  const api = inject<AxiosInstance>('api');

  if (!api) {
    throw new Error(
      '[useApi] API instance not found. Did you register the axios boot file?',
    );
  }

  return api;
}
