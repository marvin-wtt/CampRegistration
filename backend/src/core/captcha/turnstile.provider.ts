import type {
  CaptchaAction,
  CaptchaClientConfig,
} from '@camp-registration/common/captcha';
import {
  type CaptchaCspSources,
  type CaptchaProvider,
  CaptchaUnavailableError,
} from './captcha.provider.js';

const ORIGIN = 'https://challenges.cloudflare.com';
const SITEVERIFY_URL = `${ORIGIN}/turnstile/v0/siteverify`;
const MAX_TOKEN_LENGTH = 2048;
const TIMEOUT_MS = 10_000;

// Siteverify errors that say nothing about the visitor.
const UNAVAILABLE_ERROR_CODES = new Set(['internal-error']);
const MISCONFIGURED_ERROR_CODES = new Set([
  'missing-input-secret',
  'invalid-input-secret',
]);

export interface TurnstileOptions {
  siteKey: string;
  secret: string;
  hostnames: readonly string[];
}

interface SiteverifyResponse {
  success?: unknown;
  action?: unknown;
  hostname?: unknown;
  'error-codes'?: unknown;
}

// Siteverify redeems a token once, so replays fail upstream.
export class TurnstileProvider implements CaptchaProvider {
  // The widget loads a script and renders its challenge in an iframe.
  readonly cspSources: CaptchaCspSources = {
    scriptSrc: [ORIGIN],
    frameSrc: [ORIGIN],
  };

  readonly clientConfig: CaptchaClientConfig;

  constructor(private readonly options: TurnstileOptions) {
    this.clientConfig = { driver: 'turnstile', siteKey: options.siteKey };
  }

  async verify(
    token: unknown,
    action: CaptchaAction,
    remoteIp?: string,
  ): Promise<boolean> {
    if (
      typeof token !== 'string' ||
      token.length === 0 ||
      token.length > MAX_TOKEN_LENGTH ||
      this.options.hostnames.length === 0
    ) {
      return false;
    }

    const body = new URLSearchParams({
      secret: this.options.secret,
      response: token,
    });
    if (remoteIp) {
      body.set('remoteip', remoteIp);
    }

    const result = await this.siteverify(body);

    const errorCodes = Array.isArray(result['error-codes'])
      ? result['error-codes'].filter(
          (code): code is string => typeof code === 'string',
        )
      : [];
    if (errorCodes.some((code) => MISCONFIGURED_ERROR_CODES.has(code))) {
      // A fault, not an outage: logged and reported.
      throw new Error('Turnstile rejected TURNSTILE_SECRET.');
    }
    if (errorCodes.some((code) => UNAVAILABLE_ERROR_CODES.has(code))) {
      throw new CaptchaUnavailableError('Turnstile siteverify internal error');
    }

    return (
      result.success === true &&
      result.action === action &&
      typeof result.hostname === 'string' &&
      this.options.hostnames.includes(result.hostname.toLowerCase())
    );
  }

  private async siteverify(body: URLSearchParams): Promise<SiteverifyResponse> {
    const unavailable = (cause: unknown) =>
      new CaptchaUnavailableError('Turnstile siteverify failed', { cause });

    const response = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    }).catch((error: unknown) => {
      throw unavailable(error);
    });
    if (!response.ok) {
      throw unavailable(`Siteverify responded with ${String(response.status)}`);
    }

    return (await response.json().catch((error: unknown) => {
      throw unavailable(error);
    })) as SiteverifyResponse;
  }
}
