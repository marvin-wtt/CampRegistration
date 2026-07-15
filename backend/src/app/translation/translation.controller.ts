import { inject, injectable } from 'inversify';
import { BaseController } from '#core/base/BaseController';
import { TranslationService } from '#app/translation/translation.service';
import validator from './translation.validation.js';
import {
  TranslationResultResource,
  TranslationStatusResource,
} from './translation.resource.js';
import type { Request, Response } from 'express';

@injectable()
export class TranslationController extends BaseController {
  constructor(
    @inject(TranslationService)
    private readonly translationService: TranslationService,
  ) {
    super();
  }

  status(_req: Request, res: Response) {
    const available = this.translationService.isAvailable();

    res.resource(new TranslationStatusResource({ available }));
  }

  async translate(req: Request, res: Response) {
    const {
      body: { text, targetLocale, sourceLocale },
    } = await req.validate(validator.translate);

    const translatedText = await this.translationService.translate(
      text,
      targetLocale,
      sourceLocale,
    );

    res.resource(new TranslationResultResource({ text: translatedText }));
  }
}
