import { TranslationProvider } from '#app/translation/translation.provider';
import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';
import config from '#config/index';

interface AzureTranslateResponseItem {
  translations: { text: string; to: string }[];
}

export class AzureTranslatorProvider extends TranslationProvider {
  public readonly name = 'azure';

  public async translate(
    text: string,
    targetLocale: string,
    sourceLocale?: string,
  ): Promise<string> {
    const azure = config.translation.azure;
    if (!azure) {
      throw new Error('Translation provider is not configured.');
    }

    // Resolved against the configured endpoint *including* its path, so a
    // gateway base such as `https://host/translator` keeps its prefix — a
    // root-relative `/translate` would discard it.
    const base = azure.endpoint.endsWith('/')
      ? azure.endpoint
      : `${azure.endpoint}/`;
    const url = new URL('translate', base);
    url.searchParams.set('api-version', '3.0');
    url.searchParams.set('to', targetLocale);
    if (sourceLocale) {
      url.searchParams.set('from', sourceLocale);
    }

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': azure.key,
          'Ocp-Apim-Subscription-Region': azure.region,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([{ text }]),
      });
    } catch (error) {
      throw new ApiError(
        httpStatus.SERVICE_UNAVAILABLE,
        'Translation provider is temporarily unavailable.',
        {
          cause: error,
          code: 'TRANSLATION_PROVIDER_NETWORK_ERROR',
          fault: false,
        },
      );
    }

    if (!response.ok) {
      throw new ApiError(
        httpStatus.BAD_GATEWAY,
        'Translation provider request failed.',
        { code: 'TRANSLATION_PROVIDER_ERROR' },
      );
    }

    const data = (await response.json()) as AzureTranslateResponseItem[];
    const translated = data.at(0)?.translations.at(0)?.text;

    if (translated == null) {
      throw new ApiError(
        httpStatus.BAD_GATEWAY,
        'Translation provider returned an empty result.',
        { code: 'TRANSLATION_PROVIDER_ERROR' },
      );
    }

    return translated;
  }
}
