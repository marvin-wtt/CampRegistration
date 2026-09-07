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
    targetLocales: string[],
    sourceLocale?: string,
  ): Promise<Record<string, string | null>> {
    if (!this.provider) {
      throw new ApiError(
        httpStatus.SERVICE_UNAVAILABLE,
        'Translation is not configured.',
        { code: 'TRANSLATION_NOT_CONFIGURED', fault: false },
      );
    }

    const provider = this.provider;
    const results = await Promise.allSettled(
      targetLocales.map((targetLocale) =>
        provider.translate(text, targetLocale, sourceLocale),
      ),
    );

    const translations: Record<string, string | null> = {};
    results.forEach((result, index) => {
      const targetLocale = targetLocales[index];

      if (result.status === 'fulfilled') {
        translations[targetLocale] = result.value;
      } else {
        logger.warn(
          `Translation to "${targetLocale}" failed: ${String(result.reason)}`,
        );
        translations[targetLocale] = null;
      }
    });

    return translations;
  }
}
