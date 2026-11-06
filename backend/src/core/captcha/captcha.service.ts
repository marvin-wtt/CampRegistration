import { injectable } from 'inversify';
import type {
  CaptchaAction,
  CaptchaClientConfig,
} from '@camp-registration/common/captcha';
import config, { type AppConfig } from '#config/index';
import type { CaptchaCspSources, CaptchaProvider } from './captcha.provider.js';
import { TurnstileProvider } from './turnstile.provider.js';

export function createCaptchaProvider(
  captchaConfig: AppConfig['captcha'],
): CaptchaProvider | undefined {
  switch (captchaConfig.driver) {
    case 'turnstile':
      if (!captchaConfig.turnstile) {
        throw new Error('Turnstile is not configured.');
      }
      return new TurnstileProvider(captchaConfig.turnstile);
    case undefined:
      return undefined;
  }
}

// The configured provider; every method is a no-op while CAPTCHA_DRIVER is
// unset.
@injectable()
export class CaptchaService {
  private readonly provider = createCaptchaProvider(config.captcha);

  get enabled(): boolean {
    return this.provider !== undefined;
  }

  get clientConfig(): CaptchaClientConfig {
    return this.provider?.clientConfig ?? { driver: null };
  }

  get cspSources(): CaptchaCspSources | undefined {
    return this.provider?.cspSources;
  }

  async verify(
    token: unknown,
    action: CaptchaAction,
    remoteIp?: string,
  ): Promise<boolean> {
    return this.provider?.verify(token, action, remoteIp) ?? true;
  }
}
