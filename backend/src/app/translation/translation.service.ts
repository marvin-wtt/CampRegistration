import { injectable } from 'inversify';
import { TranslationProviderFactory } from '#app/translation/translation.factory';
import type { TranslationProvider } from '#app/translation/translation.provider';
import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';
import config from '#config/index';
import logger from '#core/logger';

@injectable()
export class TranslationService {
  private readonly provider: TranslationProvider | undefined;

  constructor() {
    const factory = new TranslationProviderFactory();
    this.provider = factory.create(config.translation.driver);

    if (this.provider) {
      logger.info(`Using translation provider: ${this.provider.name}`);
    }
  }

  isAvailable(): boolean {
    return this.provider !== undefined;
  }

  async translate(
    text: string,
    targetLocale: string,
    sourceLocale?: string,
  ): Promise<string> {
    if (!this.provider) {
      throw new ApiError(
        httpStatus.SERVICE_UNAVAILABLE,
        'Translation is not configured.',
        true,
        undefined,
        'TRANSLATION_NOT_CONFIGURED',
      );
    }

    return this.provider.translate(text, targetLocale, sourceLocale);
  }
}
