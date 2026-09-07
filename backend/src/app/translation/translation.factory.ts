import type { TranslationProvider } from '#app/translation/translation.provider';
import { AzureTranslatorProvider } from '#app/translation/providers/azure-translator.provider';
import { DeepLTranslatorProvider } from '#app/translation/providers/deepl-translator.provider';
import { GoogleTranslatorProvider } from '#app/translation/providers/google-translator.provider';

export class TranslationProviderFactory {
  private providers: Partial<Record<string, new () => TranslationProvider>> = {
    azure: AzureTranslatorProvider,
    deepl: DeepLTranslatorProvider,
    google: GoogleTranslatorProvider,
  };

  create(driver: string | undefined): TranslationProvider | undefined {
    if (!driver) {
      return undefined;
    }

    const cls = this.providers[driver];

    return cls ? new cls() : undefined;
  }
}
