import { api } from '@/services/api';
import type {
  TranslationResult,
  TranslationStatus,
} from '@camp-registration/common/entities';

export function useTranslationService() {
  async function fetchTranslationStatus(): Promise<TranslationStatus> {
    const response = await api.get('translation/status');
    return response?.data?.data;
  }

  async function translateText(
    text: string,
    targetLocales: string[],
    sourceLocale?: string,
  ): Promise<Record<string, string | null>> {
    const response = await api.post('translation', {
      text,
      targetLocales,
      sourceLocale,
    });
    const result: TranslationResult | undefined = response?.data?.data;

    return result?.translations ?? {};
  }

  return { fetchTranslationStatus, translateText };
}
