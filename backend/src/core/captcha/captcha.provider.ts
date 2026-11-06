import type {
  CaptchaAction,
  CaptchaClientConfig,
} from '@camp-registration/common/captcha';

// Origins the provider's browser widget loads from, added to the CSP.
export interface CaptchaCspSources {
  scriptSrc: readonly string[];
  frameSrc: readonly string[];
}

export interface CaptchaProvider {
  readonly cspSources: CaptchaCspSources;
  // Public settings the frontend renders its widget with.
  readonly clientConfig: CaptchaClientConfig;

  // Throws CaptchaUnavailableError if the provider can't be asked.
  verify(
    token: unknown,
    action: CaptchaAction,
    remoteIp?: string,
  ): Promise<boolean>;
}

export class CaptchaUnavailableError extends Error {}
