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
    const reasons: unknown[] = [];
    results.forEach((result, index) => {
      const targetLocale = targetLocales[index];

      if (result.status === 'fulfilled') {
        translations[targetLocale] = result.value;
      } else {
        reasons.push(result.reason);
        logger.warn(
          `Translation to "${targetLocale}" failed: ${String(result.reason)}`,
        );
        translations[targetLocale] = null;
      }
    });

    // A partial failure still returns the locales that did work. A total one
    // has nothing to show for it, so the provider's error is raised rather than
    // an all-`null` 200 the client renders as a spinner that resolves to
    // nothing.
    if (reasons.length === results.length) {
      throw reasons[0] instanceof ApiError
        ? reasons[0]
        : new ApiError(httpStatus.BAD_GATEWAY, 'Translation failed.', {
            cause: reasons[0],
            code: 'TRANSLATION_PROVIDER_ERROR',
          });
    }

    return translations;
  }
}
