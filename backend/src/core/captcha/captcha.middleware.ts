import type { Request } from 'express';
import httpStatus from 'http-status';
import {
  type CaptchaAction,
  CAPTCHA_TOKEN_HEADER,
} from '@camp-registration/common/captcha';
import ApiError from '#core/router/ApiError';
import { catchMiddlewareAsync } from '#core/router/catchAsync';
import { resolve } from '#core/ioc/container';
import logger from '#core/logger';
import { describeError } from '#utils/errors';
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
  // `warn`, not `error`: an outage is not a fault worth reporting, but every
  // protected form is failing while it lasts.
  logger.warn(
    `Captcha provider unavailable; rejecting submission: ${describeError(error)}`,
  );
  throw new ApiError(
    httpStatus.SERVICE_UNAVAILABLE,
    'Bot protection is temporarily unavailable.',
    { cause: error, code: 'CAPTCHA_UNAVAILABLE', fault: false },
  );
}
