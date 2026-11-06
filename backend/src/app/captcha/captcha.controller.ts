import { inject, injectable } from 'inversify';
import type { Request, Response } from 'express';
import { BaseController } from '#core/base/BaseController';
import { CaptchaService } from '#core/captcha/captcha.service';
import { CaptchaConfigResource } from './captcha.resource.js';

@injectable()
export class CaptchaController extends BaseController {
  constructor(
    @inject(CaptchaService)
    private readonly captchaService: CaptchaService,
  ) {
    super();
  }

  // Public: the widget needs it before anyone signs in.
  config(_req: Request, res: Response) {
    res.resource(new CaptchaConfigResource(this.captchaService.clientConfig));
  }
}
