import type { Request } from 'express';
import httpStatus from 'http-status';
import {
  type CaptchaAction,
  CAPTCHA_TOKEN_HEADER,
} from '@camp-registration/common/captcha';
import ApiError from '#utils/ApiError';
import { catchMiddlewareAsync } from '#utils/catchAsync';
import { resolve } from '#core/ioc/container';
import { CaptchaUnavailableError } from './captcha.provider.js';
import { CaptchaService } from './captcha.service.js';

// Gates a public form against bots. A no-op while CAPTCHA_DRIVER is unset.
export function captcha(action: CaptchaAction) {
  return catchMiddlewareAsync(async (req: Request) => {
    const captchaService = resolve(CaptchaService);
    if (!captchaService.enabled) {
      return;
    }

    const valid = await captchaService
      .verify(req.get(CAPTCHA_TOKEN_HEADER), action, req.ip)
      .catch(toUnavailableError);

    if (!valid) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Bot verification failed.', {
        code: 'CAPTCHA_FAILED',
      });
    }
  });
}

function toUnavailableError(error: unknown): never {
  if (!(error instanceof CaptchaUnavailableError)) {
    throw error;
  }
  throw new ApiError(
    httpStatus.SERVICE_UNAVAILABLE,
    'Bot protection is temporarily unavailable.',
    { cause: error, code: 'CAPTCHA_UNAVAILABLE', fault: false },
  );
}
