import { TranslationProvider } from '#app/translation/translation.provider';
import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';
import config from '#config/index';

interface GoogleTranslateResponse {
  data: {
    translations: { translatedText: string }[];
  };
}

export class GoogleTranslatorProvider extends TranslationProvider {
  public readonly name = 'google';

  public async translate(
    text: string,
    targetLocale: string,
    sourceLocale?: string,
  ): Promise<string> {
    const google = config.translation.google;
    if (!google) {
      throw new Error('Translation provider is not configured.');
    }

    const url = new URL(
      'https://translation.googleapis.com/language/translate/v2',
    );
    url.searchParams.set('key', google.key);

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: text,
          target: targetLocale,
          source: sourceLocale,
          format: 'text',
        }),
      });
    } catch (error) {
      throw new ApiError(
        httpStatus.SERVICE_UNAVAILABLE,
        'Translation provider is temporarily unavailable.',
        true,
        error instanceof Error ? error.stack : undefined,
        'TRANSLATION_PROVIDER_NETWORK_ERROR',
      );
    }

    if (!response.ok) {
      throw new ApiError(
        httpStatus.BAD_GATEWAY,
        'Translation provider request failed.',
        false,
        undefined,
        'TRANSLATION_PROVIDER_ERROR',
      );
    }

    const data = (await response.json()) as GoogleTranslateResponse;
    const translated = data.data.translations.at(0)?.translatedText;

    if (translated == null) {
      throw new ApiError(
        httpStatus.BAD_GATEWAY,
        'Translation provider returned an empty result.',
        false,
        undefined,
        'TRANSLATION_PROVIDER_ERROR',
      );
    }

    return translated;
  }
}
