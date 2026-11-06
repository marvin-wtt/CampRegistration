import { api } from '@/services/api';
import type { CaptchaClientConfig } from '@camp-registration/common/captcha';

// Fixed for the backend's lifetime, so fetched once per page load.
let config: Promise<CaptchaClientConfig> | undefined;

export function useCaptchaService() {
  function fetchCaptchaConfig(): Promise<CaptchaClientConfig> {
    config ??= api.get('captcha').then(
      (response) => response?.data?.data as CaptchaClientConfig,
      (error: unknown) => {
        // Let the next submit try again.
        config = undefined;
        throw error;
      },
    );

    return config;
  }

  return { fetchCaptchaConfig };
}
