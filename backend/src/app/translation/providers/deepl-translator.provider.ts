import { TranslationProvider } from '#app/translation/translation.provider';
import ApiError from '#utils/ApiError';
import httpStatus from 'http-status';
import config from '#config/index';

interface DeepLTranslateResponse {
  translations: { text: string; detected_source_language: string }[];
}

export class DeepLTranslatorProvider extends TranslationProvider {
  public readonly name = 'deepl';

  public async translate(
    text: string,
    targetLocale: string,
    sourceLocale?: string,
  ): Promise<string> {
    const deepl = config.translation.deepl;
    if (!deepl) {
      throw new Error('Translation provider is not configured.');
    }

    // DeepL wants uppercase codes separated by `-`. `target_lang` accepts a
    // region (`EN-US`, `PT-BR`); `source_lang` rejects one, so it is reduced to
    // the bare language.
    const targetLang = targetLocale.replace('_', '-').toUpperCase();
    const sourceLang = sourceLocale?.split(/[_-]/)[0]?.toUpperCase();

    let response: Response;
    try {
      response = await fetch(`${deepl.url}/v2/translate`, {
        method: 'POST',
        headers: {
          Authorization: `DeepL-Auth-Key ${deepl.key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: [text],
          target_lang: targetLang,
          source_lang: sourceLang,
        }),
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
        {
          code: 'TRANSLATION_PROVIDER_ERROR',
        },
      );
    }

    const data = (await response.json()) as DeepLTranslateResponse;
    const translated = data.translations.at(0)?.text;

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
